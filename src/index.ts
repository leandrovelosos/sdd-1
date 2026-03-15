import { getDatabase, saveDatabase } from './database/connection'
import { createApp } from './app'
import * as path from 'path'

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000
const DB_PATH = path.resolve('data/users.db')

async function main() {
  const db = await getDatabase(DB_PATH)
  const app = createApp(db)

  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })

  function shutdown(signal: string) {
    console.log(`\nReceived ${signal}. Saving database and shutting down...`)
    saveDatabase(db, DB_PATH)
    server.close(() => {
      console.log('Server closed.')
      process.exit(0)
    })
  }

  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))
}

main().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
