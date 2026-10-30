import { ML_CONFIG, BENCHMARKS } from '../config/constants.js'

export const FEATURE_NAMES = [
  'total_interactions',
  'email_reply_ratio',
  'demo_completed',
  'decision_makers_engaged',
  'has_economic_buyer',
  'days_since_last_touch',
  'deal_size_log',
  'discount_pct',
  'account_employee_log',
  'velocity_ratio'
]

export const FEATURE_DESCRIPTIONS = {
  total_interactions: 'Total Touchpoints & Engagements',
  email_reply_ratio: 'Prospect Email Responsiveness',
  demo_completed: 'Technical Demo / Discovery Attended',
  decision_makers_engaged: 'Executive & Director Alignment',
  has_economic_buyer: 'Economic Buyer Engaged',
  days_since_last_touch: 'Touchpoint Recency (Dormancy Risk)',
  deal_size_log: 'Contract Scale (Log ACV)',
  discount_pct: 'Commercial Concession / Discount %',
  account_employee_log: 'Account Scale (Log Employees)',
  velocity_ratio: 'Pipeline Velocity vs Stage Benchmark'
}

/**
 * Z-Score Feature Scaler
 */
export class StandardScaler {
  constructor (means = null, stds = null) {
    this.means = means
    this.stds = stds
  }

  fit (X) {
    const numSamples = X.length
    const numFeatures = X[0].length

    this.means = new Array(numFeatures).fill(0)
    this.stds = new Array(numFeatures).fill(0)

    for (let j = 0; j < numFeatures; j++) {
      let sum = 0
      for (let i = 0; i < numSamples; i++) {
        sum += X[i][j]
      }
      this.means[j] = sum / numSamples

      let varSum = 0
      for (let i = 0; i < numSamples; i++) {
        varSum += Math.pow(X[i][j] - this.means[j], 2)
      }
      this.stds[j] = Math.sqrt(varSum / numSamples) || 1.0 // Prevent div-by-zero
    }
  }

  transform (X) {
    return X.map(row => {
      return row.map((val, j) => {
        return (val - this.means[j]) / this.stds[j]
      })
    })
  }

  fitTransform (X) {
    this.fit(X)
    return this.transform(X)
  }

  toJSON () {
    return { means: this.means, stds: this.stds }
  }

  static fromJSON (json) {
    return new StandardScaler(json.means, json.stds)
  }
}

/**
 * Supervised Logistic Classifier with L2 Regularization
 */
export class LogisticClassifier {
  constructor (weights = null, bias = 0) {
    this.weights = weights
    this.bias = bias
  }

  sigmoid (z) {
    if (z >= 0) {
      return 1 / (1 + Math.exp(-z))
    }
    const expZ = Math.exp(z)
    return expZ / (1 + expZ)
  }

  train (X, y, options = {}) {
    const lr = options.learningRate || ML_CONFIG.DEFAULT_LEARNING_RATE
    const epochs = options.epochs || ML_CONFIG.DEFAULT_EPOCHS
    const l2 = options.l2Penalty || ML_CONFIG.L2_PENALTY

    const numSamples = X.length
    const numFeatures = X[0].length

    this.weights = new Array(numFeatures).fill(0)
    this.bias = 0

    // Gradient descent with momentum
    const vW = new Array(numFeatures).fill(0)
    let vB = 0
    const momentum = 0.9

    for (let epoch = 0; epoch < epochs; epoch++) {
      const gradW = new Array(numFeatures).fill(0)
      let gradB = 0

      for (let i = 0; i < numSamples; i++) {
        const linear = this.predictRaw(X[i])
        const p = this.sigmoid(linear)
        const error = p - y[i]

        for (let j = 0; j < numFeatures; j++) {
          gradW[j] += error * X[i][j]
        }
        gradB += error
      }

      // Add L2 penalty and apply momentum updates
      for (let j = 0; j < numFeatures; j++) {
        const regularizedGrad = (gradW[j] / numSamples) + (l2 * this.weights[j])
        vW[j] = momentum * vW[j] + lr * regularizedGrad
        this.weights[j] -= vW[j]
      }

      const meanGradB = gradB / numSamples
      vB = momentum * vB + lr * meanGradB
      this.bias -= vB
    }
  }

  predictRaw (x) {
    let sum = this.bias
    for (let j = 0; j < this.weights.length; j++) {
      sum += this.weights[j] * x[j]
    }
    return sum
  }

  predictProbability (x) {
    return this.sigmoid(this.predictRaw(x))
  }

  toJSON () {
    return { weights: this.weights, bias: this.bias }
  }

  static fromJSON (json) {
    return new LogisticClassifier(json.weights, json.bias)
  }
}

/**
 * Feature Extraction from Deal + Interactions + Contacts
 */
export function extractFeatures (deal, interactions = [], contacts = []) {
  const totalInteractions = interactions.length

  const emailsSent = interactions.filter(i => i.type === 'EMAIL_SENT').length
  const emailReplies = interactions.filter(i => i.type === 'EMAIL_REPLY').length
  const emailReplyRatio = emailsSent > 0 ? Math.min(1.0, emailReplies / emailsSent) : 0.0

  const demoCompleted = interactions.some(i => i.type === 'DEMO_CALL' || i.type === 'DISCOVERY_CALL') ? 1.0 : 0.0

  const interactingContactIds = new Set(interactions.map(i => i.contact_id).filter(Boolean))
  const engagedContacts = contacts.filter(c => interactingContactIds.has(c.id))

  const decisionMakersEngaged = engagedContacts.filter(c => ['C_LEVEL', 'VP', 'DIRECTOR'].includes(c.seniority)).length
  const hasEconomicBuyer = (engagedContacts.some(c => c.is_economic_buyer === 1) || contacts.some(c => c.is_economic_buyer === 1 && interactingContactIds.has(c.id))) ? 1.0 : 0.0

  let daysSinceLastTouch = 14
  if (interactions.length > 0) {
    const latestTimestamp = new Date(interactions[0].timestamp).getTime()
    const diffDays = Math.max(0, (Date.now() - latestTimestamp) / (24 * 60 * 60 * 1000))
    daysSinceLastTouch = Math.min(60, diffDays)
  }

  const dealSizeLog = Math.log(Math.max(1000, Number(deal.acv) || 50000))
  const discountPct = Math.min(50, Math.max(0, Number(deal.discount_pct) || 0))
  const accountEmployeeLog = Math.log(Math.max(10, Number(deal.employee_count) || 250))

  const stageBenchmark = BENCHMARKS[deal.stage] || { expectedCycleDays: 10 }
  const velocityRatio = stageBenchmark.expectedCycleDays / Math.max(1, Number(deal.days_in_stage) || 1)

  return [
    totalInteractions,
    emailReplyRatio,
    demoCompleted,
    decisionMakersEngaged,
    hasEconomicBuyer,
    daysSinceLastTouch,
    dealSizeLog,
    discountPct,
    accountEmployeeLog,
    velocityRatio
  ]
}

/**
 * Full Evaluation Metrics Suite including ROC-AUC via Trapezoidal Integration
 */
export function evaluateModel (classifier, scaler, xTest, yTest) {
  const scaledX = scaler.transform(xTest)
  const predictions = []

  let tp = 0
  let fp = 0
  let tn = 0
  let fn = 0
  let logLossSum = 0

  for (let i = 0; i < scaledX.length; i++) {
    const prob = classifier.predictProbability(scaledX[i])
    const label = yTest[i]
    predictions.push({ prob, label })

    // Log-loss with clipping
    const clampedProb = Math.max(1e-15, Math.min(1 - 1e-15, prob))
    logLossSum -= (label * Math.log(clampedProb) + (1 - label) * Math.log(1 - clampedProb))

    const predClass = prob >= 0.5 ? 1 : 0
    if (predClass === 1 && label === 1) tp++
    else if (predClass === 1 && label === 0) fp++
    else if (predClass === 0 && label === 0) tn++
    else if (predClass === 0 && label === 1) fn++
  }

  const total = scaledX.length
  const accuracy = total > 0 ? (tp + tn) / total : 0
  const precision = (tp + fp) > 0 ? tp / (tp + fp) : 0
  const recall = (tp + fn) > 0 ? tp / (tp + fn) : 0
  const f1 = (precision + recall) > 0 ? (2 * precision * recall) / (precision + recall) : 0
  const logLoss = total > 0 ? logLossSum / total : 0

  // Calculate ROC-AUC
  // Sort descending by predicted probability
  predictions.sort((a, b) => b.prob - a.prob)

  const numPos = yTest.filter(y => y === 1).length
  const numNeg = yTest.filter(y => y === 0).length

  let rocAuc = 0.5
  if (numPos > 0 && numNeg > 0) {
    let prevFPR = 0
    let prevTPR = 0
    let curTP = 0
    let curFP = 0
    let aucArea = 0

    for (const p of predictions) {
      if (p.label === 1) curTP++
      else curFP++

      const tpr = curTP / numPos
      const fpr = curFP / numNeg

      // Trapezoid area: 0.5 * (FPR_new - FPR_old) * (TPR_new + TPR_old)
      aucArea += 0.5 * (fpr - prevFPR) * (tpr + prevTPR)
      prevFPR = fpr
      prevTPR = tpr
    }
    rocAuc = Math.max(0.5, Math.min(1.0, aucArea))
  }

  return {
    accuracy: Number(accuracy.toFixed(4)),
    precision: Number(precision.toFixed(4)),
    recall: Number(recall.toFixed(4)),
    f1: Number(f1.toFixed(4)),
    log_loss: Number(logLoss.toFixed(4)),
    roc_auc: Number(rocAuc.toFixed(4)),
    confusion_matrix: {
      tp,
      fp,
      tn,
      fn
    }
  }
}

/**
 * Local Feature Attribution (Additive Impact / SHAP-style Explainability)
 */
export function explainPrediction (classifier, scaler, rawFeatures) {
  const scaled = scaler.transform([rawFeatures])[0]
  const probability = classifier.predictProbability(scaled)

  const attributions = []
  for (let j = 0; j < FEATURE_NAMES.length; j++) {
    const featureName = FEATURE_NAMES[j]
    const description = FEATURE_DESCRIPTIONS[featureName]
    const weight = classifier.weights[j]
    const scaledVal = scaled[j]
    const impact = weight * scaledVal // Local contribution to logit

    attributions.push({
      feature: featureName,
      description,
      rawValue: rawFeatures[j],
      scaledValue: Number(scaledVal.toFixed(2)),
      weight: Number(weight.toFixed(4)),
      impact: Number(impact.toFixed(4)),
      direction: impact >= 0 ? 'POSITIVE' : 'NEGATIVE'
    })
  }

  // Sort by absolute magnitude of impact
  const positiveDrivers = attributions
    .filter(a => a.direction === 'POSITIVE')
    .sort((a, b) => b.impact - a.impact)
    .slice(0, 3)

  const negativeRisks = attributions
    .filter(a => a.direction === 'NEGATIVE')
    .sort((a, b) => a.impact - b.impact)
    .slice(0, 3)

  let classification = 'MEDIUM_RISK'
  if (probability >= ML_CONFIG.HIGH_CONVERSION_THRESHOLD) {
    classification = 'HIGH_CONVERSION'
  } else if (probability < ML_CONFIG.MEDIUM_RISK_THRESHOLD) {
    classification = 'LOW_CONVERSION'
  }

  // Prescriptive Next Best Action logic
  let nextBestAction = 'Maintain weekly cadence and monitor stakeholder touchpoints.'
  const hasEconBuyer = rawFeatures[4]
  const demoDone = rawFeatures[2]
  const daysSinceTouch = rawFeatures[5]
  const discount = rawFeatures[7]
  const decisionMakers = rawFeatures[3]

  if (!hasEconBuyer) {
    nextBestAction = 'Engage Economic Buyer (CFO / VP Finance) directly to validate procurement budget.'
  } else if (!demoDone) {
    nextBestAction = 'Schedule live technical architecture and demo walkthrough with engineering champions.'
  } else if (daysSinceTouch > 14) {
    nextBestAction = `Dormancy alert: Deal idle for ${Math.round(daysSinceTouch)} days. Dispatch re-engagement executive summary.`
  } else if (decisionMakers < 2) {
    nextBestAction = 'Multi-thread the opportunity: Connect with Director or VP of Operations.'
  } else if (discount > 15) {
    nextBestAction = 'Review margin discount authorization with Sales Management.'
  } else if (probability >= ML_CONFIG.HIGH_CONVERSION_THRESHOLD) {
    nextBestAction = 'Accelerate deal closing: Deliver Master Service Agreement (MSA) and schedule legal redlines.'
  }

  return {
    probability: Number(probability.toFixed(4)),
    classification,
    positiveDrivers,
    negativeRisks,
    nextBestAction
  }
}
