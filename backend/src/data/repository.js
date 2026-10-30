import { v4 as uuidv4 } from 'uuid'

export class Repository {
  constructor (db) {
    this.db = db
  }

  // Users
  getUserByEmail (email) {
    return this.db.prepare('SELECT * FROM users WHERE email = ?').get(email) || null
  }

  getUserById (id) {
    return this.db.prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?').get(id) || null
  }

  getAllUsers () {
    return this.db.prepare('SELECT id, name, email, role, created_at FROM users ORDER BY name ASC').all()
  }

  // Accounts
  getAccounts () {
    return this.db.prepare('SELECT * FROM accounts ORDER BY name ASC').all()
  }

  getAccountById (id) {
    return this.db.prepare('SELECT * FROM accounts WHERE id = ?').get(id) || null
  }

  // Contacts
  getContactsByAccountId (accountId) {
    return this.db.prepare('SELECT * FROM contacts WHERE account_id = ? ORDER BY seniority ASC').all(accountId)
  }

  getContactsByDealId (dealId) {
    return this.db.prepare(`
      SELECT DISTINCT c.* 
      FROM contacts c
      JOIN deals d ON d.account_id = c.account_id
      WHERE d.id = ?
      ORDER BY c.seniority ASC
    `).all(dealId)
  }

  // Deals
  getAllDeals (filters = {}) {
    let query = `
      SELECT d.*, 
             a.name as account_name, a.domain as account_domain, a.industry as account_industry, a.tier as account_tier, a.employee_count as account_employees,
             u.name as owner_name, u.email as owner_email
      FROM deals d
      JOIN accounts a ON d.account_id = a.id
      JOIN users u ON d.owner_id = u.id
      WHERE 1=1
    `
    const params = []

    if (filters.stage) {
      query += ' AND d.stage = ?'
      params.push(filters.stage)
    }
    if (filters.status) {
      query += ' AND d.status = ?'
      params.push(filters.status)
    }
    if (filters.ownerId) {
      query += ' AND d.owner_id = ?'
      params.push(filters.ownerId)
    }

    query += ' ORDER BY d.created_at DESC'
    return this.db.prepare(query).all(...params)
  }

  getDealById (id) {
    return this.db.prepare(`
      SELECT d.*, 
             a.name as account_name, a.domain as account_domain, a.industry as account_industry, a.tier as account_tier, a.employee_count as account_employees, a.annual_revenue as account_annual_revenue,
             u.name as owner_name, u.email as owner_email
      FROM deals d
      JOIN accounts a ON d.account_id = a.id
      JOIN users u ON d.owner_id = u.id
      WHERE d.id = ?
    `).get(id) || null
  }

  getClosedDeals () {
    return this.db.prepare(`
      SELECT d.*, a.employee_count, a.annual_revenue, a.industry
      FROM deals d
      JOIN accounts a ON d.account_id = a.id
      WHERE d.status IN ('WON', 'LOST')
      ORDER BY d.closed_at DESC
    `).all()
  }

  updateDealStage (id, newStage, daysInStage = 0, status = 'OPEN', lossReason = null) {
    const now = new Date().toISOString()
    const closedAt = (status === 'WON' || status === 'LOST') ? now : null

    this.db.prepare(`
      UPDATE deals
      SET stage = ?, days_in_stage = ?, stage_entered_at = ?, status = ?, loss_reason = ?, closed_at = ?
      WHERE id = ?
    `).run(newStage, daysInStage, now, status, lossReason, closedAt, id)

    return this.getDealById(id)
  }

  // Interactions
  getInteractionsByDealId (dealId) {
    return this.db.prepare(`
      SELECT i.*, c.name as contact_name, c.email as contact_email, c.role_title as contact_role_title, c.seniority as contact_seniority
      FROM interactions i
      LEFT JOIN contacts c ON i.contact_id = c.id
      WHERE i.deal_id = ?
      ORDER BY i.timestamp DESC
    `).all(dealId)
  }

  createInteraction ({ dealId, contactId, type, sentiment, notes, timestamp = null }) {
    const id = uuidv4()
    const ts = timestamp || new Date().toISOString()
    this.db.prepare(`
      INSERT INTO interactions (id, deal_id, contact_id, type, sentiment, notes, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, dealId, contactId, type, sentiment, notes, ts)
    return { id, deal_id: dealId, contact_id: contactId, type, sentiment, notes, timestamp: ts }
  }

  // Benchmarks
  getBenchmarks () {
    return this.db.prepare('SELECT * FROM funnel_benchmarks').all()
  }

  getBenchmarkForStage (stage) {
    return this.db.prepare('SELECT * FROM funnel_benchmarks WHERE stage = ?').get(stage) || null
  }

  updateBenchmark (stage, { expectedConversionPct, expectedCycleDays, maxHealthyDays }) {
    this.db.prepare(`
      UPDATE funnel_benchmarks
      SET expected_conversion_pct = ?, expected_cycle_days = ?, max_healthy_days = ?
      WHERE stage = ?
    `).run(expectedConversionPct, expectedCycleDays, maxHealthyDays, stage)
    return this.getBenchmarkForStage(stage)
  }

  // Models & Predictions
  saveModel ({ algorithm, parametersJson, metricsJson, trainingSamples, isActive = 1 }) {
    const id = uuidv4()
    if (isActive) {
      this.db.prepare('UPDATE ml_models SET is_active = 0').run()
    }
    this.db.prepare(`
      INSERT INTO ml_models (id, algorithm, parameters_json, metrics_json, training_samples, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, algorithm, parametersJson, metricsJson, trainingSamples, isActive ? 1 : 0)
    return this.getModelById(id)
  }

  getActiveModel () {
    return this.db.prepare('SELECT * FROM ml_models WHERE is_active = 1 ORDER BY created_at DESC LIMIT 1').get() || null
  }

  getModelById (id) {
    return this.db.prepare('SELECT * FROM ml_models WHERE id = ?').get(id) || null
  }

  getAllModels () {
    return this.db.prepare('SELECT * FROM ml_models ORDER BY created_at DESC').all()
  }

  savePrediction ({ dealId, modelId, probability, classification, factorsJson, recommendedAction }) {
    const id = uuidv4()
    this.db.prepare(`
      INSERT INTO ml_predictions_log (id, deal_id, model_id, probability, classification, factors_json, recommended_action)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, dealId, modelId, probability, classification, factorsJson, recommendedAction)
    return { id, dealId, modelId, probability, classification, factorsJson, recommendedAction }
  }

  getLatestPredictionForDeal (dealId) {
    return this.db.prepare(`
      SELECT * FROM ml_predictions_log
      WHERE deal_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `).get(dealId) || null
  }

  // Audit Logs
  createAuditLog ({ userId, action, targetType, targetId = null, details = {} }) {
    const id = uuidv4()
    this.db.prepare(`
      INSERT INTO audit_logs (id, user_id, action, target_type, target_id, details_json)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, userId, action, targetType, targetId, JSON.stringify(details))
    return { id, userId, action, targetType, targetId, details }
  }
}
