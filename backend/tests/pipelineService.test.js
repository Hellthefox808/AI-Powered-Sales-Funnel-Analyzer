import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { getDb, closeDb } from '../src/data/database.js'
import { seedDatabase } from '../src/data/seedData.js'
import { Repository } from '../src/data/repository.js'
import { MLService } from '../src/service/mlService.js'
import { PipelineService } from '../src/service/pipelineService.js'

describe('Pipeline Service — Funnel Stages, Velocity & Enrichment', () => {
  let db
  let repository
  let mlService
  let pipelineService

  before(async () => {
    db = getDb(':memory:')
    await seedDatabase(db)
    repository = new Repository(db)
    mlService = new MLService(repository)
    await mlService.ensureActiveModel()
    pipelineService = new PipelineService(repository, mlService)
  })

  after(() => {
    closeDb(db)
  })

  it('calculates funnel metrics with stages, velocity, and AI predicted revenue', async () => {
    const metrics = await pipelineService.getFunnelMetrics()

    assert.ok(metrics.stages.length >= 5)
    assert.ok(metrics.summary.totalPipelineValue > 500000)
    assert.ok(metrics.summary.pipelineVelocity > 0)
    assert.ok(metrics.summary.aiPredictedRevenue > 0)
    assert.ok(metrics.summary.overallConversionRate > 0)

    const proposalStage = metrics.stages.find(s => s.stage === 'PROPOSAL_SENT')
    assert.ok(proposalStage)
    assert.equal(proposalStage.label, 'Proposal Sent')
    assert.ok(proposalStage.count > 0)
    assert.ok(proposalStage.avgDays > 0)
  })

  it('enriches active deals with ML conversion probability and classifications', async () => {
    const enriched = await pipelineService.getEnrichedDeals({ status: 'OPEN' })

    assert.ok(enriched.length > 0)
    for (const d of enriched) {
      assert.ok(d.prediction)
      assert.ok(typeof d.prediction.probability === 'number')
      assert.ok(d.prediction.probability >= 0 && d.prediction.probability <= 1)
      assert.ok(['HIGH_CONVERSION', 'MEDIUM_RISK', 'LOW_CONVERSION'].includes(d.prediction.classification))
    }
  })

  it('retrieves single deal with full contact and interaction timeline', async () => {
    const deals = repository.getAllDeals()
    const targetDeal = deals[0]

    const fullDeal = await pipelineService.getDealWithTimeline(targetDeal.id)

    assert.equal(fullDeal.deal.id, targetDeal.id)
    assert.ok(Array.isArray(fullDeal.interactions))
    assert.ok(Array.isArray(fullDeal.contacts))
  })
})
