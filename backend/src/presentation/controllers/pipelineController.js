export class PipelineController {
  constructor (pipelineService) {
    this.pipelineService = pipelineService
  }

  async getFunnel (req, res, next) {
    try {
      const data = await this.pipelineService.getFunnelMetrics()
      res.json({
        success: true,
        ...data
      })
    } catch (err) {
      next(err)
    }
  }
}
