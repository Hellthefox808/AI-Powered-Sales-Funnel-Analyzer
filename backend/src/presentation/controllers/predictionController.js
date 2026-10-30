export class PredictionController {
  constructor (mlService) {
    this.mlService = mlService
  }

  async predictDeal (req, res, next) {
    try {
      const { id } = req.params
      const prediction = await this.mlService.predictDeal(id)
      res.json({
        success: true,
        ...prediction
      })
    } catch (err) {
      res.status(404).json({
        success: false,
        error: err.message
      })
    }
  }

  async whatIf (req, res, next) {
    try {
      const { dealId, ...simulationParams } = req.body
      if (!dealId) {
        return res.status(400).json({ success: false, error: 'dealId is required for what-if simulation' })
      }

      const result = await this.mlService.simulateWhatIf(dealId, simulationParams)
      res.json({
        success: true,
        ...result
      })
    } catch (err) {
      res.status(400).json({
        success: false,
        error: err.message
      })
    }
  }
}
