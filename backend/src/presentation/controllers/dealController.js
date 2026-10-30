export class DealController {
  constructor (repository, pipelineService) {
    this.repository = repository
    this.pipelineService = pipelineService
  }

  async getDeals (req, res, next) {
    try {
      const { stage, status, ownerId } = req.query
      const deals = await this.pipelineService.getEnrichedDeals({ stage, status, ownerId })
      res.json({
        success: true,
        count: deals.length,
        deals
      })
    } catch (err) {
      next(err)
    }
  }

  async getDealById (req, res, next) {
    try {
      const { id } = req.params
      const deal = await this.pipelineService.getDealWithTimeline(id)
      res.json({
        success: true,
        ...deal
      })
    } catch (err) {
      res.status(404).json({
        success: false,
        error: err.message
      })
    }
  }

  async updateStage (req, res, next) {
    try {
      const { id } = req.params
      const { stage, daysInStage = 0, status = 'OPEN', lossReason = null } = req.body

      if (!stage) {
        return res.status(400).json({ success: false, error: 'Stage is required' })
      }

      const updated = this.repository.updateDealStage(id, stage, daysInStage, status, lossReason)

      this.repository.createAuditLog({
        userId: req.user ? req.user.id : null,
        action: 'UPDATE_DEAL_STAGE',
        targetType: 'DEAL',
        targetId: id,
        details: { stage, status, lossReason }
      })

      res.json({
        success: true,
        deal: updated
      })
    } catch (err) {
      next(err)
    }
  }

  async addInteraction (req, res, next) {
    try {
      const { id } = req.params
      const { contactId, type, sentiment = 'NEUTRAL', notes = '' } = req.body

      if (!type) {
        return res.status(400).json({ success: false, error: 'Interaction type is required' })
      }

      const interaction = this.repository.createInteraction({
        dealId: id,
        contactId: contactId || null,
        type,
        sentiment,
        notes
      })

      res.status(201).json({
        success: true,
        interaction
      })
    } catch (err) {
      next(err)
    }
  }
}
