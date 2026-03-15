import express from 'express'
import type { Database } from 'sql.js'
import { SqliteUserRepository } from './repositories/SqliteUserRepository'
import { BcryptPasswordHasher } from './services/BcryptPasswordHasher'
import { EmailValidatorImpl } from './services/EmailValidatorImpl'
import { UserServiceImpl } from './services/UserServiceImpl'
import { createUserRouter } from './routes/userRoutes'
import { errorHandler } from './middleware/errorHandler'

export function createApp(db: Database) {
  const app = express()

  app.use(express.json())

  // Instantiate dependencies
  const userRepository = new SqliteUserRepository(db)
  const passwordHasher = new BcryptPasswordHasher()
  const emailValidator = new EmailValidatorImpl(userRepository)
  const userService = new UserServiceImpl(userRepository, passwordHasher, emailValidator)

  // Mount routes
  app.use('/users', createUserRouter(userService))

  // Error handler must be last
  app.use(errorHandler)

  return app
}
