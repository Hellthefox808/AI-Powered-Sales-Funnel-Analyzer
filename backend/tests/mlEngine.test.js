import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  StandardScaler,
  LogisticClassifier,
  FEATURE_NAMES,
  extractFeatures,
  evaluateModel,
  explainPrediction
} from '../src/service/mlEngine.js'

describe('ML Engine — Math, Scaling & Logistic Classifier', () => {
  it('StandardScaler fits and normalizes 2D feature matrix with zero mean and unit variance', () => {
    const X = [
      [10, 100],
      [20, 200],
      [30, 300]
    ]

    const scaler = new StandardScaler()
    const scaled = scaler.fitTransform(X)

    assert.equal(scaled.length, 3)
    assert.equal(scaler.means[0], 20)
    assert.equal(scaler.means[1], 200)

    // Standardized values should be centered around 0
    assert.ok(Math.abs(scaled[1][0]) < 1e-6)
    assert.ok(Math.abs(scaled[1][1]) < 1e-6)
    assert.ok(scaled[0][0] < 0)
    assert.ok(scaled[2][0] > 0)
  })

  it('StandardScaler serializes and deserializes accurately from JSON', () => {
    const scaler = new StandardScaler([5, 10], [1.5, 2.5])
    const json = scaler.toJSON()
    const rehydrated = StandardScaler.fromJSON(json)

    assert.deepEqual(rehydrated.means, [5, 10])
    assert.deepEqual(rehydrated.stds, [1.5, 2.5])
  })

  it('LogisticClassifier trains via gradient descent and separates linearly separable data', () => {
    // 2 features: high features -> Class 1 (Won), low features -> Class 0 (Lost)
    const X = [
      [2.0, 2.0],
      [2.5, 1.8],
      [3.0, 2.5],
      [-2.0, -1.5],
      [-2.5, -2.0],
      [-3.0, -2.8]
    ]
    const y = [1, 1, 1, 0, 0, 0]

    const classifier = new LogisticClassifier()
    classifier.train(X, y, { learningRate: 0.2, epochs: 150 })

    const probPos = classifier.predictProbability([2.5, 2.2])
    const probNeg = classifier.predictProbability([-2.5, -2.0])

    assert.ok(probPos > 0.85, `Expected probPos > 0.85, got ${probPos}`)
    assert.ok(probNeg < 0.15, `Expected probNeg < 0.15, got ${probNeg}`)
  })

  it('extractFeatures creates a 10-dimensional feature vector from deal and interactions', () => {
    const dummyDeal = {
      acv: 120000,
      stage: 'PROPOSAL_SENT',
      days_in_stage: 15,
      discount_pct: 10,
      employee_count: 500
    }

    const dummyInteractions = [
      { type: 'EMAIL_SENT', contact_id: 'c1', timestamp: new Date().toISOString() },
      { type: 'EMAIL_REPLY', contact_id: 'c1', timestamp: new Date().toISOString() },
      { type: 'DEMO_CALL', contact_id: 'c2', timestamp: new Date().toISOString() }
    ]

    const dummyContacts = [
      { id: 'c1', seniority: 'MANAGER', is_champion: 1, is_economic_buyer: 0 },
      { id: 'c2', seniority: 'VP', is_champion: 0, is_economic_buyer: 1 }
    ]

    const features = extractFeatures(dummyDeal, dummyInteractions, dummyContacts)

    assert.equal(features.length, FEATURE_NAMES.length)
    assert.equal(features[0], 3) // totalInteractions
    assert.equal(features[1], 1.0) // emailReplyRatio
    assert.equal(features[2], 1.0) // demoCompleted
    assert.equal(features[3], 1.0) // decisionMakersEngaged (VP)
    assert.equal(features[4], 1.0) // hasEconomicBuyer
  })

  it('evaluateModel computes precision, recall, F1, log-loss and ROC-AUC', () => {
    const X = [
      [1.0, 1.0],
      [1.5, 1.2],
      [-1.0, -1.0],
      [-1.5, -1.2]
    ]
    const y = [1, 1, 0, 0]

    const scaler = new StandardScaler()
    const scaledX = scaler.fitTransform(X)

    const classifier = new LogisticClassifier()
    classifier.train(scaledX, y, { epochs: 100 })

    const metrics = evaluateModel(classifier, scaler, X, y)

    assert.ok(metrics.accuracy >= 0.75)
    assert.ok(metrics.roc_auc >= 0.75)
    assert.ok(metrics.f1 >= 0.75)
    assert.ok(metrics.confusion_matrix.tp >= 1)
    assert.ok(metrics.confusion_matrix.tn >= 1)
  })

  it('explainPrediction provides positive drivers, negative risks and prescriptive action', () => {
    const weights = [0.8, 0.5, 1.2, 0.9, 1.5, -0.7, 0.3, -0.6, 0.2, 0.4]
    const classifier = new LogisticClassifier(weights, 0.1)
    const scaler = new StandardScaler(
      new Array(10).fill(5),
      new Array(10).fill(2)
    )

    const rawFeatures = [10, 0.8, 1.0, 2.0, 0.0, 20.0, 11.5, 25.0, 6.2, 0.5]
    const explanation = explainPrediction(classifier, scaler, rawFeatures)

    assert.ok(explanation.probability >= 0.0 && explanation.probability <= 1.0)
    assert.ok(['HIGH_CONVERSION', 'MEDIUM_RISK', 'LOW_CONVERSION'].includes(explanation.classification))
    assert.ok(explanation.positiveDrivers.length > 0)
    assert.ok(explanation.negativeRisks.length > 0)
    assert.ok(explanation.nextBestAction.length > 10)
  })
})
