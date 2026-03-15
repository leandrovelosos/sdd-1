import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { BcryptPasswordHasher } from './BcryptPasswordHasher.js'

describe('BcryptPasswordHasher', () => {
  const hasher = new BcryptPasswordHasher()

  it('should hash a password and return a bcrypt hash string', async () => {
    const hash = await hasher.hash('mypassword123')
    expect(hash).toMatch(/^\$2[ab]\$10\$/)
  })

  it('should verify a correct password against its hash', async () => {
    const hash = await hasher.hash('correctpassword')
    expect(await hasher.verify('correctpassword', hash)).toBe(true)
  })

  it('should reject an incorrect password', async () => {
    const hash = await hasher.hash('correctpassword')
    expect(await hasher.verify('wrongpassword', hash)).toBe(false)
  })

  it('should produce different hashes for the same password (salt)', async () => {
    const hash1 = await hasher.hash('samepassword')
    const hash2 = await hasher.hash('samepassword')
    expect(hash1).not.toBe(hash2)
  })

  // **Validates: Requirements 1.6, 1.7**
  // Feature: user-management-system, Property 4: Password Hashing
  it('hash should differ from plain text and be verifiable (property)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 8, maxLength: 100 }),
        async (password) => {
          const hash = await hasher.hash(password)
          expect(hash).not.toBe(password)
          expect(await hasher.verify(password, hash)).toBe(true)
        }
      ),
      { numRuns: 20 }
    )
  })
})
