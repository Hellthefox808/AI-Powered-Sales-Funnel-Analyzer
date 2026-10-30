import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'sales-funnel-analyzer-secret-key-2026'
const JWT_EXPIRES_IN = '24h'

export class AuthService {
  constructor (repository) {
    this.repository = repository
  }

  async login (email, password) {
    if (!email || !password) {
      throw new Error('Email and password are required')
    }

    const user = this.repository.getUserByEmail(email.toLowerCase().trim())
    if (!user) {
      throw new Error('Invalid email or password')
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash)
    if (!isMatch) {
      throw new Error('Invalid email or password')
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    )

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    }
  }

  verifyToken (token) {
    try {
      return jwt.verify(token, JWT_SECRET)
    } catch {
      throw new Error('Invalid or expired authentication token')
    }
  }
}
