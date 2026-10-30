import { DatabaseSync } from 'node:sqlite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { BENCHMARKS } from '../config/constants.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let activeDb = null

export function getDb (customPath = null) {
  if (activeDb && !customPath) {
    return activeDb
  }

  const dbPath = customPath || process.env.DB_PATH || path.resolve(__dirname, '../../sales_funnel.db')
  const db = new DatabaseSync(dbPath)

  if (dbPath !== ':memory:') {
    try {
      db.exec('PRAGMA journal_mode = WAL;')
      db.exec('PRAGMA foreign_keys = ON;')
      db.exec('PRAGMA busy_timeout = 5000;')
    } catch {
      // Memory or certain environments can ignore WAL pragma safely
    }
  }

  initSchema(db)

  if (!customPath) {
    activeDb = db
  }

  return db
}

export function closeDb (db = null) {
  const target = db || activeDb
  if (target) {
    try {
      target.close()
    } catch {
      // Ignored if already closed
    }
    if (target === activeDb) {
      activeDb = null
    }
  }
}

export function initSchema (db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      domain TEXT NOT NULL,
      industry TEXT NOT NULL,
      employee_count INTEGER NOT NULL,
      annual_revenue REAL NOT NULL,
      tier TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      role_title TEXT NOT NULL,
      seniority TEXT NOT NULL,
      is_champion INTEGER DEFAULT 0,
      is_economic_buyer INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS deals (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      title TEXT NOT NULL,
      stage TEXT NOT NULL,
      acv REAL NOT NULL,
      owner_id TEXT NOT NULL,
      days_in_stage INTEGER DEFAULT 0,
      stage_entered_at TEXT NOT NULL,
      status TEXT NOT NULL,
      loss_reason TEXT,
      competitor TEXT,
      discount_pct REAL DEFAULT 0.0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      closed_at TEXT,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
      FOREIGN KEY (owner_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS interactions (
      id TEXT PRIMARY KEY,
      deal_id TEXT NOT NULL,
      contact_id TEXT,
      type TEXT NOT NULL,
      sentiment TEXT NOT NULL,
      notes TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE,
      FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS ml_models (
      id TEXT PRIMARY KEY,
      algorithm TEXT NOT NULL,
      parameters_json TEXT NOT NULL,
      metrics_json TEXT NOT NULL,
      training_samples INTEGER NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ml_predictions_log (
      id TEXT PRIMARY KEY,
      deal_id TEXT NOT NULL,
      model_id TEXT NOT NULL,
      probability REAL NOT NULL,
      classification TEXT NOT NULL,
      factors_json TEXT NOT NULL,
      recommended_action TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE,
      FOREIGN KEY (model_id) REFERENCES ml_models(id)
    );

    CREATE TABLE IF NOT EXISTS funnel_benchmarks (
      stage TEXT PRIMARY KEY,
      expected_conversion_pct REAL NOT NULL,
      expected_cycle_days REAL NOT NULL,
      max_healthy_days REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      action TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT,
      details_json TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(stage);
    CREATE INDEX IF NOT EXISTS idx_deals_status ON deals(status);
    CREATE INDEX IF NOT EXISTS idx_deals_owner ON deals(owner_id);
    CREATE INDEX IF NOT EXISTS idx_interactions_deal ON interactions(deal_id);
    CREATE INDEX IF NOT EXISTS idx_contacts_account ON contacts(account_id);
  `)

  // Seed funnel benchmarks if empty
  const benchmarkCheck = db.prepare('SELECT COUNT(*) as count FROM funnel_benchmarks').get()
  if (benchmarkCheck.count === 0) {
    const insertBenchmark = db.prepare(`
      INSERT INTO funnel_benchmarks (stage, expected_conversion_pct, expected_cycle_days, max_healthy_days)
      VALUES (?, ?, ?, ?)
    `)
    for (const [stage, bench] of Object.entries(BENCHMARKS)) {
      insertBenchmark.run(stage, bench.expectedConversionPct, bench.expectedCycleDays, bench.maxHealthyDays)
    }
  }
}
