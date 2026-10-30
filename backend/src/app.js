import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'

import { getDb } from './data/database.js'
import { seedDatabase } from './data/seedData.js'
import { Repository } from './data/repository.js'

import { MLService } from './service/mlService.js'
import { PipelineService } from './service/pipelineService.js'
import { BottleneckService } from './service/bottleneckService.js'
import { AnalyticsService } from './service/analyticsService.js'
import { AuthService } from './service/authService.js'

import { AuthController } from './presentation/controllers/authController.js'
import { PipelineController } from './presentation/controllers/pipelineController.js'
import { DealController } from './presentation/controllers/dealController.js'
import { PredictionController } from './presentation/controllers/predictionController.js'
import { BottleneckController } from './presentation/controllers/bottleneckController.js'
import { ModelController } from './presentation/controllers/modelController.js'
import { AnalyticsController } from './presentation/controllers/analyticsController.js'
import { createRouter } from './presentation/routes.js'
import { errorHandler } from './middleware/errorHandler.js'

export async function createApp (customDbPath = null) {
  const app = express()
  const db = getDb(customDbPath)

  // Seed DB if initial run
  await seedDatabase(db)

  // Instantiate Repositories & Services
  const repository = new Repository(db)
  const mlService = new MLService(repository)

  // Train/ensure initial model is ready
  await mlService.ensureActiveModel()

  const pipelineService = new PipelineService(repository, mlService)
  const bottleneckService = new BottleneckService(repository, pipelineService)
  const analyticsService = new AnalyticsService(repository, mlService)
  const authService = new AuthService(repository)

  // Instantiate Controllers
  const authController = new AuthController(authService)
  const pipelineController = new PipelineController(pipelineService)
  const dealController = new DealController(repository, pipelineService)
  const predictionController = new PredictionController(mlService)
  const bottleneckController = new BottleneckController(bottleneckService, repository)
  const modelController = new ModelController(mlService, repository)
  const analyticsController = new AnalyticsController(analyticsService)

  // Middlewares
  app.use(helmet())
  app.use(cors())
  app.use(express.json({ limit: '1mb' }))

  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'))
  }

  // Mount API Router
  const apiRouter = createRouter({
    authController,
    pipelineController,
    dealController,
    predictionController,
    bottleneckController,
    modelController,
    analyticsController,
    authService
  })

  app.use('/api', apiRouter)

  // Global Error Handler
  app.use(errorHandler)

  return { app, db, repository, mlService, pipelineService, bottleneckService, authService }
}
