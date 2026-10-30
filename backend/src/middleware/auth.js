export function createAuthMiddleware (authService) {
  return function authenticate (req, res, next) {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication token required'
      })
    }

    const token = authHeader.substring(7).trim()
    try {
      const decoded = authService.verifyToken(token)
      req.user = decoded
      next()
    } catch (err) {
      return res.status(401).json({
        success: false,
        error: err.message || 'Invalid or expired token'
      })
    }
  }
}

export function requireRole (...allowedRoles) {
  return function roleCheck (req, res, next) {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      })
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Forbidden: role '${req.user.role}' lacks permission for this resource`
      })
    }

    next()
  }
}
