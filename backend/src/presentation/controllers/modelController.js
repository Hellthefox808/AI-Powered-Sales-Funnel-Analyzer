export class ModelController {
  constructor (mlService, repository) {
    this.mlService = mlService
    this.repository = repository
  }

  async getActiveModel (req, res, next) {
    try {
      const details = await this.mlService.getActiveModelDetails()
      res.json({
        success: true,
        ...details
      })
    } catch (err) {
      next(err)
    }
  }

  async retrain (req, res, next) {
    try {
      const options = req.body || {}
      const result = await this.mlService.trainModel(options)

      this.repository.createAuditLog({
        userId: req.user ? req.user.id : null,
        action: 'RETRAIN_MODEL',
        targetType: 'ML_MODEL',
        targetId: result.modelId,
        details: { metrics: result.metrics, samples: result.trainingSamples }
      })

      res.json({
        success: true,
        message: 'ML Model retrained successfully and deployed to active serving',
        ...result
      })
    } catch (err) {
      next(err)
    }
  }
}
