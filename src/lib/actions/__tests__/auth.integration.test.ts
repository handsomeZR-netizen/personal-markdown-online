import { describe, it, expect, vi, beforeEach } from 'vitest'
import { registerUser, loginUser } from '../auth'
import { mockPrisma, resetPrismaMocks, mockUser } from '@/test/prisma-mock'
import bcrypt from 'bcryptjs'

// Mock dependencies - use factory function to avoid hoisting issues
vi.mock('@/lib/prisma', async () => {
  const { mockPrisma } = await import('@/test/prisma-mock')
  return {
    prisma: mockPrisma,
  }
})

vi.mock('@/auth', () => ({
  signIn: vi.fn(),
}))

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}))

describe('Auth Integration Tests', () => {
  beforeEach(() => {
    resetPrismaMocks()
    vi.clearAllMocks()
  })

  describe('registerUser', () => {
    it('should successfully register a new user', async () => {
      const userData = {
        name: '新用户',
        email: 'newuser@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
      }

      mockPrisma.user.findUnique = vi.fn().mockResolvedValue(null)
      mockPrisma.user.create = vi.fn().mockResolvedValue({
        ...mockUser,
        id: 'c1234567890123456789new01',
        email: userData.email,
        name: userData.name,
      })
      
      vi.mocked(bcrypt.hash).mockResolvedValue('$2a$10$hashedpassword' as never)

      const result = await registerUser(userData)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.userId).toBeDefined()
      }
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: userData.email },
      })
      expect(mockPrisma.user.create).toHaveBeenCalled()
    })

    it('should reject registration with existing email', async () => {
      const userData = {
        name: '新用户',
        email: 'existing@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
      }

      mockPrisma.user.findUnique = vi.fn().mockResolvedValue(mockUser)

      const result = await registerUser(userData)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('已被注册')
      }
      expect(mockPrisma.user.create).not.toHaveBeenCalled()
    })

    it('should reject registration with invalid data', async () => {
      const userData = {
        email: 'invalid-email',
        password: '123',
        confirmPassword: '123',
      }

      const result = await registerUser(userData)

      expect(result.success).toBe(false)
      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled()
    })

    it('should reject registration with mismatched passwords', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123',
        confirmPassword: 'Password456',
      }

      const result = await registerUser(userData)

      expect(result.success).toBe(false)
      expect(mockPrisma.user.create).not.toHaveBeenCalled()
    })
  })

  describe('loginUser', () => {
    it('should successfully login with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'Password123',
      }

      const { signIn } = await import('@/auth')
      vi.mocked(signIn).mockResolvedValue(undefined as never)

      const result = await loginUser(loginData)

      expect(result.success).toBe(true)
      expect(signIn).toHaveBeenCalledWith('credentials', {
        email: loginData.email,
        password: loginData.password,
        redirect: false,
      })
    })

    it('should reject login with invalid email format', async () => {
      const loginData = {
        email: 'invalid-email',
        password: 'Password123',
      }

      const result = await loginUser(loginData)

      expect(result.success).toBe(false)
    })

    it('should reject login with short password', async () => {
      const loginData = {
        email: 'test@example.com',
        password: '123',
      }

      const result = await loginUser(loginData)

      expect(result.success).toBe(false)
    })
  })
})
