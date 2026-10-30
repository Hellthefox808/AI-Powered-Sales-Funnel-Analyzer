import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { createApp } from '../src/app.js'
import { closeDb } from '../src/data/database.js'

describe('Security & RBAC Enforcement Suite', () => {
  let server
  let baseUrl
  let db
  let repToken
  let adminToken

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

    const repLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alex.miller@funnel.ai', password: 'password123' })
    })
    const repData = await repLoginRes.json()
    repToken = repData.token

    const adminLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@funnel.ai', password: 'password123' })
    })
    const adminData = await adminLoginRes.json()
    adminToken = adminData.token
  })

  after(() => {
    if (server) server.close()
    if (db) closeDb(db)
  })

  it('rejects unauthenticated requests to protected endpoints with 401', async () => {
    const res = await fetch(`${baseUrl}/pipeline/funnel`)
    assert.equal(res.status, 401)
    const body = await res.json()
    assert.equal(body.success, false)
    assert.ok(body.error.includes('token required'))
  })

  it('enforces RBAC: sales_rep cannot update benchmark targets (requires revops_admin)', async () => {
    const res = await fetch(`${baseUrl}/bottlenecks/benchmarks/PROPOSAL_SENT`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${repToken}`
      },
      body: JSON.stringify({
        expectedConversionPct: 0.8,
        expectedCycleDays: 8,
        maxHealthyDays: 15
      })
    })
    assert.equal(res.status, 403)
    const body = await res.json()
    assert.equal(body.success, false)
    assert.ok(body.error.includes('lacks permission'))
  })

  it('allows revops_admin to update benchmark targets', async () => {
    const res = await fetch(`${baseUrl}/bottlenecks/benchmarks/PROPOSAL_SENT`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        expectedConversionPct: 0.65,
        expectedCycleDays: 11,
        maxHealthyDays: 22
      })
    })
    assert.equal(res.status, 200)
    const body = await res.json()
    assert.ok(body.success)
    assert.equal(body.benchmark.expected_conversion_pct, 0.65)
  })

  it('enforces RBAC: sales_rep cannot trigger model retraining', async () => {
    const res = await fetch(`${baseUrl}/models/retrain`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${repToken}`
      },
      body: JSON.stringify({ epochs: 50 })
    })
    assert.equal(res.status, 403)
  })

  it('rejects malformed and tampered authorization tokens', async () => {
    const res = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: 'Bearer totally.fake.jwt-signature' }
    })
    assert.equal(res.status, 401)
  })
})
