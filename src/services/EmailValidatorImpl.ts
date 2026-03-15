import type { EmailValidator, UserRepository } from '../types/index'

// RFC 5322-compliant email regex
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/

export class EmailValidatorImpl implements EmailValidator {
  constructor(private readonly userRepository: UserRepository) {}

  isValidFormat(email: string): boolean {
    return EMAIL_REGEX.test(email)
  }

  async isUnique(email: string, excludeUserId?: number): Promise<boolean> {
    const existing = await this.userRepository.findByEmail(email)
    if (!existing) return true
    if (excludeUserId !== undefined) return existing.id === excludeUserId
    return false
  }
}
