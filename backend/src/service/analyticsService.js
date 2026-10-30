export class AnalyticsService {
  constructor (repository, mlService) {
    this.repository = repository
    this.mlService = mlService
  }

  /**
   * Generates sales representative performance and pipeline metrics
   */
  async getRepLeaderboard () {
    const users = this.repository.getAllUsers()
    const allDeals = this.repository.getAllDeals()

    const repStats = []

    for (const user of users) {
      if (user.role === 'revops_admin') continue

      const userDeals = allDeals.filter(d => d.owner_id === user.id)
      const openDeals = userDeals.filter(d => d.status === 'OPEN')
      const wonDeals = userDeals.filter(d => d.status === 'WON')
      const lostDeals = userDeals.filter(d => d.status === 'LOST')

      const totalActivePipeline = openDeals.reduce((sum, d) => sum + Number(d.acv), 0)
      const closedWonRevenue = wonDeals.reduce((sum, d) => sum + Number(d.acv), 0)

      const winRate = (wonDeals.length + lostDeals.length) > 0
        ? Number((wonDeals.length / (wonDeals.length + lostDeals.length)).toFixed(2))
        : 0.0

      const avgCycleDays = wonDeals.length > 0
        ? Number((wonDeals.reduce((sum, d) => sum + Number(d.days_in_stage || 15), 0) / wonDeals.length).toFixed(1))
        : 45.0

      repStats.push({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        activeDealsCount: openDeals.length,
        totalActivePipeline,
        closedWonRevenue,
        closedWonCount: wonDeals.length,
        winRate,
        avgCycleDays
      })
    }

    repStats.sort((a, b) => b.closedWonRevenue - a.closedWonRevenue)
    return repStats
  }

  /**
   * Generates comparative revenue forecast (Commit vs Best Case vs Weighted vs AI Predicted)
   */
  async getRevenueForecast () {
    const openDeals = this.repository.getAllDeals({ status: 'OPEN' })

    let commitRevenue = 0
    let bestCaseRevenue = 0
    let weightedRevenue = 0
    let aiPredictedRevenue = 0

    const stageWeights = {
      LEAD_CAPTURED: 0.1,
      QUALIFIED: 0.25,
      DISCOVERY_CALL: 0.4,
      PROPOSAL_SENT: 0.6,
      NEGOTIATION: 0.85
    }

    for (const deal of openDeals) {
      const acv = Number(deal.acv)
      let probability = 0.5
      try {
        const pred = await this.mlService.predictDeal(deal.id)
        probability = pred.probability
      } catch {
        probability = stageWeights[deal.stage] || 0.4
      }

      aiPredictedRevenue += acv * probability
      weightedRevenue += acv * (stageWeights[deal.stage] || 0.3)

      if (deal.stage === 'NEGOTIATION') {
        commitRevenue += acv * 0.90
      }

      if (probability >= 0.40) {
        bestCaseRevenue += acv * 0.85
      }
    }

    return {
      commitRevenue: Number(commitRevenue.toFixed(0)),
      bestCaseRevenue: Number(bestCaseRevenue.toFixed(0)),
      weightedRevenue: Number(weightedRevenue.toFixed(0)),
      aiPredictedRevenue: Number(aiPredictedRevenue.toFixed(0)),
      varianceAiVsWeighted: Number((aiPredictedRevenue - weightedRevenue).toFixed(0)),
      totalOpenDeals: openDeals.length
    }
  }
}
