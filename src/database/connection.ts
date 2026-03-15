import initSqlJs, { Database } from 'sql.js'
import * as fs from 'fs'
import * as path from 'path'

let db: Database | null = null

const MIGRATION_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       VARCHAR(255) NOT NULL,
  email      VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
`

export async function getDatabase(dbPath?: string): Promise<Database> {
  if (db) return db

  const SQL = await initSqlJs()

  if (dbPath && fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath)
    db = new SQL.Database(fileBuffer)
  } else {
    db = new SQL.Database()
  }

  db.run(MIGRATION_SQL)
  return db
}

export function saveDatabase(database: Database, dbPath: string): void {
  const data = database.export()
  const buffer = Buffer.from(data)
  fs.mkdirSync(path.dirname(dbPath), { recursive: true })
  fs.writeFileSync(dbPath, buffer)
}

export function closeDatabase(): void {
  if (db) {
    db.close()
    db = null
  }
}

/** Create a fresh in-memory database (for testing) */
export async function createInMemoryDatabase(): Promise<Database> {
  const SQL = await initSqlJs()
  const memDb = new SQL.Database()
  memDb.run(MIGRATION_SQL)
  return memDb
}
