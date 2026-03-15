import { describe, it, expect, vi } from 'vitest'
import fc from 'fast-check'
import { EmailValidatorImpl } from './EmailValidatorImpl.js'
import type { UserRepository, UserEntity } from '../types/index.js'

function makeRepo(found: UserEntity | null = null): UserRepository {
  return {
    findByEmail: vi.fn().mockResolvedValue(found),
    create: vi.fn(),
    findAll: vi.fn(),
    findById: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    exists: vi.fn(),
  } as unknown as UserRepository
}

function makeUser(id: number, email: string): UserEntity {
  return { id, name: 'Test', email, password_hash: 'hash', created_at: new Date() }
}

describe('EmailValidatorImpl', () => {
  describe('isValidFormat', () => {
    it('should accept valid emails', () => {
      const validator = new EmailValidatorImpl(makeRepo())
      expect(validator.isValidFormat('user@example.com')).toBe(true)
      expect(validator.isValidFormat('user.name+tag@sub.domain.org')).toBe(true)
    })

    it('should reject invalid emails', () => {
      const validator = new EmailValidatorImpl(makeRepo())
      expect(validator.isValidFormat('')).toBe(false)
      expect(validator.isValidFormat('notanemail')).toBe(false)
      expect(validator.isValidFormat('@nodomain.com')).toBe(false)
      expect(validator.isValidFormat('missing@tld')).toBe(false)
    })
  })

  describe('isUnique', () => {
    it('should return true when email is not found', async () => {
      const validator = new EmailValidatorImpl(makeRepo(null))
      expect(await validator.isUnique('new@example.com')).toBe(true)
    })

    it('should return false when email belongs to another user', async () => {
      const validator = new EmailValidatorImpl(makeRepo(makeUser(1, 'taken@example.com')))
      expect(await validator.isUnique('taken@example.com')).toBe(false)
    })

    it('should return true when email belongs to the excluded user (update case)', async () => {
      const validator = new EmailValidatorImpl(makeRepo(makeUser(5, 'own@example.com')))
      expect(await validator.isUnique('own@example.com', 5)).toBe(true)
    })

    it('should return false when email belongs to a different user even with excludeUserId', async () => {
      const validator = new EmailValidatorImpl(makeRepo(makeUser(1, 'other@example.com')))
      expect(await validator.isUnique('other@example.com', 99)).toBe(false)
    })
  })

  // **Validates: Requirements 1.2, 4.3**
  // Feature: user-management-system, Property 2: Email Uniqueness on Creation
  // Feature: user-management-system, Property 11: Email Uniqueness on Update
  it('isUnique returns false for any existing email not owned by excluded user (property)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.integer({ min: 1, max: 1000 }),
        fc.integer({ min: 1001, max: 2000 }),
        async (email, existingId, requesterId) => {
          const repo = makeRepo(makeUser(existingId, email))
          const validator = new EmailValidatorImpl(repo)
          // No exclusion: must be false
          expect(await validator.isUnique(email)).toBe(false)
          // Excluded user is different: still false
          expect(await validator.isUnique(email, requesterId)).toBe(false)
          // Excluded user is the owner: true
          expect(await validator.isUnique(email, existingId)).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })
})
