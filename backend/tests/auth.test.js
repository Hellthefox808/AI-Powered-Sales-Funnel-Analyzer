import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { getDb, closeDb } from '../src/data/database.js'
import { seedDatabase } from '../src/data/seedData.js'
import { Repository } from '../src/data/repository.js'
import { AuthService } from '../src/service/authService.js'

describe('Auth Service — Credentials, Hashing & JWT Verification', () => {
  let db
  let repository
  let authService

  before(async () => {
    db = getDb(':memory:')
    await seedDatabase(db)
    repository = new Repository(db)
    authService = new AuthService(repository)
  })

  after(() => {
    closeDb(db)
  })

  it('authenticates valid credentials and generates signed JWT', async () => {
    const result = await authService.login('admin@funnel.ai', 'password123')

    assert.ok(result.token)
    assert.equal(result.user.email, 'admin@funnel.ai')
    assert.equal(result.user.role, 'revops_admin')

    const verified = authService.verifyToken(result.token)
    assert.equal(verified.email, 'admin@funnel.ai')
    assert.equal(verified.role, 'revops_admin')
  })

  it('rejects invalid password', async () => {
    await assert.rejects(
      async () => {
        await authService.login('admin@funnel.ai', 'wrongpassword')
      },
      /Invalid email or password/
    )
  })

  it('rejects non-existent user email', async () => {
    await assert.rejects(
      async () => {
        await authService.login('ghost@funnel.ai', 'password123')
      },
      /Invalid email or password/
    )
  })
})
