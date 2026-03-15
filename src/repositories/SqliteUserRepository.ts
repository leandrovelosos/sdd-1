import { Database } from 'sql.js'
import { UserEntity, UserRepository } from '../types'

export class SqliteUserRepository implements UserRepository {
  constructor(private readonly db: Database) {}

  async create(user: Omit<UserEntity, 'id'>): Promise<UserEntity> {
    this.db.run(
      'INSERT INTO users (name, email, password_hash, created_at) VALUES (?, ?, ?, ?)',
      [user.name, user.email, user.password_hash, user.created_at.toISOString()]
    )

    const result = this.db.exec('SELECT last_insert_rowid() as id')
    const id = result[0].values[0][0] as number

    return { id, ...user }
  }

  async findAll(): Promise<UserEntity[]> {
    const result = this.db.exec('SELECT id, name, email, password_hash, created_at FROM users')
    if (!result.length) return []
    return result[0].values.map((row) => this.rowToEntity(result[0].columns, row))
  }

  async findById(id: number): Promise<UserEntity | null> {
    const stmt = this.db.prepare('SELECT id, name, email, password_hash, created_at FROM users WHERE id = ?')
    const row = stmt.getAsObject([id])
    stmt.free()

    if (!row.id) return null
    return this.objectToEntity(row)
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const stmt = this.db.prepare('SELECT id, name, email, password_hash, created_at FROM users WHERE email = ?')
    const row = stmt.getAsObject([email])
    stmt.free()

    if (!row.id) return null
    return this.objectToEntity(row)
  }

  async update(id: number, data: Partial<Omit<UserEntity, 'id' | 'created_at'>>): Promise<void> {
    const fields: string[] = []
    const values: (string | number)[] = []

    if (data.name !== undefined) {
      fields.push('name = ?')
      values.push(data.name)
    }
    if (data.email !== undefined) {
      fields.push('email = ?')
      values.push(data.email)
    }
    if (data.password_hash !== undefined) {
      fields.push('password_hash = ?')
      values.push(data.password_hash)
    }

    if (!fields.length) return

    values.push(id)
    this.db.run(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values)
  }

  async delete(id: number): Promise<boolean> {
    if (!(await this.exists(id))) return false
    this.db.run('DELETE FROM users WHERE id = ?', [id])
    return true
  }

  async exists(id: number): Promise<boolean> {
    const stmt = this.db.prepare('SELECT 1 FROM users WHERE id = ?')
    const row = stmt.getAsObject([id])
    stmt.free()
    return Object.keys(row).length > 0
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private rowToEntity(columns: string[], row: (string | number | null | Uint8Array)[]): UserEntity {
    const obj: Record<string, unknown> = {}
    columns.forEach((col, i) => { obj[col] = row[i] })
    return this.objectToEntity(obj)
  }

  private objectToEntity(obj: Record<string, unknown>): UserEntity {
    return {
      id: obj.id as number,
      name: obj.name as string,
      email: obj.email as string,
      password_hash: obj.password_hash as string,
      created_at: new Date(obj.created_at as string),
    }
  }
}
