import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import {
  validateData,
  sanitizeString,
  isValidCuid,
  isValidEmail,
  validateIds,
} from '../validation-utils'

describe('Validation Utils', () => {
  describe('validateData', () => {
    const testSchema = z.object({
      name: z.string().min(2),
      age: z.number().min(0),
    })

    it('should return success for valid data', () => {
      const data = { name: '张三', age: 25 }
      const result = validateData(testSchema, data)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(data)
      }
    })

    it('should return error for invalid data', () => {
      const data = { name: 'A', age: -1 }
      const result = validateData(testSchema, data)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBeDefined()
      }
    })

    it('should handle missing fields', () => {
      const data = { name: '张三' }
      const result = validateData(testSchema, data)

      expect(result.success).toBe(false)
    })
  })

  describe('sanitizeString', () => {
    it('should trim whitespace', () => {
      const input = '  hello world  '
      const result = sanitizeString(input)
      expect(result).toBe('hello world')
    })

    it('should replace multiple spaces with single space', () => {
      const input = 'hello    world'
      const result = sanitizeString(input)
      expect(result).toBe('hello world')
    })

    it('should remove HTML tag characters', () => {
      const input = 'hello<script>world</script>'
      const result = sanitizeString(input)
      expect(result).toBe('helloscriptworld/script')
    })

    it('should handle empty string', () => {
      const input = ''
      const result = sanitizeString(input)
      expect(result).toBe('')
    })
  })

  describe('isValidCuid', () => {
    it('should validate correct CUID format', () => {
      const validCuid = 'c1234567890123456789abcde'
      expect(isValidCuid(validCuid)).toBe(true)
    })

    it('should reject CUID without c prefix', () => {
      const invalidCuid = 'x1234567890123456789abcde'
      expect(isValidCuid(invalidCuid)).toBe(false)
    })

    it('should reject CUID with wrong length', () => {
      const invalidCuid = 'c123456789'
      expect(isValidCuid(invalidCuid)).toBe(false)
    })

    it('should reject CUID with uppercase letters', () => {
      const invalidCuid = 'c1234567890123456789ABCDE'
      expect(isValidCuid(invalidCuid)).toBe(false)
    })

    it('should reject empty string', () => {
      expect(isValidCuid('')).toBe(false)
    })
  })

  describe('isValidEmail', () => {
    it('should validate correct email format', () => {
      expect(isValidEmail('test@example.com')).toBe(true)
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true)
    })

    it('should reject email without @', () => {
      expect(isValidEmail('testexample.com')).toBe(false)
    })

    it('should reject email without domain', () => {
      expect(isValidEmail('test@')).toBe(false)
    })

    it('should reject email without local part', () => {
      expect(isValidEmail('@example.com')).toBe(false)
    })

    it('should reject email with spaces', () => {
      expect(isValidEmail('test @example.com')).toBe(false)
    })
  })

  describe('validateIds', () => {
    it('should validate array of valid CUIDs', () => {
      const ids = [
        'c1234567890123456789abcde',
        'c9876543210987654321zyxwv',
      ]
      const result = validateIds(ids)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(ids)
      }
    })

    it('should reject array with invalid CUIDs', () => {
      const ids = [
        'c1234567890123456789abcde',
        'invalid-id',
      ]
      const result = validateIds(ids)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('invalid-id')
      }
    })

    it('should handle empty array', () => {
      const ids: string[] = []
      const result = validateIds(ids)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual([])
      }
    })
  })
})
