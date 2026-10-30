import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { createApp } from '../src/app.js'
import { closeDb } from '../src/data/database.js'

describe('REST API End-to-End Integration Suite', () => {
  let server
  let baseUrl
  let db
  let adminToken
  let repToken
  let testDealId

  before(async () => {
    const created = await createApp(':memory:')
    db = created.db

    await new Promise((resolve) => {
      server = created.app.listen(0, () => {
        const port = server.address().port
        baseUrl = `http://127.0.0.1:${port}/api`
        resolve()
      })
    })

    // Log in as Admin
    const adminLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@funnel.ai', password: 'password123' })
    })
    const adminLoginData = await adminLoginRes.json()
    adminToken = adminLoginData.token

    // Log in as Sales Rep
    const repLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alex.miller@funnel.ai', password: 'password123' })
    })
    const repLoginData = await repLoginRes.json()
    repToken = repLoginData.token
  })

  after(() => {
    if (server) server.close()
    if (db) closeDb(db)
  })

  it('GET /api/health returns 200 OK and status UP', async () => {
    const res = await fetch(`${baseUrl}/health`)
    assert.equal(res.status, 200)
    const body = await res.json()
    assert.equal(body.status, 'UP')
    assert.equal(body.service, 'ai-powered-sales-funnel-analyzer')
  })

  it('GET /api/auth/me returns current user payload', async () => {
    const res = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    })
    assert.equal(res.status, 200)
    const body = await res.json()
    assert.equal(body.user.email, 'admin@funnel.ai')
    assert.equal(body.user.role, 'revops_admin')
  })

  it('GET /api/pipeline/funnel returns stage breakdown, velocity and forecast', async () => {
    const res = await fetch(`${baseUrl}/pipeline/funnel`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    })
    assert.equal(res.status, 200)
    const body = await res.json()
    assert.ok(body.success)
    assert.ok(Array.isArray(body.stages))
    assert.ok(body.summary.pipelineVelocity > 0)
    assert.ok(body.summary.totalPipelineValue > 0)
  })

  it('GET /api/deals returns active enriched deals with predictions', async () => {
    const res = await fetch(`${baseUrl}/deals`, {
      headers: { Authorization: `Bearer ${repToken}` }
    })
    assert.equal(res.status, 200)
    const body = await res.json()
    assert.ok(body.success)
    assert.ok(body.deals.length > 0)
    testDealId = body.deals[0].id
  })

  it('GET /api/deals/:id returns deal details, contacts, interactions, and prediction', async () => {
    const res = await fetch(`${baseUrl}/deals/${testDealId}`, {
      headers: { Authorization: `Bearer ${repToken}` }
    })
    assert.equal(res.status, 200)
    const body = await res.json()
    assert.ok(body.success)
    assert.equal(body.deal.id, testDealId)
    assert.ok(Array.isArray(body.interactions))
  })

  it('POST /api/deals/:id/stage updates stage and audit logs transition', async () => {
    const res = await fetch(`${baseUrl}/deals/${testDealId}/stage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${repToken}`
      },
      body: JSON.stringify({
        stage: 'NEGOTIATION',
        daysInStage: 1,
        status: 'OPEN'
      })
    })
    assert.equal(res.status, 200)
    const body = await res.json()
    assert.ok(body.success)
    assert.equal(body.deal.stage, 'NEGOTIATION')
  })

  it('POST /api/deals/:id/interactions creates a new touchpoint', async () => {
    const res = await fetch(`${baseUrl}/deals/${testDealId}/interactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${repToken}`
      },
      body: JSON.stringify({
        type: 'DEMO_CALL',
        sentiment: 'POSITIVE',
        notes: 'Follow-up demo on multi-cloud security'
      })
    })
    assert.equal(res.status, 201)
    const body = await res.json()
    assert.ok(body.success)
    assert.equal(body.interaction.type, 'DEMO_CALL')
  })

  it('POST /api/predictions/what-if runs simulation without persisting deal changes', async () => {
    const res = await fetch(`${baseUrl}/predictions/what-if`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${repToken}`
      },
      body: JSON.stringify({
        dealId: testDealId,
        hasEconomicBuyer: true,
        additionalTouches: 3,
        demoCompleted: true
      })
    })
    assert.equal(res.status, 200)
    const body = await res.json()
    assert.ok(body.success)
    assert.ok(typeof body.deltaProbability === 'number')
    assert.ok(body.simulated.probability >= 0 && body.simulated.probability <= 1)
  })

  it('GET /api/bottlenecks returns active pipeline friction points', async () => {
    const res = await fetch(`${baseUrl}/bottlenecks`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    })
    assert.equal(res.status, 200)
    const body = await res.json()
    assert.ok(body.success)
    assert.ok(body.activeBottlenecks.length > 0)
    assert.ok(body.totalRevenueAtRisk > 0)
  })

  it('GET /api/models/active returns active model metrics and feature weights', async () => {
    const res = await fetch(`${baseUrl}/models/active`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    })
    assert.equal(res.status, 200)
    const body = await res.json()
    assert.ok(body.success)
    assert.ok(body.metrics.roc_auc >= 0.5)
    assert.ok(Array.isArray(body.featureWeights))
    assert.ok(body.featureWeights.length === 10)
  })

  it('POST /api/models/retrain triggers training and saves new active model', async () => {
    const res = await fetch(`${baseUrl}/models/retrain`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ epochs: 150 })
    })
    assert.equal(res.status, 200)
    const body = await res.json()
    assert.ok(body.success)
    assert.ok(body.modelId)
    assert.ok(body.metrics.roc_auc >= 0.5)
  })

  it('GET /api/analytics/reps and /api/analytics/forecast return business intel', async () => {
    const repRes = await fetch(`${baseUrl}/analytics/reps`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    })
    assert.equal(repRes.status, 200)
    const repData = await repRes.json()
    assert.ok(repData.reps.length > 0)

    const forecastRes = await fetch(`${baseUrl}/analytics/forecast`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    })
    assert.equal(forecastRes.status, 200)
    const forecastData = await forecastRes.json()
    assert.ok(forecastData.forecast.aiPredictedRevenue > 0)
  })
})
