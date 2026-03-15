import type {
  UserService,
  UserRepository,
  PasswordHasher,
  EmailValidator,
  CreateUserDTO,
  UpdateUserDTO,
  User,
} from '../types/index'
import { ValidationError, ConflictError, NotFoundError } from '../types/index'

export class UserServiceImpl implements UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly emailValidator: EmailValidator,
  ) {}

  async createUser(data: CreateUserDTO): Promise<User> {
    // Validate required fields
    const errors: Array<{ field: string; message: string }> = []

    if (!data.name || data.name.trim() === '') {
      errors.push({ field: 'name', message: 'Name is required' })
    }
    if (!data.email || data.email.trim() === '') {
      errors.push({ field: 'email', message: 'Email is required' })
    }
    if (!data.password || data.password.trim() === '') {
      errors.push({ field: 'password', message: 'Password is required' })
    }

    if (errors.length > 0) {
      throw new ValidationError(errors)
    }

    // Validate email format
    if (!this.emailValidator.isValidFormat(data.email)) {
      throw new ValidationError([{ field: 'email', message: 'Invalid email format' }])
    }

    // Validate password length
    if (data.password.length < 8) {
      throw new ValidationError([
        { field: 'password', message: 'Password must be at least 8 characters long' },
      ])
    }

    // Check email uniqueness
    const isUnique = await this.emailValidator.isUnique(data.email)
    if (!isUnique) {
      throw new ConflictError(`A user with email '${data.email}' already exists`)
    }

    // Hash password and persist
    const password_hash = await this.passwordHasher.hash(data.password)
    const entity = await this.userRepository.create({
      name: data.name.trim(),
      email: data.email.trim(),
      password_hash,
      created_at: new Date(),
    })

    // Return User without password_hash
    const { password_hash: _, ...user } = entity
    return user
  }

  async listUsers(): Promise<User[]> {
    const entities = await this.userRepository.findAll()
    return entities.map(({ password_hash: _, ...user }) => user)
  }

  async getUserById(id: number): Promise<User> {
    const entity = await this.userRepository.findById(id)
    if (!entity) {
      throw new NotFoundError(`User with id ${id} not found`)
    }
    const { password_hash: _, ...user } = entity
    return user
  }

  async updateUser(id: number, data: UpdateUserDTO): Promise<void> {
    // Validate user exists
    const existing = await this.userRepository.findById(id)
    if (!existing) {
      throw new NotFoundError(`User with id ${id} not found`)
    }

    // Validate new email uniqueness (excluding current user)
    if (data.email !== undefined) {
      if (!this.emailValidator.isValidFormat(data.email)) {
        throw new ValidationError([{ field: 'email', message: 'Invalid email format' }])
      }
      const isUnique = await this.emailValidator.isUnique(data.email, id)
      if (!isUnique) {
        throw new ConflictError(`A user with email '${data.email}' already exists`)
      }
    }

    // Validate and hash new password if provided
    const updatePayload: Partial<Omit<typeof existing, 'id' | 'created_at'>> = {}

    if (data.name !== undefined) {
      updatePayload.name = data.name
    }
    if (data.email !== undefined) {
      updatePayload.email = data.email
    }
    if (data.password !== undefined) {
      if (data.password.length < 8) {
        throw new ValidationError([
          { field: 'password', message: 'Password must be at least 8 characters long' },
        ])
      }
      updatePayload.password_hash = await this.passwordHasher.hash(data.password)
    }

    await this.userRepository.update(id, updatePayload)
  }

  async deleteUser(id: number): Promise<void> {
    const existing = await this.userRepository.findById(id)
    if (!existing) {
      throw new NotFoundError(`User with id ${id} not found`)
    }
    await this.userRepository.delete(id)
  }
}
