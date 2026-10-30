export const STAGES = {
  LEAD_CAPTURED: 'LEAD_CAPTURED',
  QUALIFIED: 'QUALIFIED',
  DISCOVERY_CALL: 'DISCOVERY_CALL',
  PROPOSAL_SENT: 'PROPOSAL_SENT',
  NEGOTIATION: 'NEGOTIATION',
  CLOSED_WON: 'CLOSED_WON',
  CLOSED_LOST: 'CLOSED_LOST'
}

export const STAGE_ORDER = [
  STAGES.LEAD_CAPTURED,
  STAGES.QUALIFIED,
  STAGES.DISCOVERY_CALL,
  STAGES.PROPOSAL_SENT,
  STAGES.NEGOTIATION,
  STAGES.CLOSED_WON
]

export const STAGE_LABELS = {
  LEAD_CAPTURED: 'Lead Captured',
  QUALIFIED: 'Sales Qualified (SQL)',
  DISCOVERY_CALL: 'Discovery & Scoping',
  PROPOSAL_SENT: 'Proposal Sent',
  NEGOTIATION: 'Procurement & Negotiation',
  CLOSED_WON: 'Closed Won',
  CLOSED_LOST: 'Closed Lost'
}

export const BENCHMARKS = {
  LEAD_CAPTURED: { expectedConversionPct: 0.65, expectedCycleDays: 5.0, maxHealthyDays: 10 },
  QUALIFIED: { expectedConversionPct: 0.70, expectedCycleDays: 7.0, maxHealthyDays: 14 },
  DISCOVERY_CALL: { expectedConversionPct: 0.75, expectedCycleDays: 10.0, maxHealthyDays: 20 },
  PROPOSAL_SENT: { expectedConversionPct: 0.60, expectedCycleDays: 12.0, maxHealthyDays: 20 },
  NEGOTIATION: { expectedConversionPct: 0.70, expectedCycleDays: 14.0, maxHealthyDays: 25 }
}

export const ROLES = {
  REVOPS_ADMIN: 'revops_admin',
  SALES_MANAGER: 'sales_manager',
  SALES_REP: 'sales_rep'
}

export const INTERACTION_TYPES = {
  EMAIL_SENT: 'EMAIL_SENT',
  EMAIL_OPENED: 'EMAIL_OPENED',
  EMAIL_REPLY: 'EMAIL_REPLY',
  DEMO_CALL: 'DEMO_CALL',
  DISCOVERY_CALL: 'DISCOVERY_CALL',
  PROPOSAL_REVIEW: 'PROPOSAL_REVIEW',
  SECURITY_AUDIT: 'SECURITY_AUDIT',
  EXECUTIVE_SPONSOR_MEETING: 'EXECUTIVE_SPONSOR_MEETING',
  CONTRACT_REDLINE: 'CONTRACT_REDLINE'
}

export const ML_CONFIG = {
  DEFAULT_LEARNING_RATE: 0.05,
  DEFAULT_EPOCHS: 300,
  L2_PENALTY: 0.01,
  HIGH_CONVERSION_THRESHOLD: 0.70,
  MEDIUM_RISK_THRESHOLD: 0.40
}
