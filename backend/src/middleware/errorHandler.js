export function errorHandler (err, req, res, next) {
  const statusCode = err.statusCode || 500
  const message = err.message || 'Internal Server Error'

  if (process.env.NODE_ENV !== 'test') {
    console.error(`[ERROR] ${req.method} ${req.url}:`, err)
  }

  res.status(statusCode).json({
    success: false,
    error: message
  })
}
