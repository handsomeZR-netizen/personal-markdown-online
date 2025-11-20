import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getNote, deleteNote, getNotes } from '../notes'
import { mockPrisma, resetPrismaMocks, mockUser, mockNote, mockTag, mockCategory } from '@/test/prisma-mock'

// Mock dependencies - use factory function to avoid hoisting issues
vi.mock('@/lib/prisma', async () => {
  const { mockPrisma } = await import('@/test/prisma-mock')
  return {
    prisma: mockPrisma,
  }
})

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('./ai', () => ({
  summarizeNote: vi.fn().mockResolvedValue({ success: true, data: '测试摘要' }),
  generateEmbedding: vi.fn().mockResolvedValue([0.1, 0.2, 0.3]),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

describe('Notes Integration Tests', () => {
  beforeEach(() => {
    resetPrismaMocks()
    vi.clearAllMocks()
  })

  describe('getNote', () => {
    it('should return note for authenticated user', async () => {
      const { auth } = await import('@/auth')
      vi.mocked(auth).mockResolvedValue({
        user: { id: mockUser.id, email: mockUser.email },
      } as any)

      const noteWithRelations = {
        ...mockNote,
        tags: [mockTag],
        category: mockCategory,
      }

      mockPrisma.note.findUnique = vi.fn().mockResolvedValue(noteWithRelations)

      const result = await getNote(mockNote.id)

      expect(result).toBeDefined()
      expect(result?.id).toBe(mockNote.id)
      expect(result?.title).toBe(mockNote.title)
      expect(mockPrisma.note.findUnique).toHaveBeenCalledWith({
        where: {
          id: mockNote.id,
          userId: mockUser.id,
        },
        select: expect.any(Object),
      })
    })

    it('should return null for unauthenticated user', async () => {
      const { auth } = await import('@/auth')
      vi.mocked(auth).mockResolvedValue(null as any)

      const result = await getNote(mockNote.id)

      expect(result).toBeNull()
      expect(mockPrisma.note.findUnique).not.toHaveBeenCalled()
    })

    it('should return null for invalid note ID', async () => {
      const { auth } = await import('@/auth')
      vi.mocked(auth).mockResolvedValue({
        user: { id: mockUser.id, email: mockUser.email },
      } as any)

      const result = await getNote('invalid-id')

      expect(result).toBeNull()
      expect(mockPrisma.note.findUnique).not.toHaveBeenCalled()
    })

    it('should return null when note not found', async () => {
      const { auth } = await import('@/auth')
      vi.mocked(auth).mockResolvedValue({
        user: { id: mockUser.id, email: mockUser.email },
      } as any)

      mockPrisma.note.findUnique = vi.fn().mockResolvedValue(null)

      const result = await getNote(mockNote.id)

      expect(result).toBeNull()
    })
  })

  describe('deleteNote', () => {
    it('should successfully delete note owned by user', async () => {
      const { auth } = await import('@/auth')
      vi.mocked(auth).mockResolvedValue({
        user: { id: mockUser.id, email: mockUser.email },
      } as any)

      mockPrisma.note.findUnique = vi.fn().mockResolvedValue(mockNote)
      mockPrisma.note.delete = vi.fn().mockResolvedValue(mockNote)

      const result = await deleteNote(mockNote.id)

      expect(result.success).toBe(true)
      expect(mockPrisma.note.delete).toHaveBeenCalledWith({
        where: {
          id: mockNote.id,
          userId: mockUser.id,
        },
      })
    })

    it('should reject deletion for unauthenticated user', async () => {
      const { auth } = await import('@/auth')
      vi.mocked(auth).mockResolvedValue(null as any)

      const result = await deleteNote(mockNote.id)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('未授权')
      }
      expect(mockPrisma.note.delete).not.toHaveBeenCalled()
    })

    it('should reject deletion of non-existent note', async () => {
      const { auth } = await import('@/auth')
      vi.mocked(auth).mockResolvedValue({
        user: { id: mockUser.id, email: mockUser.email },
      } as any)

      mockPrisma.note.findUnique = vi.fn().mockResolvedValue(null)

      const result = await deleteNote(mockNote.id)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('不存在')
      }
      expect(mockPrisma.note.delete).not.toHaveBeenCalled()
    })

    it('should reject deletion with invalid note ID', async () => {
      const { auth } = await import('@/auth')
      vi.mocked(auth).mockResolvedValue({
        user: { id: mockUser.id, email: mockUser.email },
      } as any)

      const result = await deleteNote('invalid-id')

      expect(result.success).toBe(false)
      expect(mockPrisma.note.delete).not.toHaveBeenCalled()
    })
  })

  describe('getNotes', () => {
    it('should return paginated notes for authenticated user', async () => {
      const { auth } = await import('@/auth')
      vi.mocked(auth).mockResolvedValue({
        user: { id: mockUser.id, email: mockUser.email },
      } as any)

      const notesWithRelations = [
        {
          ...mockNote,
          tags: [mockTag],
          category: mockCategory,
        },
      ]

      mockPrisma.note.findMany = vi.fn().mockResolvedValue(notesWithRelations)
      mockPrisma.note.count = vi.fn().mockResolvedValue(1)

      const result = await getNotes({
        page: 1,
        pageSize: 20,
      })

      expect(result.notes).toHaveLength(1)
      expect(result.totalCount).toBe(1)
      expect(result.totalPages).toBe(1)
      expect(result.currentPage).toBe(1)
      expect(mockPrisma.note.findMany).toHaveBeenCalled()
      expect(mockPrisma.note.count).toHaveBeenCalled()
    })

    it('should return empty array for unauthenticated user', async () => {
      const { auth } = await import('@/auth')
      vi.mocked(auth).mockResolvedValue(null as any)

      const result = await getNotes({})

      expect(result.notes).toHaveLength(0)
      expect(result.totalCount).toBe(0)
      expect(mockPrisma.note.findMany).not.toHaveBeenCalled()
    })

    it('should filter notes by search query', async () => {
      const { auth } = await import('@/auth')
      vi.mocked(auth).mockResolvedValue({
        user: { id: mockUser.id, email: mockUser.email },
      } as any)

      mockPrisma.note.findMany = vi.fn().mockResolvedValue([])
      mockPrisma.note.count = vi.fn().mockResolvedValue(0)

      await getNotes({
        query: '搜索关键词',
      })

      expect(mockPrisma.note.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { title: { contains: '搜索关键词' } },
              { content: { contains: '搜索关键词' } },
            ]),
          }),
        })
      )
    })

    it('should filter notes by category', async () => {
      const { auth } = await import('@/auth')
      vi.mocked(auth).mockResolvedValue({
        user: { id: mockUser.id, email: mockUser.email },
      } as any)

      mockPrisma.note.findMany = vi.fn().mockResolvedValue([])
      mockPrisma.note.count = vi.fn().mockResolvedValue(0)

      await getNotes({
        categoryId: mockCategory.id,
      })

      expect(mockPrisma.note.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            categoryId: mockCategory.id,
          }),
        })
      )
    })

    it('should filter notes by tags', async () => {
      const { auth } = await import('@/auth')
      vi.mocked(auth).mockResolvedValue({
        user: { id: mockUser.id, email: mockUser.email },
      } as any)

      mockPrisma.note.findMany = vi.fn().mockResolvedValue([])
      mockPrisma.note.count = vi.fn().mockResolvedValue(0)

      await getNotes({
        tagIds: [mockTag.id],
      })

      expect(mockPrisma.note.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tags: {
              some: {
                id: {
                  in: [mockTag.id],
                },
              },
            },
          }),
        })
      )
    })

    it('should handle pagination correctly', async () => {
      const { auth } = await import('@/auth')
      vi.mocked(auth).mockResolvedValue({
        user: { id: mockUser.id, email: mockUser.email },
      } as any)

      mockPrisma.note.findMany = vi.fn().mockResolvedValue([])
      mockPrisma.note.count = vi.fn().mockResolvedValue(50)

      const result = await getNotes({
        page: 2,
        pageSize: 20,
      })

      expect(result.totalPages).toBe(3)
      expect(result.currentPage).toBe(2)
      expect(mockPrisma.note.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 20,
        })
      )
    })
  })
})
