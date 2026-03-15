// ─── Domain Models ───────────────────────────────────────────────────────────

/** Public user representation (no password_hash) */
export interface User {
  id: number
  name: string
  email: string
  created_at: Date
}

/** Internal user entity stored in the database */
export interface UserEntity extends User {
  password_hash: string
}

// ─── DTOs ────────────────────────────────────────────────────────────────────

export interface CreateUserDTO {
  name: string
  email: string
  password: string
}

export interface UpdateUserDTO {
  name?: string
  email?: string
  password?: string
}

// ─── Repository Contract ─────────────────────────────────────────────────────

export interface UserRepository {
  create(user: Omit<UserEntity, 'id'>): Promise<UserEntity>
  findAll(): Promise<UserEntity[]>
  findById(id: number): Promise<UserEntity | null>
  findByEmail(email: string): Promise<UserEntity | null>
  update(id: number, data: Partial<Omit<UserEntity, 'id' | 'created_at'>>): Promise<void>
  delete(id: number): Promise<boolean>
  exists(id: number): Promise<boolean>
}

// ─── Service Contract ────────────────────────────────────────────────────────

export interface UserService {
  createUser(data: CreateUserDTO): Promise<User>
  listUsers(): Promise<User[]>
  getUserById(id: number): Promise<User>
  updateUser(id: number, data: UpdateUserDTO): Promise<void>
  deleteUser(id: number): Promise<void>
}

// ─── Password Hasher Contract ────────────────────────────────────────────────

export interface PasswordHasher {
  hash(plainPassword: string): Promise<string>
  verify(plainPassword: string, hashedPassword: string): Promise<boolean>
}

// ─── Email Validator Contract ────────────────────────────────────────────────

export interface EmailValidator {
  isValidFormat(email: string): boolean
  isUnique(email: string, excludeUserId?: number): Promise<boolean>
}

// ─── Custom Errors ───────────────────────────────────────────────────────────

export class ValidationError extends Error {
  public readonly details: Array<{ field: string; message: string }>

  constructor(details: Array<{ field: string; message: string }>) {
    super('Validation error')
    this.name = 'ValidationError'
    this.details = details
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ConflictError'
  }
}
