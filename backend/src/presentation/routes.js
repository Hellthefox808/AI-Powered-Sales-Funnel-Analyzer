import express from 'express'
import { createAuthMiddleware, requireRole } from '../middleware/auth.js'
import { ROLES } from '../config/constants.js'

export function createRouter ({
  authController,
  pipelineController,
  dealController,
  predictionController,
  bottleneckController,
  modelController,
  analyticsController,
  authService
}) {
  const router = express.Router()
  const authenticate = createAuthMiddleware(authService)

  // Health probe
  router.get('/health', (req, res) => {
    res.json({
      status: 'UP',
      timestamp: new Date().toISOString(),
      service: 'ai-powered-sales-funnel-analyzer'
    })
  })

  // Authentication
  router.post('/auth/login', (req, res, next) => authController.login(req, res, next))
  router.get('/auth/me', authenticate, (req, res) => authController.me(req, res))

  // Funnel & Pipeline
  router.get('/pipeline/funnel', authenticate, (req, res, next) => pipelineController.getFunnel(req, res, next))

  // Deals
  router.get('/deals', authenticate, (req, res, next) => dealController.getDeals(req, res, next))
  router.get('/deals/:id', authenticate, (req, res, next) => dealController.getDealById(req, res, next))
  router.post('/deals/:id/stage', authenticate, (req, res, next) => dealController.updateStage(req, res, next))
  router.post('/deals/:id/interactions', authenticate, (req, res, next) => dealController.addInteraction(req, res, next))

  // Predictions & Simulations
  router.get('/predictions/deal/:id', authenticate, (req, res, next) => predictionController.predictDeal(req, res, next))
  router.post('/predictions/what-if', authenticate, (req, res, next) => predictionController.whatIf(req, res, next))

  // Bottlenecks & Friction Diagnostics
  router.get('/bottlenecks', authenticate, (req, res, next) => bottleneckController.getBottlenecks(req, res, next))
  router.put(
    '/bottlenecks/benchmarks/:stage',
    authenticate,
    requireRole(ROLES.REVOPS_ADMIN),
    (req, res, next) => bottleneckController.updateBenchmark(req, res, next)
  )

  // ML Models & Lab
  router.get('/models/active', authenticate, (req, res, next) => modelController.getActiveModel(req, res, next))
  router.post(
    '/models/retrain',
    authenticate,
    requireRole(ROLES.REVOPS_ADMIN, ROLES.SALES_MANAGER),
    (req, res, next) => modelController.retrain(req, res, next)
  )

  // Analytics & Forecasts
  router.get('/analytics/reps', authenticate, (req, res, next) => analyticsController.getReps(req, res, next))
  router.get('/analytics/forecast', authenticate, (req, res, next) => analyticsController.getForecast(req, res, next))

  return router
}
