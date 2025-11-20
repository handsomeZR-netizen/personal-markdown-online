import { vi } from 'vitest'
import { PrismaClient } from '@prisma/client'

// Mock Prisma Client
export const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  note: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  tag: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  category: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
} as unknown as PrismaClient

// Helper to reset all mocks
export function resetPrismaMocks() {
  Object.values(mockPrisma).forEach((model: any) => {
    Object.values(model).forEach((method: any) => {
      if (typeof method.mockReset === 'function') {
        method.mockReset()
      }
    })
  })
}

// Mock data generators
export const mockUser = {
  id: 'c1234567890123456789user1',
  email: 'test@example.com',
  name: '测试用户',
  password: '$2a$10$hashedpassword',
  emailVerified: null,
  image: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

export const mockNote = {
  id: 'c1234567890123456789note1',
  title: '测试笔记',
  content: '这是测试内容',
  summary: '测试摘要',
  embedding: null,
  userId: mockUser.id,
  categoryId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

export const mockTag = {
  id: 'c1234567890123456789tag01',
  name: '测试标签',
  createdAt: new Date(),
  updatedAt: new Date(),
}

export const mockCategory = {
  id: 'c1234567890123456789cat01',
  name: '测试分类',
  createdAt: new Date(),
  updatedAt: new Date(),
}
