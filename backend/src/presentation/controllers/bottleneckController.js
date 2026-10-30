export class BottleneckController {
  constructor (bottleneckService, repository) {
    this.bottleneckService = bottleneckService
    this.repository = repository
  }

  async getBottlenecks (req, res, next) {
    try {
      const data = await this.bottleneckService.detectBottlenecks()
      res.json({
        success: true,
        ...data
      })
    } catch (err) {
      next(err)
    }
  }

  async updateBenchmark (req, res, next) {
    try {
      const { stage } = req.params
      const { expectedConversionPct, expectedCycleDays, maxHealthyDays } = req.body

      if (expectedConversionPct === undefined || expectedCycleDays === undefined || maxHealthyDays === undefined) {
        return res.status(400).json({
          success: false,
          error: 'expectedConversionPct, expectedCycleDays, and maxHealthyDays are required'
        })
      }

      const updated = this.repository.updateBenchmark(stage, {
        expectedConversionPct: Number(expectedConversionPct),
        expectedCycleDays: Number(expectedCycleDays),
        maxHealthyDays: Number(maxHealthyDays)
      })

      this.repository.createAuditLog({
        userId: req.user ? req.user.id : null,
        action: 'UPDATE_BENCHMARK',
        targetType: 'BENCHMARK',
        targetId: stage,
        details: { expectedConversionPct, expectedCycleDays, maxHealthyDays }
      })

      res.json({
        success: true,
        benchmark: updated
      })
    } catch (err) {
      next(err)
    }
  }
}
