import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { getDb, closeDb } from '../src/data/database.js'
import { seedDatabase } from '../src/data/seedData.js'
import { Repository } from '../src/data/repository.js'
import { MLService } from '../src/service/mlService.js'
import { PipelineService } from '../src/service/pipelineService.js'
import { BottleneckService } from '../src/service/bottleneckService.js'

describe('Bottleneck Service — Anomaly Detection & Friction Playbooks', () => {
  let db
  let repository
  let mlService
  let pipelineService
  let bottleneckService

  before(async () => {
    db = getDb(':memory:')
    await seedDatabase(db)
    repository = new Repository(db)
    mlService = new MLService(repository)
    await mlService.ensureActiveModel()
    pipelineService = new PipelineService(repository, mlService)
    bottleneckService = new BottleneckService(repository, pipelineService)
  })

  after(() => {
    closeDb(db)
  })

  it('detects pipeline bottlenecks, flags stalled deals, and calculates revenue at risk', async () => {
    const report = await bottleneckService.detectBottlenecks()

    assert.ok(report.activeBottlenecks.length > 0)
    assert.ok(report.totalRevenueAtRisk > 0)

    const proposalBottleneck = report.activeBottlenecks.find(b => b.stage === 'PROPOSAL_SENT')
    assert.ok(proposalBottleneck, 'Proposal Sent should be detected as a bottleneck')
    assert.ok(proposalBottleneck.stalledDealsCount > 0)
    assert.ok(proposalBottleneck.revenueAtRisk > 0)
    assert.ok(proposalBottleneck.recommendedPlaybook.length > 20)
  })
})
