export class AuthController {
  constructor (authService) {
    this.authService = authService
  }

  async login (req, res, next) {
    try {
      const { email, password } = req.body
      const result = await this.authService.login(email, password)
      res.json({
        success: true,
        token: result.token,
        user: result.user
      })
    } catch (err) {
      res.status(401).json({
        success: false,
        error: err.message
      })
    }
  }

  async me (req, res) {
    res.json({
      success: true,
      user: req.user
    })
  }
}
