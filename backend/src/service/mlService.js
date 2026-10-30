import {
  StandardScaler,
  LogisticClassifier,
  FEATURE_NAMES,
  FEATURE_DESCRIPTIONS,
  extractFeatures,
  evaluateModel,
  explainPrediction
} from './mlEngine.js'

export class MLService {
  constructor (repository) {
    this.repository = repository
  }

  /**
   * Initializes or trains an active model if none exists
   */
  async ensureActiveModel () {
    const existing = this.repository.getActiveModel()
    if (existing) {
      return existing
    }
    return this.trainModel()
  }

  /**
   * Trains a new model version using historical closed deals
   */
  async trainModel (options = {}) {
    const closedDeals = this.repository.getClosedDeals()
    const X = []
    const y = []

    for (const deal of closedDeals) {
      const interactions = this.repository.getInteractionsByDealId(deal.id)
      const contacts = this.repository.getContactsByDealId(deal.id)
      const features = extractFeatures(deal, interactions, contacts)

      X.push(features)
      y.push(deal.status === 'WON' ? 1 : 0)
    }

    if (X.length === 0) {
      throw new Error('Insufficient historical training data to train ML model')
    }

    const scaler = new StandardScaler()
    const scaledX = scaler.fitTransform(X)

    const classifier = new LogisticClassifier()
    classifier.train(scaledX, y, options)

    const metrics = evaluateModel(classifier, scaler, X, y)

    const parametersJson = JSON.stringify({
      scaler: scaler.toJSON(),
      classifier: classifier.toJSON()
    })

    const metricsJson = JSON.stringify(metrics)

    const savedModel = this.repository.saveModel({
      algorithm: 'LOGISTIC_REGRESSION_L2',
      parametersJson,
      metricsJson,
      trainingSamples: X.length,
      isActive: 1
    })

    return {
      modelId: savedModel.id,
      algorithm: savedModel.algorithm,
      metrics,
      trainingSamples: X.length,
      createdAt: savedModel.created_at
    }
  }

  /**
   * Scores an individual deal using the active model
   */
  async predictDeal (dealId) {
    const deal = this.repository.getDealById(dealId)
    if (!deal) {
      throw new Error(`Deal not found: ${dealId}`)
    }

    const activeModelRecord = await this.ensureActiveModel()
    const { scaler, classifier } = this._rehydrateModel(activeModelRecord)

    const interactions = this.repository.getInteractionsByDealId(dealId)
    const contacts = this.repository.getContactsByDealId(dealId)
    const rawFeatures = extractFeatures(deal, interactions, contacts)

    const explanation = explainPrediction(classifier, scaler, rawFeatures)

    // Log prediction to database
    this.repository.savePrediction({
      dealId,
      modelId: activeModelRecord.id,
      probability: explanation.probability,
      classification: explanation.classification,
      factorsJson: JSON.stringify({
        positiveDrivers: explanation.positiveDrivers,
        negativeRisks: explanation.negativeRisks
      }),
      recommendedAction: explanation.nextBestAction
    })

    return {
      dealId,
      modelId: activeModelRecord.id,
      ...explanation
    }
  }

  /**
   * Simulates "What-If" scenarios without persisting changes to the deal
   */
  async simulateWhatIf (dealId, simulationParams = {}) {
    const deal = this.repository.getDealById(dealId)
    if (!deal) {
      throw new Error(`Deal not found: ${dealId}`)
    }

    const activeModelRecord = await this.ensureActiveModel()
    const { scaler, classifier } = this._rehydrateModel(activeModelRecord)

    const interactions = this.repository.getInteractionsByDealId(dealId)
    const contacts = this.repository.getContactsByDealId(dealId)
    const baseFeatures = extractFeatures(deal, interactions, contacts)
    const baseExplanation = explainPrediction(classifier, scaler, baseFeatures)

    // Clone and apply simulated modifications
    const simFeatures = [...baseFeatures]

    if (simulationParams.additionalTouches !== undefined) {
      simFeatures[0] = Math.max(0, simFeatures[0] + Number(simulationParams.additionalTouches))
    }
    if (simulationParams.emailReplyRatio !== undefined) {
      simFeatures[1] = Math.min(1.0, Math.max(0.0, Number(simulationParams.emailReplyRatio)))
    }
    if (simulationParams.demoCompleted !== undefined) {
      simFeatures[2] = simulationParams.demoCompleted ? 1.0 : 0.0
    }
    if (simulationParams.decisionMakersEngaged !== undefined) {
      simFeatures[3] = Math.max(0, Number(simulationParams.decisionMakersEngaged))
    }
    if (simulationParams.hasEconomicBuyer !== undefined) {
      simFeatures[4] = simulationParams.hasEconomicBuyer ? 1.0 : 0.0
    }
    if (simulationParams.daysSinceLastTouch !== undefined) {
      simFeatures[5] = Math.max(0, Number(simulationParams.daysSinceLastTouch))
    }
    if (simulationParams.discountPct !== undefined) {
      simFeatures[7] = Math.max(0, Math.min(50, Number(simulationParams.discountPct)))
    }

    const simExplanation = explainPrediction(classifier, scaler, simFeatures)
    const deltaProbability = Number((simExplanation.probability - baseExplanation.probability).toFixed(4))

    return {
      dealId,
      dealTitle: deal.title,
      original: {
        probability: baseExplanation.probability,
        classification: baseExplanation.classification,
        nextBestAction: baseExplanation.nextBestAction
      },
      simulated: {
        probability: simExplanation.probability,
        classification: simExplanation.classification,
        nextBestAction: simExplanation.nextBestAction
      },
      deltaProbability,
      simulatedFeatures: simFeatures,
      baseFeatures
    }
  }

  /**
   * Retrieves active model statistics, metrics, and global feature weights
   */
  async getActiveModelDetails () {
    const activeModel = await this.ensureActiveModel()
    const params = JSON.parse(activeModel.parameters_json)
    const metrics = JSON.parse(activeModel.metrics_json)

    const featureWeights = FEATURE_NAMES.map((name, idx) => ({
      feature: name,
      description: FEATURE_DESCRIPTIONS[name],
      weight: Number((params.classifier.weights[idx] || 0).toFixed(4))
    })).sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight))

    return {
      id: activeModel.id,
      algorithm: activeModel.algorithm,
      metrics,
      featureWeights,
      trainingSamples: activeModel.training_samples,
      createdAt: activeModel.created_at
    }
  }

  _rehydrateModel (modelRecord) {
    const parsed = JSON.parse(modelRecord.parameters_json)
    const scaler = StandardScaler.fromJSON(parsed.scaler)
    const classifier = LogisticClassifier.fromJSON(parsed.classifier)
    return { scaler, classifier }
  }
}
