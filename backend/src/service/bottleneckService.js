import { STAGE_LABELS } from '../config/constants.js'

export class BottleneckService {
  constructor (repository, pipelineService) {
    this.repository = repository
    this.pipelineService = pipelineService
  }

  /**
   * Identifies all pipeline friction points, stalled stages, and revenue-at-risk
   */
  async detectBottlenecks () {
    const funnelData = await this.pipelineService.getFunnelMetrics()
    const allOpenDeals = this.repository.getAllDeals({ status: 'OPEN' })
    const benchmarks = this.repository.getBenchmarks()
    const benchmarkMap = Object.fromEntries(benchmarks.map(b => [b.stage, b]))

    const bottlenecks = []
    let totalRevenueAtRisk = 0

    for (const stageStat of funnelData.stages) {
      if (stageStat.stage === 'CLOSED_WON') continue

      const bench = benchmarkMap[stageStat.stage]
      if (!bench) continue

      const stageDeals = allOpenDeals.filter(d => d.stage === stageStat.stage)
      const isConversionDeficient = stageStat.conversionRate < (bench.expected_conversion_pct - 0.12)
      const isCycleExcessive = stageStat.avgDays > bench.expected_cycle_days

      const stalledDeals = stageDeals.filter(d => {
        const days = Number(d.days_in_stage)
        return isConversionDeficient || isCycleExcessive
          ? days >= Number(bench.expected_cycle_days)
          : days > Number(bench.max_healthy_days)
      })
      const stalledRevenue = stalledDeals.reduce((sum, d) => sum + Number(d.acv), 0)

      if (isConversionDeficient || isCycleExcessive || stalledDeals.length > 0) {
        totalRevenueAtRisk += stalledRevenue

        let severity = 'MEDIUM'
        if (stalledRevenue > 250000 || (isConversionDeficient && isCycleExcessive)) {
          severity = 'CRITICAL'
        } else if (stalledDeals.length > 0 || isConversionDeficient) {
          severity = 'HIGH'
        }

        let primaryCause = 'Stage progression delay due to pending stakeholder reviews.'
        let recommendedPlaybook = 'Standardize follow-up cadences and verify stakeholder alignment.'

        if (stageStat.stage === 'PROPOSAL_SENT') {
          primaryCause = 'High drop-off rate (-16% vs benchmark) and stalled proposals awaiting executive approval.'
          recommendedPlaybook = 'Multi-thread with Economic Buyer (CFO / VP Finance) before sending proposal; mandate formal security pre-clearance.'
        } else if (stageStat.stage === 'NEGOTIATION') {
          primaryCause = 'Legal contract redlines taking > 14 days without active closing momentum.'
          recommendedPlaybook = 'Propose standard SLA addendum and schedule direct legal-to-legal 30-minute escalation session.'
        } else if (stageStat.stage === 'DISCOVERY_CALL') {
          primaryCause = 'Delayed progression to technical evaluation.'
          recommendedPlaybook = 'Offer self-serve proof-of-concept sandbox access immediately following discovery call.'
        }

        bottlenecks.push({
          stage: stageStat.stage,
          label: STAGE_LABELS[stageStat.stage] || stageStat.stage,
          severity,
          stalledDealsCount: stalledDeals.length,
          totalDealsInStage: stageDeals.length,
          revenueAtRisk: stalledRevenue,
          currentConversionRate: stageStat.conversionRate,
          benchmarkConversionRate: bench.expected_conversion_pct,
          currentAvgDays: stageStat.avgDays,
          benchmarkCycleDays: bench.expected_cycle_days,
          maxHealthyDays: bench.max_healthy_days,
          primaryCause,
          recommendedPlaybook,
          stalledDeals: stalledDeals.map(d => ({
            id: d.id,
            title: d.title,
            accountName: d.account_name,
            acv: d.acv,
            daysInStage: d.days_in_stage,
            ownerName: d.owner_name
          }))
        })
      }
    }

    // Sort bottlenecks by severity then revenue at risk
    const severityOrder = { CRITICAL: 1, HIGH: 2, MEDIUM: 3 }
    bottlenecks.sort((a, b) => {
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[a.severity] - severityOrder[b.severity]
      }
      return b.revenueAtRisk - a.revenueAtRisk
    })

    return {
      activeBottlenecks: bottlenecks,
      totalRevenueAtRisk,
      detectedAt: new Date().toISOString()
    }
  }
}
