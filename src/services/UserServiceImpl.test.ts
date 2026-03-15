import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import { UserServiceImpl } from './UserServiceImpl.js'
import type { UserRepository, PasswordHasher, EmailValidator, UserEntity } from '../types/index.js'
import { ValidationError, ConflictError, NotFoundError } from '../types/index.js'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeEntity(overrides: Partial<UserEntity> = {}): UserEntity {
  return {
    id: 1,
    name: 'Alice',
    email: 'alice@example.com',
    password_hash: 'hashed_password',
    created_at: new Date('2024-01-01'),
    ...overrides,
  }
}

function makeDeps(overrides: {
  repo?: Partial<UserRepository>
  hasher?: Partial<PasswordHasher>
  validator?: Partial<EmailValidator>
} = {}) {
  const repo: UserRepository = {
    create: vi.fn().mockResolvedValue(makeEntity()),
    findAll: vi.fn().mockResolvedValue([]),
    findById: vi.fn().mockResolvedValue(null),
    findByEmail: vi.fn().mockResolvedValue(null),
    update: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(true),
    exists: vi.fn().mockResolvedValue(false),
    ...overrides.repo,
  }
  const hasher: PasswordHasher = {
    hash: vi.fn().mockResolvedValue('hashed_password'),
    verify: vi.fn().mockResolvedValue(true),
    ...overrides.hasher,
  }
  const validator: EmailValidator = {
    isValidFormat: vi.fn().mockReturnValue(true),
    isUnique: vi.fn().mockResolvedValue(true),
    ...overrides.validator,
  }
  return { repo, hasher, validator }
}

// ─── Unit Tests ───────────────────────────────────────────────────────────────

describe('UserServiceImpl.createUser', () => {
  it('should create a user and return it without password_hash', async () => {
    const { repo, hasher, validator } = makeDeps()
    const service = new UserServiceImpl(repo, hasher, validator)

    const user = await service.createUser({ name: 'Alice', email: 'alice@example.com', password: 'secret123' })

    expect(user.id).toBe(1)
    expect(user.name).toBe('Alice')
    expect(user.email).toBe('alice@example.com')
    expect(user.created_at).toBeDefined()
    expect((user as any).password_hash).toBeUndefined()
  })

  it('should hash the password before persisting', async () => {
    const { repo, hasher, validator } = makeDeps()
    const service = new UserServiceImpl(repo, hasher, validator)

    await service.createUser({ name: 'Alice', email: 'alice@example.com', password: 'secret123' })

    expect(hasher.hash).toHaveBeenCalledWith('secret123')
    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ password_hash: 'hashed_password' }))
  })

  it('should throw ValidationError when name is empty', async () => {
    const { repo, hasher, validator } = makeDeps()
    const service = new UserServiceImpl(repo, hasher, validator)

    await expect(service.createUser({ name: '', email: 'alice@example.com', password: 'secret123' }))
      .rejects.toBeInstanceOf(ValidationError)
  })

  it('should throw ValidationError when email is empty', async () => {
    const { repo, hasher, validator } = makeDeps()
    const service = new UserServiceImpl(repo, hasher, validator)

    await expect(service.createUser({ name: 'Alice', email: '', password: 'secret123' }))
      .rejects.toBeInstanceOf(ValidationError)
  })

  it('should throw ValidationError when password is empty', async () => {
    const { repo, hasher, validator } = makeDeps()
    const service = new UserServiceImpl(repo, hasher, validator)

    await expect(service.createUser({ name: 'Alice', email: 'alice@example.com', password: '' }))
      .rejects.toBeInstanceOf(ValidationError)
  })

  it('should throw ValidationError when email format is invalid', async () => {
    const { repo, hasher, validator } = makeDeps({
      validator: { isValidFormat: vi.fn().mockReturnValue(false) },
    })
    const service = new UserServiceImpl(repo, hasher, validator)

    await expect(service.createUser({ name: 'Alice', email: 'not-an-email', password: 'secret123' }))
      .rejects.toBeInstanceOf(ValidationError)
  })

  it('should throw ValidationError when password is shorter than 8 characters', async () => {
    const { repo, hasher, validator } = makeDeps()
    const service = new UserServiceImpl(repo, hasher, validator)

    await expect(service.createUser({ name: 'Alice', email: 'alice@example.com', password: 'short' }))
      .rejects.toBeInstanceOf(ValidationError)
  })

  it('should throw ConflictError when email already exists', async () => {
    const { repo, hasher, validator } = makeDeps({
      validator: { isUnique: vi.fn().mockResolvedValue(false) },
    })
    const service = new UserServiceImpl(repo, hasher, validator)

    await expect(service.createUser({ name: 'Alice', email: 'alice@example.com', password: 'secret123' }))
      .rejects.toBeInstanceOf(ConflictError)
  })
})

// ─── Property-Based Tests ─────────────────────────────────────────────────────

// ─── listUsers Unit Tests ─────────────────────────────────────────────────────

describe('UserServiceImpl.listUsers', () => {
  it('should return empty array when no users exist', async () => {
    const { repo, hasher, validator } = makeDeps()
    const service = new UserServiceImpl(repo, hasher, validator)

    const users = await service.listUsers()

    expect(users).toEqual([])
    expect(repo.findAll).toHaveBeenCalled()
  })

  it('should return users without password_hash', async () => {
    const entities = [
      makeEntity({ id: 1, name: 'Alice', email: 'alice@example.com' }),
      makeEntity({ id: 2, name: 'Bob', email: 'bob@example.com' }),
    ]
    const { repo, hasher, validator } = makeDeps({
      repo: { findAll: vi.fn().mockResolvedValue(entities) },
    })
    const service = new UserServiceImpl(repo, hasher, validator)

    const users = await service.listUsers()

    expect(users).toHaveLength(2)
    for (const user of users) {
      expect((user as any).password_hash).toBeUndefined()
    }
  })

  it('should return all user fields except password_hash', async () => {
    const entity = makeEntity({ id: 42, name: 'Alice', email: 'alice@example.com' })
    const { repo, hasher, validator } = makeDeps({
      repo: { findAll: vi.fn().mockResolvedValue([entity]) },
    })
    const service = new UserServiceImpl(repo, hasher, validator)

    const [user] = await service.listUsers()

    expect(user.id).toBe(42)
    expect(user.name).toBe('Alice')
    expect(user.email).toBe('alice@example.com')
    expect(user.created_at).toBeDefined()
    expect((user as any).password_hash).toBeUndefined()
  })
})

/**
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4
 * Feature: user-management-system, Property 6: List Users Never Exposes password_hash
 */
describe('Property 6: List Users Never Exposes password_hash', () => {
  it('should never expose password_hash for any list of users', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            id: fc.integer({ min: 1 }),
            name: fc.string({ minLength: 1 }),
            email: fc.emailAddress(),
            password_hash: fc.string({ minLength: 8 }),
            created_at: fc.date(),
          }),
        ),
        async (rawEntities) => {
          const { repo, hasher, validator } = makeDeps({
            repo: { findAll: vi.fn().mockResolvedValue(rawEntities) },
          })
          const service = new UserServiceImpl(repo, hasher, validator)

          const users = await service.listUsers()

          expect(users).toHaveLength(rawEntities.length)
          for (const user of users) {
            expect((user as any).password_hash).toBeUndefined()
          }
        },
      ),
      { numRuns: 100 },
    )
  })
})

/**
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4
 * Feature: user-management-system, Property 1: User Creation with Valid Data
 */
describe('Property 1: User Creation with Valid Data', () => {
  it('creating user with valid data should succeed and return user without password_hash', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 255 }),
          email: fc.emailAddress(),
          password: fc.string({ minLength: 8, maxLength: 100 }),
        }),
        async (userData) => {
          fc.pre(userData.name.trim().length > 0)
          const entity = makeEntity({ name: userData.name, email: userData.email })
          const { repo, hasher, validator } = makeDeps({
            repo: { create: vi.fn().mockResolvedValue(entity) },
          })
          const service = new UserServiceImpl(repo, hasher, validator)

          const user = await service.createUser(userData)

          expect(user.id).toBeDefined()
          expect(user.name).toBe(entity.name)
          expect(user.email).toBe(entity.email)
          expect(user.created_at).toBeDefined()
          expect((user as any).password_hash).toBeUndefined()
        },
      ),
      { numRuns: 100 },
    )
  })
})

/**
 * Validates: Requirements 1.2, 1.3
 * Feature: user-management-system, Property 2: Email Uniqueness on Creation
 */
describe('Property 2: Email Uniqueness on Creation', () => {
  it('should throw ConflictError for any duplicate email', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        async (email) => {
          const { repo, hasher, validator } = makeDeps({
            validator: { isUnique: vi.fn().mockResolvedValue(false) },
          })
          const service = new UserServiceImpl(repo, hasher, validator)

          await expect(
            service.createUser({ name: 'Alice', email, password: 'secret123' }),
          ).rejects.toBeInstanceOf(ConflictError)
        },
      ),
      { numRuns: 100 },
    )
  })
})

/**
 * Validates: Requirements 1.4, 1.5
 * Feature: user-management-system, Property 3: Password Length Validation
 */
describe('Property 3: Password Length Validation', () => {
  it('should throw ValidationError for any password shorter than 8 characters', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ maxLength: 7 }),
        async (shortPassword) => {
          // skip empty password (caught by required-field check, not length check)
          fc.pre(shortPassword.trim().length > 0)

          const { repo, hasher, validator } = makeDeps()
          const service = new UserServiceImpl(repo, hasher, validator)

          await expect(
            service.createUser({ name: 'Alice', email: 'alice@example.com', password: shortPassword }),
          ).rejects.toBeInstanceOf(ValidationError)
        },
      ),
      { numRuns: 100 },
    )
  })
})

/**
 * Validates: Requirements 1.6, 1.7
 * Feature: user-management-system, Property 4: Password Hashing
 */
describe('Property 4: Password Hashing', () => {
  it('stored password_hash should differ from plain text and be verifiable', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 8, maxLength: 100 }),
        async (password) => {
          const fakeHash = `hashed:${password}`
          const entity = makeEntity({ password_hash: fakeHash })
          const { repo, hasher, validator } = makeDeps({
            repo: { create: vi.fn().mockResolvedValue(entity) },
            hasher: {
              hash: vi.fn().mockResolvedValue(fakeHash),
              verify: vi.fn().mockResolvedValue(true),
            },
          })
          const service = new UserServiceImpl(repo, hasher, validator)

          await service.createUser({ name: 'Alice', email: 'alice@example.com', password })

          expect(hasher.hash).toHaveBeenCalledWith(password)
          const callArg = (repo.create as ReturnType<typeof vi.fn>).mock.calls[0][0]
          expect(callArg.password_hash).not.toBe(password)
          expect(callArg.password_hash).toBe(fakeHash)
        },
      ),
      { numRuns: 100 },
    )
  })
})

/**
 * Validates: Requirements 1.9
 * Feature: user-management-system, Property 5: Required Fields Validation
 */
describe('Property 5: Required Fields Validation', () => {
  it('should throw ValidationError when any required field is empty', async () => {
    const emptyVariants = [
      { name: '', email: 'alice@example.com', password: 'secret123' },
      { name: 'Alice', email: '', password: 'secret123' },
      { name: 'Alice', email: 'alice@example.com', password: '' },
    ]

    for (const data of emptyVariants) {
      const { repo, hasher, validator } = makeDeps()
      const service = new UserServiceImpl(repo, hasher, validator)
      await expect(service.createUser(data)).rejects.toBeInstanceOf(ValidationError)
    }
  })
})

// ─── getUserById Unit Tests ───────────────────────────────────────────────────

describe('UserServiceImpl.getUserById', () => {
  it('should return user without password_hash when found', async () => {
    const entity = makeEntity({ id: 5, name: 'Bob', email: 'bob@example.com' })
    const { repo, hasher, validator } = makeDeps({
      repo: { findById: vi.fn().mockResolvedValue(entity) },
    })
    const service = new UserServiceImpl(repo, hasher, validator)

    const user = await service.getUserById(5)

    expect(user.id).toBe(5)
    expect(user.name).toBe('Bob')
    expect(user.email).toBe('bob@example.com')
    expect(user.created_at).toBeDefined()
    expect((user as any).password_hash).toBeUndefined()
  })

  it('should call repository findById with the given id', async () => {
    const entity = makeEntity({ id: 7 })
    const { repo, hasher, validator } = makeDeps({
      repo: { findById: vi.fn().mockResolvedValue(entity) },
    })
    const service = new UserServiceImpl(repo, hasher, validator)

    await service.getUserById(7)

    expect(repo.findById).toHaveBeenCalledWith(7)
  })

  it('should throw NotFoundError when user does not exist', async () => {
    const { repo, hasher, validator } = makeDeps({
      repo: { findById: vi.fn().mockResolvedValue(null) },
    })
    const service = new UserServiceImpl(repo, hasher, validator)

    await expect(service.getUserById(99)).rejects.toBeInstanceOf(NotFoundError)
  })
})

/**
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4
 * Feature: user-management-system, Property 7: getUserById Never Exposes password_hash
 */
describe('Property 7: getUserById Never Exposes password_hash', () => {
  it('should never expose password_hash for any existing user', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.integer({ min: 1 }),
          name: fc.string({ minLength: 1 }),
          email: fc.emailAddress(),
          password_hash: fc.string({ minLength: 8 }),
          created_at: fc.date(),
        }),
        async (entity) => {
          const { repo, hasher, validator } = makeDeps({
            repo: { findById: vi.fn().mockResolvedValue(entity) },
          })
          const service = new UserServiceImpl(repo, hasher, validator)

          const user = await service.getUserById(entity.id)

          expect(user.id).toBe(entity.id)
          expect(user.name).toBe(entity.name)
          expect(user.email).toBe(entity.email)
          expect((user as any).password_hash).toBeUndefined()
        },
      ),
      { numRuns: 100 },
    )
  })

  it('should throw NotFoundError for any id when user does not exist', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1 }),
        async (id) => {
          const { repo, hasher, validator } = makeDeps({
            repo: { findById: vi.fn().mockResolvedValue(null) },
          })
          const service = new UserServiceImpl(repo, hasher, validator)

          await expect(service.getUserById(id)).rejects.toBeInstanceOf(NotFoundError)
        },
      ),
      { numRuns: 100 },
    )
  })
})

// ─── updateUser Unit Tests ────────────────────────────────────────────────────

describe('UserServiceImpl.updateUser', () => {
  it('should call repository update with the given id and data', async () => {
    const entity = makeEntity({ id: 1 })
    const { repo, hasher, validator } = makeDeps({
      repo: { findById: vi.fn().mockResolvedValue(entity) },
    })
    const service = new UserServiceImpl(repo, hasher, validator)

    await service.updateUser(1, { name: 'Bob' })

    expect(repo.update).toHaveBeenCalledWith(1, { name: 'Bob' })
  })

  it('should throw NotFoundError when user does not exist', async () => {
    const { repo, hasher, validator } = makeDeps({
      repo: { findById: vi.fn().mockResolvedValue(null) },
    })
    const service = new UserServiceImpl(repo, hasher, validator)

    await expect(service.updateUser(99, { name: 'Bob' })).rejects.toBeInstanceOf(NotFoundError)
  })

  it('should throw ConflictError when new email already belongs to another user', async () => {
    const entity = makeEntity({ id: 1 })
    const { repo, hasher, validator } = makeDeps({
      repo: { findById: vi.fn().mockResolvedValue(entity) },
      validator: { isUnique: vi.fn().mockResolvedValue(false) },
    })
    const service = new UserServiceImpl(repo, hasher, validator)

    await expect(service.updateUser(1, { email: 'other@example.com' })).rejects.toBeInstanceOf(ConflictError)
  })

  it('should pass excludeUserId to isUnique when updating email', async () => {
    const entity = makeEntity({ id: 5 })
    const isUniqueMock = vi.fn().mockResolvedValue(true)
    const { repo, hasher, validator } = makeDeps({
      repo: { findById: vi.fn().mockResolvedValue(entity) },
      validator: { isUnique: isUniqueMock },
    })
    const service = new UserServiceImpl(repo, hasher, validator)

    await service.updateUser(5, { email: 'new@example.com' })

    expect(isUniqueMock).toHaveBeenCalledWith('new@example.com', 5)
  })

  it('should throw ValidationError when new password is shorter than 8 characters', async () => {
    const entity = makeEntity({ id: 1 })
    const { repo, hasher, validator } = makeDeps({
      repo: { findById: vi.fn().mockResolvedValue(entity) },
    })
    const service = new UserServiceImpl(repo, hasher, validator)

    await expect(service.updateUser(1, { password: 'short' })).rejects.toBeInstanceOf(ValidationError)
  })

  it('should hash the new password and persist the hash', async () => {
    const entity = makeEntity({ id: 1 })
    const { repo, hasher, validator } = makeDeps({
      repo: { findById: vi.fn().mockResolvedValue(entity) },
      hasher: { hash: vi.fn().mockResolvedValue('new_hash') },
    })
    const service = new UserServiceImpl(repo, hasher, validator)

    await service.updateUser(1, { password: 'newpassword' })

    expect(hasher.hash).toHaveBeenCalledWith('newpassword')
    expect(repo.update).toHaveBeenCalledWith(1, expect.objectContaining({ password_hash: 'new_hash' }))
  })

  it('should not call hash when password is not provided', async () => {
    const entity = makeEntity({ id: 1 })
    const { repo, hasher, validator } = makeDeps({
      repo: { findById: vi.fn().mockResolvedValue(entity) },
    })
    const service = new UserServiceImpl(repo, hasher, validator)

    await service.updateUser(1, { name: 'NewName' })

    expect(hasher.hash).not.toHaveBeenCalled()
  })

  it('should throw ValidationError when new email format is invalid', async () => {
    const entity = makeEntity({ id: 1 })
    const { repo, hasher, validator } = makeDeps({
      repo: { findById: vi.fn().mockResolvedValue(entity) },
      validator: { isValidFormat: vi.fn().mockReturnValue(false) },
    })
    const service = new UserServiceImpl(repo, hasher, validator)

    await expect(service.updateUser(1, { email: 'not-an-email' })).rejects.toBeInstanceOf(ValidationError)
  })
})

/**
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9
 * Feature: user-management-system, Property 9: Operations on Non-Existent Users Fail
 */
describe('Property 9: updateUser on Non-Existent Users Fails', () => {
  it('should throw NotFoundError for any non-existent user id', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1 }),
        async (id) => {
          const { repo, hasher, validator } = makeDeps({
            repo: { findById: vi.fn().mockResolvedValue(null) },
          })
          const service = new UserServiceImpl(repo, hasher, validator)

          await expect(service.updateUser(id, { name: 'X' })).rejects.toBeInstanceOf(NotFoundError)
        },
      ),
      { numRuns: 100 },
    )
  })
})

/**
 * Validates: Requirements 4.3, 4.4
 * Feature: user-management-system, Property 11: Email Uniqueness on Update
 */
describe('Property 11: Email Uniqueness on Update', () => {
  it('should throw ConflictError for any duplicate email on update', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        async (email) => {
          const entity = makeEntity({ id: 1 })
          const { repo, hasher, validator } = makeDeps({
            repo: { findById: vi.fn().mockResolvedValue(entity) },
            validator: { isUnique: vi.fn().mockResolvedValue(false) },
          })
          const service = new UserServiceImpl(repo, hasher, validator)

          await expect(service.updateUser(1, { email })).rejects.toBeInstanceOf(ConflictError)
        },
      ),
      { numRuns: 100 },
    )
  })
})

/**
 * Validates: Requirements 4.6, 4.7
 * Feature: user-management-system, Property 12: Password Hash Update
 */
describe('Property 12: Password Hash Update', () => {
  it('should hash any new password and never store plain text', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 8, maxLength: 100 }),
        async (password) => {
          const fakeHash = `hashed:${password}`
          const entity = makeEntity({ id: 1 })
          const { repo, hasher, validator } = makeDeps({
            repo: { findById: vi.fn().mockResolvedValue(entity) },
            hasher: { hash: vi.fn().mockResolvedValue(fakeHash) },
          })
          const service = new UserServiceImpl(repo, hasher, validator)

          await service.updateUser(1, { password })

          expect(hasher.hash).toHaveBeenCalledWith(password)
          const callArg = (repo.update as ReturnType<typeof vi.fn>).mock.calls[0][1]
          expect(callArg.password_hash).not.toBe(password)
          expect(callArg.password_hash).toBe(fakeHash)
        },
      ),
      { numRuns: 100 },
    )
  })
})

// ─── deleteUser Unit Tests ────────────────────────────────────────────────────

describe('UserServiceImpl.deleteUser', () => {
  it('should call repository delete with the given id', async () => {
    const entity = makeEntity({ id: 3 })
    const { repo, hasher, validator } = makeDeps({
      repo: { findById: vi.fn().mockResolvedValue(entity) },
    })
    const service = new UserServiceImpl(repo, hasher, validator)

    await service.deleteUser(3)

    expect(repo.delete).toHaveBeenCalledWith(3)
  })

  it('should throw NotFoundError when user does not exist', async () => {
    const { repo, hasher, validator } = makeDeps({
      repo: { findById: vi.fn().mockResolvedValue(null) },
    })
    const service = new UserServiceImpl(repo, hasher, validator)

    await expect(service.deleteUser(99)).rejects.toBeInstanceOf(NotFoundError)
  })

  it('should not call repository delete when user does not exist', async () => {
    const { repo, hasher, validator } = makeDeps({
      repo: { findById: vi.fn().mockResolvedValue(null) },
    })
    const service = new UserServiceImpl(repo, hasher, validator)

    await expect(service.deleteUser(99)).rejects.toBeInstanceOf(NotFoundError)
    expect(repo.delete).not.toHaveBeenCalled()
  })

  it('should resolve without error when user exists', async () => {
    const entity = makeEntity({ id: 1 })
    const { repo, hasher, validator } = makeDeps({
      repo: { findById: vi.fn().mockResolvedValue(entity) },
    })
    const service = new UserServiceImpl(repo, hasher, validator)

    await expect(service.deleteUser(1)).resolves.toBeUndefined()
  })
})

/**
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4
 * Feature: user-management-system, Property: deleteUser on Non-Existent Users Fails
 */
describe('Property: deleteUser on Non-Existent Users Fails', () => {
  it('should throw NotFoundError for any non-existent user id', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1 }),
        async (id) => {
          const { repo, hasher, validator } = makeDeps({
            repo: { findById: vi.fn().mockResolvedValue(null) },
          })
          const service = new UserServiceImpl(repo, hasher, validator)

          await expect(service.deleteUser(id)).rejects.toBeInstanceOf(NotFoundError)
        },
      ),
      { numRuns: 100 },
    )
  })

  it('should call delete on repository for any existing user id', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1 }),
        async (id) => {
          const entity = makeEntity({ id })
          const deleteMock = vi.fn().mockResolvedValue(true)
          const { repo, hasher, validator } = makeDeps({
            repo: {
              findById: vi.fn().mockResolvedValue(entity),
              delete: deleteMock,
            },
          })
          const service = new UserServiceImpl(repo, hasher, validator)

          await service.deleteUser(id)

          expect(deleteMock).toHaveBeenCalledWith(id)
        },
      ),
      { numRuns: 100 },
    )
  })
})
