import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { STAGES, ROLES, INTERACTION_TYPES } from '../config/constants.js'

export async function seedDatabase (db) {
  const existingUsers = db.prepare('SELECT COUNT(*) as count FROM users').get()
  if (existingUsers.count > 0) {
    return
  }

  const salt = bcrypt.genSaltSync(10)
  const defaultHash = bcrypt.hashSync('password123', salt)

  // 1. Seed Users
  const users = [
    { id: uuidv4(), name: 'Elena Rostova', email: 'admin@funnel.ai', role: ROLES.REVOPS_ADMIN },
    { id: uuidv4(), name: 'Sarah Chen', email: 'sarah.chen@funnel.ai', role: ROLES.SALES_MANAGER },
    { id: uuidv4(), name: 'Alex Miller', email: 'alex.miller@funnel.ai', role: ROLES.SALES_REP },
    { id: uuidv4(), name: 'Jordan Taylor', email: 'jordan.taylor@funnel.ai', role: ROLES.SALES_REP }
  ]

  const insertUser = db.prepare(`
    INSERT INTO users (id, name, email, password_hash, role)
    VALUES (?, ?, ?, ?, ?)
  `)
  for (const u of users) {
    insertUser.run(u.id, u.name, u.email, defaultHash, u.role)
  }

  const [adminUser, , repAlex, repJordan] = users

  // 2. Seed Accounts
  const accountsData = [
    { id: uuidv4(), name: 'Apex CyberSec', domain: 'apexcyber.io', industry: 'Cybersecurity', employee_count: 850, annual_revenue: 120000000, tier: 'ENTERPRISE' },
    { id: uuidv4(), name: 'Novus HealthTech', domain: 'novushealth.com', industry: 'Healthcare', employee_count: 320, annual_revenue: 45000000, tier: 'MID_MARKET' },
    { id: uuidv4(), name: 'FinSecure Global', domain: 'finsecure.net', industry: 'Fintech', employee_count: 1400, annual_revenue: 280000000, tier: 'ENTERPRISE' },
    { id: uuidv4(), name: 'OmniLogistics AI', domain: 'omnilogistics.ai', industry: 'Logistics', employee_count: 450, annual_revenue: 65000000, tier: 'MID_MARKET' },
    { id: uuidv4(), name: 'CloudScale Systems', domain: 'cloudscale.tech', industry: 'SaaS', employee_count: 190, annual_revenue: 28000000, tier: 'MID_MARKET' },
    { id: uuidv4(), name: 'Stellar Payments', domain: 'stellarpay.com', industry: 'Fintech', employee_count: 2200, annual_revenue: 410000000, tier: 'ENTERPRISE' },
    { id: uuidv4(), name: 'BioGenix Labs', domain: 'biogenix.org', industry: 'Biotech', employee_count: 95, annual_revenue: 14000000, tier: 'SMB' },
    { id: uuidv4(), name: 'Vanguard Retail Analytics', domain: 'vanguardretail.com', industry: 'Retail', employee_count: 510, annual_revenue: 72000000, tier: 'MID_MARKET' },
    { id: uuidv4(), name: 'Nexus Telecom', domain: 'nexustel.co', industry: 'Telecom', employee_count: 3400, annual_revenue: 890000000, tier: 'ENTERPRISE' },
    { id: uuidv4(), name: 'DataGrid Infrastructure', domain: 'datagrid.io', industry: 'Infrastructure', employee_count: 140, annual_revenue: 19000000, tier: 'SMB' },
    { id: uuidv4(), name: 'HyperFlow Media', domain: 'hyperflow.media', industry: 'Media', employee_count: 80, annual_revenue: 9500000, tier: 'SMB' },
    { id: uuidv4(), name: 'Synapse Robotics', domain: 'synapserobotics.com', industry: 'Robotics', employee_count: 670, annual_revenue: 98000000, tier: 'MID_MARKET' }
  ]

  const insertAccount = db.prepare(`
    INSERT INTO accounts (id, name, domain, industry, employee_count, annual_revenue, tier)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
  for (const acc of accountsData) {
    insertAccount.run(acc.id, acc.name, acc.domain, acc.industry, acc.employee_count, acc.annual_revenue, acc.tier)
  }

  // 3. Seed Contacts
  const contactsData = [
    { id: uuidv4(), account_id: accountsData[0].id, name: 'Marcus Vance', email: 'm.vance@apexcyber.io', role_title: 'CISO', seniority: 'C_LEVEL', is_champion: 0, is_economic_buyer: 1 },
    { id: uuidv4(), account_id: accountsData[0].id, name: 'Tanya Gomez', email: 't.gomez@apexcyber.io', role_title: 'Director of Security Ops', seniority: 'DIRECTOR', is_champion: 1, is_economic_buyer: 0 },
    { id: uuidv4(), account_id: accountsData[1].id, name: 'David Kim', email: 'dkim@novushealth.com', role_title: 'VP Technology', seniority: 'VP', is_champion: 1, is_economic_buyer: 1 },
    { id: uuidv4(), account_id: accountsData[1].id, name: 'Claire Dubois', email: 'cdubois@novushealth.com', role_title: 'Lead Architect', seniority: 'MANAGER', is_champion: 1, is_economic_buyer: 0 },
    { id: uuidv4(), account_id: accountsData[2].id, name: 'Richard Sterling', email: 'rsterling@finsecure.net', role_title: 'Chief Risk Officer', seniority: 'C_LEVEL', is_champion: 0, is_economic_buyer: 1 },
    { id: uuidv4(), account_id: accountsData[2].id, name: 'Rachel Green', email: 'rgreen@finsecure.net', role_title: 'VP Engineering', seniority: 'VP', is_champion: 1, is_economic_buyer: 0 },
    { id: uuidv4(), account_id: accountsData[3].id, name: 'Sanjay Patel', email: 'spatel@omnilogistics.ai', role_title: 'Head of Data Platforms', seniority: 'DIRECTOR', is_champion: 1, is_economic_buyer: 0 },
    { id: uuidv4(), account_id: accountsData[3].id, name: 'Monica Geller', email: 'mgeller@omnilogistics.ai', role_title: 'COO', seniority: 'C_LEVEL', is_champion: 0, is_economic_buyer: 1 },
    { id: uuidv4(), account_id: accountsData[4].id, name: 'Liam O’Connor', email: 'liam@cloudscale.tech', role_title: 'VP Product', seniority: 'VP', is_champion: 1, is_economic_buyer: 1 },
    { id: uuidv4(), account_id: accountsData[5].id, name: 'Helena Price', email: 'hprice@stellarpay.com', role_title: 'EVP Infrastructure', seniority: 'VP', is_champion: 0, is_economic_buyer: 1 },
    { id: uuidv4(), account_id: accountsData[5].id, name: 'Kevin Zhou', email: 'kzhou@stellarpay.com', role_title: 'Staff Security Engineer', seniority: 'INDIVIDUAL', is_champion: 1, is_economic_buyer: 0 },
    { id: uuidv4(), account_id: accountsData[6].id, name: 'Dr. Aris Thorne', email: 'thorne@biogenix.org', role_title: 'CSO & Founder', seniority: 'C_LEVEL', is_champion: 1, is_economic_buyer: 1 },
    { id: uuidv4(), account_id: accountsData[7].id, name: 'Samantha Reed', email: 'sreed@vanguardretail.com', role_title: 'VP Omnichannel', seniority: 'VP', is_champion: 1, is_economic_buyer: 0 },
    { id: uuidv4(), account_id: accountsData[8].id, name: 'Victor Vance', email: 'vvance@nexustel.co', role_title: 'Chief Technology Officer', seniority: 'C_LEVEL', is_champion: 1, is_economic_buyer: 1 }
  ]

  const insertContact = db.prepare(`
    INSERT INTO contacts (id, account_id, name, email, role_title, seniority, is_champion, is_economic_buyer)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)
  for (const c of contactsData) {
    insertContact.run(c.id, c.account_id, c.name, c.email, c.role_title, c.seniority, c.is_champion, c.is_economic_buyer)
  }

  // 4. Seed Deals (Active + Historical Closed)
  const now = new Date()
  const daysAgo = (d) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000).toISOString()

  const dealsData = [
    // --- Active Deals in Pipeline ---
    {
      id: uuidv4(),
      account_id: accountsData[0].id,
      title: 'Apex - Global Threat Telemetry Engine',
      stage: STAGES.NEGOTIATION,
      acv: 145000,
      owner_id: repAlex.id,
      days_in_stage: 18,
      stage_entered_at: daysAgo(18),
      status: 'OPEN',
      discount_pct: 5.0,
      created_at: daysAgo(65)
    },
    {
      id: uuidv4(),
      account_id: accountsData[1].id,
      title: 'Novus - Patient Data Pipeline Integration',
      stage: STAGES.PROPOSAL_SENT,
      acv: 92000,
      owner_id: repJordan.id,
      days_in_stage: 22, // Flagged bottleneck! (benchmark is 12)
      stage_entered_at: daysAgo(22),
      status: 'OPEN',
      discount_pct: 10.0,
      created_at: daysAgo(52)
    },
    {
      id: uuidv4(),
      account_id: accountsData[2].id,
      title: 'FinSecure - Fraud Automation & Analytics Suite',
      stage: STAGES.PROPOSAL_SENT,
      acv: 210000,
      owner_id: repAlex.id,
      days_in_stage: 16, // Flagged bottleneck
      stage_entered_at: daysAgo(16),
      status: 'OPEN',
      discount_pct: 0.0,
      created_at: daysAgo(48)
    },
    {
      id: uuidv4(),
      account_id: accountsData[3].id,
      title: 'OmniLogistics - Fleet Telemetry Dispatch',
      stage: STAGES.DISCOVERY_CALL,
      acv: 78000,
      owner_id: repJordan.id,
      days_in_stage: 6,
      stage_entered_at: daysAgo(6),
      status: 'OPEN',
      discount_pct: 0.0,
      created_at: daysAgo(25)
    },
    {
      id: uuidv4(),
      account_id: accountsData[4].id,
      title: 'CloudScale - Kubernetes Cost Optimization',
      stage: STAGES.QUALIFIED,
      acv: 54000,
      owner_id: repAlex.id,
      days_in_stage: 4,
      stage_entered_at: daysAgo(4),
      status: 'OPEN',
      discount_pct: 0.0,
      created_at: daysAgo(12)
    },
    {
      id: uuidv4(),
      account_id: accountsData[5].id,
      title: 'Stellar Payments - High Velocity Settlement Gateway',
      stage: STAGES.NEGOTIATION,
      acv: 320000,
      owner_id: repAlex.id,
      days_in_stage: 8,
      stage_entered_at: daysAgo(8),
      status: 'OPEN',
      discount_pct: 8.0,
      created_at: daysAgo(90)
    },
    {
      id: uuidv4(),
      account_id: accountsData[6].id,
      title: 'BioGenix - High Throughput Gene Sequencing Pipeline',
      stage: STAGES.LEAD_CAPTURED,
      acv: 38000,
      owner_id: repJordan.id,
      days_in_stage: 3,
      stage_entered_at: daysAgo(3),
      status: 'OPEN',
      discount_pct: 0.0,
      created_at: daysAgo(3)
    },
    {
      id: uuidv4(),
      account_id: accountsData[7].id,
      title: 'Vanguard - Dynamic In-Store Inventory Sync',
      stage: STAGES.DISCOVERY_CALL,
      acv: 115000,
      owner_id: repJordan.id,
      days_in_stage: 9,
      stage_entered_at: daysAgo(9),
      status: 'OPEN',
      discount_pct: 0.0,
      created_at: daysAgo(31)
    },
    {
      id: uuidv4(),
      account_id: accountsData[8].id,
      title: 'Nexus Telecom - 5G Core Network Event Streaming',
      stage: STAGES.QUALIFIED,
      acv: 480000,
      owner_id: repAlex.id,
      days_in_stage: 5,
      stage_entered_at: daysAgo(5),
      status: 'OPEN',
      discount_pct: 0.0,
      created_at: daysAgo(14)
    },

    // --- Historical Closed Deals (Training Set for ML Engine) ---
    // Won Deals
    {
      id: uuidv4(),
      account_id: accountsData[0].id,
      title: 'Apex - SIEM Integration Pilot',
      stage: STAGES.CLOSED_WON,
      acv: 85000,
      owner_id: repAlex.id,
      days_in_stage: 12,
      stage_entered_at: daysAgo(110),
      status: 'WON',
      created_at: daysAgo(170),
      closed_at: daysAgo(110)
    },
    {
      id: uuidv4(),
      account_id: accountsData[2].id,
      title: 'FinSecure - Core Settlement Engine',
      stage: STAGES.CLOSED_WON,
      acv: 240000,
      owner_id: repAlex.id,
      days_in_stage: 15,
      stage_entered_at: daysAgo(130),
      status: 'WON',
      created_at: daysAgo(210),
      closed_at: daysAgo(130)
    },
    {
      id: uuidv4(),
      account_id: accountsData[3].id,
      title: 'OmniLogistics - Warehouse Route Optimizer',
      stage: STAGES.CLOSED_WON,
      acv: 62000,
      owner_id: repJordan.id,
      days_in_stage: 10,
      stage_entered_at: daysAgo(95),
      status: 'WON',
      created_at: daysAgo(155),
      closed_at: daysAgo(95)
    },
    {
      id: uuidv4(),
      account_id: accountsData[5].id,
      title: 'Stellar - Card Issuance API',
      stage: STAGES.CLOSED_WON,
      acv: 180000,
      owner_id: repAlex.id,
      days_in_stage: 14,
      stage_entered_at: daysAgo(80),
      status: 'WON',
      created_at: daysAgo(160),
      closed_at: daysAgo(80)
    },
    {
      id: uuidv4(),
      account_id: accountsData[7].id,
      title: 'Vanguard - E-Commerce Recommendation API',
      stage: STAGES.CLOSED_WON,
      acv: 95000,
      owner_id: repJordan.id,
      days_in_stage: 11,
      stage_entered_at: daysAgo(60),
      status: 'WON',
      created_at: daysAgo(130),
      closed_at: daysAgo(60)
    },
    {
      id: uuidv4(),
      account_id: accountsData[8].id,
      title: 'Nexus - Call Detail Record Pipeline',
      stage: STAGES.CLOSED_WON,
      acv: 350000,
      owner_id: repAlex.id,
      days_in_stage: 20,
      stage_entered_at: daysAgo(140),
      status: 'WON',
      created_at: daysAgo(240),
      closed_at: daysAgo(140)
    },
    {
      id: uuidv4(),
      account_id: accountsData[1].id,
      title: 'Novus - Telehealth Audio Infrastructure',
      stage: STAGES.CLOSED_WON,
      acv: 72000,
      owner_id: repJordan.id,
      days_in_stage: 9,
      stage_entered_at: daysAgo(100),
      status: 'WON',
      created_at: daysAgo(160),
      closed_at: daysAgo(100)
    },
    {
      id: uuidv4(),
      account_id: accountsData[9].id,
      title: 'DataGrid - Edge Cache Controller',
      stage: STAGES.CLOSED_WON,
      acv: 45000,
      owner_id: repAlex.id,
      days_in_stage: 8,
      stage_entered_at: daysAgo(50),
      status: 'WON',
      created_at: daysAgo(95),
      closed_at: daysAgo(50)
    },

    // Lost Deals
    {
      id: uuidv4(),
      account_id: accountsData[10].id,
      title: 'HyperFlow - Video Transcoding Grid',
      stage: STAGES.CLOSED_LOST,
      acv: 28000,
      owner_id: repJordan.id,
      days_in_stage: 34,
      stage_entered_at: daysAgo(120),
      status: 'LOST',
      loss_reason: 'BUDGET',
      created_at: daysAgo(180),
      closed_at: daysAgo(120)
    },
    {
      id: uuidv4(),
      account_id: accountsData[11].id,
      title: 'Synapse - Autonomous Robot Fleet Sync',
      stage: STAGES.CLOSED_LOST,
      acv: 110000,
      owner_id: repAlex.id,
      days_in_stage: 40,
      stage_entered_at: daysAgo(140),
      status: 'LOST',
      loss_reason: 'COMPETITOR',
      competitor: 'RoboCloud Inc',
      created_at: daysAgo(220),
      closed_at: daysAgo(140)
    },
    {
      id: uuidv4(),
      account_id: accountsData[4].id,
      title: 'CloudScale - Multi-Region Disaster Recovery',
      stage: STAGES.CLOSED_LOST,
      acv: 64000,
      owner_id: repAlex.id,
      days_in_stage: 28,
      stage_entered_at: daysAgo(90),
      status: 'LOST',
      loss_reason: 'TIMING',
      created_at: daysAgo(150),
      closed_at: daysAgo(90)
    },
    {
      id: uuidv4(),
      account_id: accountsData[6].id,
      title: 'BioGenix - Lab Automation Connector',
      stage: STAGES.CLOSED_LOST,
      acv: 35000,
      owner_id: repJordan.id,
      days_in_stage: 30,
      stage_entered_at: daysAgo(75),
      status: 'LOST',
      loss_reason: 'NO_DECISION',
      created_at: daysAgo(140),
      closed_at: daysAgo(75)
    },
    {
      id: uuidv4(),
      account_id: accountsData[10].id,
      title: 'HyperFlow - CMS Media Plugin',
      stage: STAGES.CLOSED_LOST,
      acv: 22000,
      owner_id: repJordan.id,
      days_in_stage: 25,
      stage_entered_at: daysAgo(40),
      status: 'LOST',
      loss_reason: 'BUDGET',
      created_at: daysAgo(85),
      closed_at: daysAgo(40)
    },
    {
      id: uuidv4(),
      account_id: accountsData[11].id,
      title: 'Synapse - Telemetry Gateway v1',
      stage: STAGES.CLOSED_LOST,
      acv: 82000,
      owner_id: repAlex.id,
      days_in_stage: 38,
      stage_entered_at: daysAgo(60),
      status: 'LOST',
      loss_reason: 'CHAMPION_LEFT',
      created_at: daysAgo(130),
      closed_at: daysAgo(60)
    }
  ]

  const insertDeal = db.prepare(`
    INSERT INTO deals (id, account_id, title, stage, acv, owner_id, days_in_stage, stage_entered_at, status, loss_reason, competitor, discount_pct, created_at, closed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  for (const d of dealsData) {
    insertDeal.run(
      d.id,
      d.account_id,
      d.title,
      d.stage,
      d.acv,
      d.owner_id,
      d.days_in_stage,
      d.stage_entered_at,
      d.status,
      d.loss_reason || null,
      d.competitor || null,
      d.discount_pct || 0.0,
      d.created_at,
      d.closed_at || null
    )
  }

  // 5. Seed Interactions
  const insertInteraction = db.prepare(`
    INSERT INTO interactions (id, deal_id, contact_id, type, sentiment, notes, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  // Helpers to attach touches
  const addTouch = (deal, contact, type, sentiment, notes, daysAgoVal) => {
    insertInteraction.run(uuidv4(), deal.id, contact.id, type, sentiment, notes, daysAgo(daysAgoVal))
  }

  // Active Deals Touches
  // Apex Negotiation Deal (High Engagement, Won pattern)
  addTouch(dealsData[0], contactsData[1], INTERACTION_TYPES.EMAIL_SENT, 'NEUTRAL', 'Initial outreach on telemetry architecture', 64)
  addTouch(dealsData[0], contactsData[1], INTERACTION_TYPES.EMAIL_REPLY, 'POSITIVE', 'Strong interest in latency benchmarks', 62)
  addTouch(dealsData[0], contactsData[1], INTERACTION_TYPES.DISCOVERY_CALL, 'POSITIVE', 'Scoping technical architecture and data ingestion requirements', 55)
  addTouch(dealsData[0], contactsData[1], INTERACTION_TYPES.DEMO_CALL, 'POSITIVE', 'Live pipeline demonstration with simulated DDoS attack streams', 45)
  addTouch(dealsData[0], contactsData[0], INTERACTION_TYPES.EXECUTIVE_SPONSOR_MEETING, 'POSITIVE', 'Met CISO Marcus Vance to review enterprise SOC2 and compliance', 30)
  addTouch(dealsData[0], contactsData[0], INTERACTION_TYPES.PROPOSAL_REVIEW, 'POSITIVE', 'Delivered formal pricing proposal ($145k ACV)', 20)
  addTouch(dealsData[0], contactsData[0], INTERACTION_TYPES.CONTRACT_REDLINE, 'NEUTRAL', 'Security redlines and master service agreement adjustments', 5)

  // Novus Proposal Sent Deal (Stalled in Proposal, low touch recently)
  addTouch(dealsData[1], contactsData[2], INTERACTION_TYPES.EMAIL_SENT, 'NEUTRAL', 'Shared case study on HIPAA compliance', 50)
  addTouch(dealsData[1], contactsData[3], INTERACTION_TYPES.EMAIL_REPLY, 'NEUTRAL', 'Requested pricing breakdown for multi-tenant deployment', 46)
  addTouch(dealsData[1], contactsData[3], INTERACTION_TYPES.DISCOVERY_CALL, 'POSITIVE', 'Discovery call on patient FHIR API ingestion', 38)
  addTouch(dealsData[1], contactsData[3], INTERACTION_TYPES.PROPOSAL_REVIEW, 'NEUTRAL', 'Sent proposal, but economic buyer has been silent for 22 days', 22)

  // FinSecure Proposal Sent Deal (High ACV $210k, needs executive sponsor)
  addTouch(dealsData[2], contactsData[5], INTERACTION_TYPES.EMAIL_SENT, 'POSITIVE', 'Outreach to VP Engineering', 45)
  addTouch(dealsData[2], contactsData[5], INTERACTION_TYPES.DISCOVERY_CALL, 'POSITIVE', 'Technical discovery on fraud rules engine', 35)
  addTouch(dealsData[2], contactsData[5], INTERACTION_TYPES.DEMO_CALL, 'POSITIVE', 'Demo of real-time transaction scoring', 25)
  addTouch(dealsData[2], contactsData[5], INTERACTION_TYPES.PROPOSAL_REVIEW, 'NEUTRAL', 'Proposal delivered to engineering lead, pending CRO Richard Sterling review', 16)

  // OmniLogistics Discovery Deal
  addTouch(dealsData[3], contactsData[6], INTERACTION_TYPES.EMAIL_SENT, 'POSITIVE', 'Inbound inquiry on fleet dispatch telemetry', 24)
  addTouch(dealsData[3], contactsData[6], INTERACTION_TYPES.EMAIL_REPLY, 'POSITIVE', 'Confirmed meeting for requirements gathering', 20)
  addTouch(dealsData[3], contactsData[6], INTERACTION_TYPES.DISCOVERY_CALL, 'POSITIVE', 'Reviewed 500-vehicle pilot requirements', 6)

  // CloudScale Qualified Deal
  addTouch(dealsData[4], contactsData[8], INTERACTION_TYPES.EMAIL_SENT, 'NEUTRAL', 'Cold outreach regarding K8s FinOps savings', 11)
  addTouch(dealsData[4], contactsData[8], INTERACTION_TYPES.EMAIL_REPLY, 'POSITIVE', 'Agreed to explore 20% infrastructure cost reduction', 7)

  // Stellar Payments Negotiation Deal (High value $320k)
  addTouch(dealsData[5], contactsData[10], INTERACTION_TYPES.EMAIL_SENT, 'NEUTRAL', 'Introduced real-time reconciliation engine', 88)
  addTouch(dealsData[5], contactsData[10], INTERACTION_TYPES.DISCOVERY_CALL, 'POSITIVE', 'Staff engineer confirmed pain with batch settlements', 75)
  addTouch(dealsData[5], contactsData[9], INTERACTION_TYPES.EXECUTIVE_SPONSOR_MEETING, 'POSITIVE', 'EVP Infrastructure Helena Price joined strategic briefing', 50)
  addTouch(dealsData[5], contactsData[9], INTERACTION_TYPES.SECURITY_AUDIT, 'POSITIVE', 'Completed vendor security assessment questionnaire', 30)
  addTouch(dealsData[5], contactsData[9], INTERACTION_TYPES.PROPOSAL_REVIEW, 'POSITIVE', 'Executive review of multi-year enterprise license', 15)
  addTouch(dealsData[5], contactsData[9], INTERACTION_TYPES.CONTRACT_REDLINE, 'POSITIVE', 'Legal team reviewing SLA guarantees', 3)

  // Historical Won Deals Touches
  for (let i = 9; i < 17; i++) {
    const d = dealsData[i]
    addTouch(d, contactsData[0], INTERACTION_TYPES.EMAIL_SENT, 'POSITIVE', 'Initial outreach', 160)
    addTouch(d, contactsData[0], INTERACTION_TYPES.EMAIL_REPLY, 'POSITIVE', 'Reply confirmed interest', 150)
    addTouch(d, contactsData[0], INTERACTION_TYPES.DISCOVERY_CALL, 'POSITIVE', 'Technical discovery', 140)
    addTouch(d, contactsData[0], INTERACTION_TYPES.DEMO_CALL, 'POSITIVE', 'Platform demo attended', 125)
    addTouch(d, contactsData[0], INTERACTION_TYPES.EXECUTIVE_SPONSOR_MEETING, 'POSITIVE', 'Executive alignment session', 115)
    addTouch(d, contactsData[0], INTERACTION_TYPES.PROPOSAL_REVIEW, 'POSITIVE', 'Proposal accepted', 105)
    addTouch(d, contactsData[0], INTERACTION_TYPES.CONTRACT_REDLINE, 'POSITIVE', 'Contract signed', 95)
  }

  // Historical Lost Deals Touches (Notice lack of executive touch, ghosting, long gap)
  for (let i = 17; i < 23; i++) {
    const d = dealsData[i]
    addTouch(d, contactsData[0], INTERACTION_TYPES.EMAIL_SENT, 'NEUTRAL', 'Initial cold outreach', 170)
    addTouch(d, contactsData[0], INTERACTION_TYPES.EMAIL_OPENED, 'NEUTRAL', 'Email opened once', 165)
    addTouch(d, contactsData[0], INTERACTION_TYPES.DISCOVERY_CALL, 'NEUTRAL', 'Call ended with budget hesitation', 150)
    // No executive sponsor, no demo, long gap
    addTouch(d, contactsData[0], INTERACTION_TYPES.EMAIL_SENT, 'NEGATIVE', 'Follow-up email unreturned', 100)
  }

  // 6. Record Audit Log
  db.prepare(`
    INSERT INTO audit_logs (id, user_id, action, target_type, target_id, details_json)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    uuidv4(),
    adminUser.id,
    'SEED_DATABASE',
    'SYSTEM',
    'GLOBAL',
    JSON.stringify({ accounts: accountsData.length, deals: dealsData.length, contacts: contactsData.length })
  )
}
