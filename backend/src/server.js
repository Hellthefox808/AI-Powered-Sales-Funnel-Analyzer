import { createApp } from './app.js'
import { closeDb } from './data/database.js'

const PORT = process.env.PORT || 4000

async function start () {
  try {
    const { app, db } = await createApp()

    const server = app.listen(PORT, () => {
      console.log(`[SERVER] AI-Powered Sales Funnel Analyzer API running on http://localhost:${PORT}`)
      console.log(`[SERVER] Health check available at http://localhost:${PORT}/api/health`)
    })

    const shutdown = () => {
      console.log('[SERVER] Shutting down gracefully...')
      server.close(() => {
        closeDb(db)
        console.log('[SERVER] Database closed. Exited.')
        process.exit(0)
      })
    }

    process.on('SIGINT', shutdown)
    process.on('SIGTERM', shutdown)
  } catch (err) {
    console.error('[FATAL] Failed to start server:', err)
    process.exit(1)
  }
}

start()
