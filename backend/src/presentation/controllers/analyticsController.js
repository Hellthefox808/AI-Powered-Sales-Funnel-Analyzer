export class AnalyticsController {
  constructor (analyticsService) {
    this.analyticsService = analyticsService
  }

  async getReps (req, res, next) {
    try {
      const leaderboard = await this.analyticsService.getRepLeaderboard()
      res.json({
        success: true,
        reps: leaderboard
      })
    } catch (err) {
      next(err)
    }
  }

  async getForecast (req, res, next) {
    try {
      const forecast = await this.analyticsService.getRevenueForecast()
      res.json({
        success: true,
        forecast
      })
    } catch (err) {
      next(err)
    }
  }
}
