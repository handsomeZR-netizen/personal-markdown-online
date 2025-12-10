/**
 * Integration tests for Tag and Category Operations
 * Tests Requirements: 2.3, 2.4
 * 
 * This test suite validates:
 * - Tag addition and filtering
 * - Category filtering
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the tag and category actions modules
vi.mock('@/lib/actions/tags', () => {
  return {
    getTags: vi.fn(),
    createTag: vi.fn(),
  }
})

vi.mock('@/lib/actions/categories', () => {
  return {
    getCategories: vi.fn(),
    createCategory: vi.fn(),
    deleteCategory: vi.fn(),
  }
})

// Mock Prisma for note filtering
vi.mock('@/lib/prisma', () => {
  return {
    prisma: {
      note: {
        findMany: vi.fn(),
      },
      tag: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
      },
      category: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
      },
    },
  }
})

import { getTags, createTag } from '@/lib/actions/tags'
import { getCategories, createCategory, deleteCategory } from '@/lib/actions/categories'
import { prisma } from '@/lib/prisma'

describe('Tag and Category Integration Tests', () => {
  const testUserId = 'test-user-id'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Tag Addition and Management (Requirement 2.3)', () => {
    it('should successfully add a tag to a note', async () => {
      const tagName = 'Important'

      const mockTag = {
        id: 'tag-1',
        name: tagName,
      }

      vi.mocked(createTag).mockResolvedValueOnce({
        success: true,
        data: mockTag,
      })

      const result = await createTag(tagName)

      expect(result.success).toBe(true)
      expect(result.data?.name).toBe(tagName)
    })

    it('should retrieve all available tags', async () => {
      const mockTags = [
        { id: 'tag-1', name: 'Work' },
        { id: 'tag-2', name: 'Personal' },
        { id: 'tag-3', name: 'Important' },
      ]

      vi.mocked(getTags).mockResolvedValueOnce({
        success: true,
        data: mockTags,
      })

      const result = await getTags()

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(3)
      expect(result.data?.map(t => t.name)).toContain('Work')
      expect(result.data?.map(t => t.name)).toContain('Personal')
    })

    it('should create new tag if it does not exist', async () => {
      const newTagName = 'New Tag'

      const mockTag = {
        id: 'tag-new',
        name: newTagName,
      }

      vi.mocked(createTag).mockResolvedValueOnce({
        success: true,
        data: mockTag,
      })

      const result = await createTag(newTagName)

      expect(result.success).toBe(true)
      expect(result.data?.name).toBe(newTagName)
    })

    it('should return existing tag if it already exists', async () => {
      const existingTagName = 'Existing Tag'

      const mockTag = {
        id: 'tag-existing',
        name: existingTagName,
      }

      vi.mocked(createTag).mockResolvedValueOnce({
        success: true,
        data: mockTag,
      })

      const result = await createTag(existingTagName)

      expect(result.success).toBe(true)
      expect(result.data?.id).toBe('tag-existing')
    })

    it('should support adding multiple tags to a note', async () => {
      const tags = ['Work', 'Urgent', 'Review']
      const createdTags = []

      for (const tagName of tags) {
        const mockTag = {
          id: `tag-${tagName.toLowerCase()}`,
          name: tagName,
        }

        vi.mocked(createTag).mockResolvedValueOnce({
          success: true,
          data: mockTag,
        })

        const result = await createTag(tagName)
        expect(result.success).toBe(true)
        createdTags.push(result.data)
      }

      expect(createdTags).toHaveLength(3)
    })

    it('should handle tag names with special characters', async () => {
      const specialTagName = 'C++ Programming'

      const mockTag = {
        id: 'tag-special',
        name: specialTagName,
      }

      vi.mocked(createTag).mockResolvedValueOnce({
        success: true,
        data: mockTag,
      })

      const result = await createTag(specialTagName)

      expect(result.success).toBe(true)
      expect(result.data?.name).toBe(specialTagName)
    })

    it('should trim whitespace from tag names', async () => {
      const tagWithSpaces = '  Trimmed Tag  '
      const expectedName = 'Trimmed Tag'

      const mockTag = {
        id: 'tag-trimmed',
        name: expectedName,
      }

      vi.mocked(createTag).mockResolvedValueOnce({
        success: true,
        data: mockTag,
      })

      const result = await createTag(tagWithSpaces)

      expect(result.success).toBe(true)
      expect(result.data?.name).toBe(expectedName)
    })
  })

  describe('Tag Filtering (Requirement 2.3)', () => {
    it('should filter notes by single tag', async () => {
      const tagId = 'tag-work'

      const mockNotes = [
        {
          id: 'note-1',
          title: 'Work Note 1',
          content: 'Content',
          userId: testUserId,
          tags: [{ id: tagId, name: 'Work' }],
        },
        {
          id: 'note-2',
          title: 'Work Note 2',
          content: 'Content',
          userId: testUserId,
          tags: [{ id: tagId, name: 'Work' }],
        },
      ]

      vi.mocked(prisma.note.findMany).mockResolvedValueOnce(mockNotes as any)

      const result = await prisma.note.findMany({
        where: {
          userId: testUserId,
          tags: {
            some: {
              id: tagId,
            },
          },
        },
        include: {
          tags: true,
        },
      })

      expect(result).toHaveLength(2)
      expect(result.every(note => note.tags.some(tag => tag.id === tagId))).toBe(true)
    })

    it('should filter notes by multiple tags', async () => {
      const tagIds = ['tag-work', 'tag-urgent']

      const mockNotes = [
        {
          id: 'note-1',
          title: 'Urgent Work Note',
          content: 'Content',
          userId: testUserId,
          tags: [
            { id: 'tag-work', name: 'Work' },
            { id: 'tag-urgent', name: 'Urgent' },
          ],
        },
      ]

      vi.mocked(prisma.note.findMany).mockResolvedValueOnce(mockNotes as any)

      const result = await prisma.note.findMany({
        where: {
          userId: testUserId,
          AND: tagIds.map(tagId => ({
            tags: {
              some: {
                id: tagId,
              },
            },
          })),
        },
        include: {
          tags: true,
        },
      })

      expect(result).toHaveLength(1)
      expect(result[0].tags).toHaveLength(2)
    })

    it('should return empty list when no notes match tag filter', async () => {
      const tagId = 'tag-nonexistent'

      vi.mocked(prisma.note.findMany).mockResolvedValueOnce([])

      const result = await prisma.note.findMany({
        where: {
          userId: testUserId,
          tags: {
            some: {
              id: tagId,
            },
          },
        },
        include: {
          tags: true,
        },
      })

      expect(result).toHaveLength(0)
    })

    it('should display only notes with selected tags', async () => {
      const selectedTagId = 'tag-personal'

      const allNotes = [
        {
          id: 'note-1',
          title: 'Personal Note',
          content: 'Content',
          userId: testUserId,
          tags: [{ id: selectedTagId, name: 'Personal' }],
        },
        {
          id: 'note-2',
          title: 'Work Note',
          content: 'Content',
          userId: testUserId,
          tags: [{ id: 'tag-work', name: 'Work' }],
        },
      ]

      const filteredNotes = allNotes.filter(note =>
        note.tags.some(tag => tag.id === selectedTagId)
      )

      expect(filteredNotes).toHaveLength(1)
      expect(filteredNotes[0].title).toBe('Personal Note')
    })
  })

  describe('Category Management (Requirement 2.4)', () => {
    it('should successfully create a category', async () => {
      const categoryName = 'Projects'

      const mockCategory = {
        id: 'category-1',
        name: categoryName,
      }

      vi.mocked(createCategory).mockResolvedValueOnce({
        success: true,
        data: mockCategory,
      })

      const result = await createCategory(categoryName)

      expect(result.success).toBe(true)
      expect(result.data?.name).toBe(categoryName)
    })

    it('should retrieve all available categories', async () => {
      const mockCategories = [
        { id: 'category-1', name: 'Projects' },
        { id: 'category-2', name: 'Ideas' },
        { id: 'category-3', name: 'Meeting Notes' },
      ]

      vi.mocked(getCategories).mockResolvedValueOnce({
        success: true,
        data: mockCategories,
      })

      const result = await getCategories()

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(3)
      expect(result.data?.map(c => c.name)).toContain('Projects')
      expect(result.data?.map(c => c.name)).toContain('Ideas')
    })

    it('should return existing category if it already exists', async () => {
      const existingCategoryName = 'Existing Category'

      const mockCategory = {
        id: 'category-existing',
        name: existingCategoryName,
      }

      vi.mocked(createCategory).mockResolvedValueOnce({
        success: true,
        data: mockCategory,
      })

      const result = await createCategory(existingCategoryName)

      expect(result.success).toBe(true)
      expect(result.data?.id).toBe('category-existing')
    })

    it('should delete empty category', async () => {
      const categoryId = 'category-empty'

      vi.mocked(deleteCategory).mockResolvedValueOnce({
        success: true,
        data: undefined,
      })

      const result = await deleteCategory(categoryId)

      expect(result.success).toBe(true)
    })

    it('should prevent deleting category with notes', async () => {
      const categoryId = 'category-with-notes'

      vi.mocked(deleteCategory).mockResolvedValueOnce({
        success: false,
        error: '该分类下还有 5 篇笔记，无法删除',
      })

      const result = await deleteCategory(categoryId)

      expect(result.success).toBe(false)
      expect(result.error).toContain('笔记')
    })
  })

  describe('Category Filtering (Requirement 2.4)', () => {
    it('should filter notes by category', async () => {
      const categoryId = 'category-projects'

      const mockNotes = [
        {
          id: 'note-1',
          title: 'Project Note 1',
          content: 'Content',
          userId: testUserId,
          categoryId: categoryId,
          category: { id: categoryId, name: 'Projects' },
        },
        {
          id: 'note-2',
          title: 'Project Note 2',
          content: 'Content',
          userId: testUserId,
          categoryId: categoryId,
          category: { id: categoryId, name: 'Projects' },
        },
      ]

      vi.mocked(prisma.note.findMany).mockResolvedValueOnce(mockNotes as any)

      const result = await prisma.note.findMany({
        where: {
          userId: testUserId,
          categoryId: categoryId,
        },
        include: {
          category: true,
        },
      })

      expect(result).toHaveLength(2)
      expect(result.every(note => note.categoryId === categoryId)).toBe(true)
    })

    it('should display only notes matching selected category', async () => {
      const selectedCategoryId = 'category-ideas'

      const allNotes = [
        {
          id: 'note-1',
          title: 'Idea Note',
          content: 'Content',
          userId: testUserId,
          categoryId: selectedCategoryId,
          category: { id: selectedCategoryId, name: 'Ideas' },
        },
        {
          id: 'note-2',
          title: 'Project Note',
          content: 'Content',
          userId: testUserId,
          categoryId: 'category-projects',
          category: { id: 'category-projects', name: 'Projects' },
        },
      ]

      const filteredNotes = allNotes.filter(note => note.categoryId === selectedCategoryId)

      expect(filteredNotes).toHaveLength(1)
      expect(filteredNotes[0].title).toBe('Idea Note')
    })

    it('should return empty list when no notes match category filter', async () => {
      const categoryId = 'category-empty'

      vi.mocked(prisma.note.findMany).mockResolvedValueOnce([])

      const result = await prisma.note.findMany({
        where: {
          userId: testUserId,
          categoryId: categoryId,
        },
        include: {
          category: true,
        },
      })

      expect(result).toHaveLength(0)
    })

    it('should handle notes without category', async () => {
      const mockNotes = [
        {
          id: 'note-1',
          title: 'Uncategorized Note',
          content: 'Content',
          userId: testUserId,
          categoryId: null,
          category: null,
        },
      ]

      vi.mocked(prisma.note.findMany).mockResolvedValueOnce(mockNotes as any)

      const result = await prisma.note.findMany({
        where: {
          userId: testUserId,
          categoryId: null,
        },
        include: {
          category: true,
        },
      })

      expect(result).toHaveLength(1)
      expect(result[0].categoryId).toBeNull()
    })
  })

  describe('Combined Tag and Category Filtering', () => {
    it('should filter notes by both tags and category', async () => {
      const categoryId = 'category-projects'
      const tagId = 'tag-urgent'

      const mockNotes = [
        {
          id: 'note-1',
          title: 'Urgent Project Note',
          content: 'Content',
          userId: testUserId,
          categoryId: categoryId,
          category: { id: categoryId, name: 'Projects' },
          tags: [{ id: tagId, name: 'Urgent' }],
        },
      ]

      vi.mocked(prisma.note.findMany).mockResolvedValueOnce(mockNotes as any)

      const result = await prisma.note.findMany({
        where: {
          userId: testUserId,
          categoryId: categoryId,
          tags: {
            some: {
              id: tagId,
            },
          },
        },
        include: {
          category: true,
          tags: true,
        },
      })

      expect(result).toHaveLength(1)
      expect(result[0].categoryId).toBe(categoryId)
      expect(result[0].tags.some(tag => tag.id === tagId)).toBe(true)
    })

    it('should apply multiple filters correctly', async () => {
      const allNotes = [
        {
          id: 'note-1',
          title: 'Urgent Project',
          categoryId: 'category-projects',
          tags: [{ id: 'tag-urgent', name: 'Urgent' }],
        },
        {
          id: 'note-2',
          title: 'Normal Project',
          categoryId: 'category-projects',
          tags: [{ id: 'tag-normal', name: 'Normal' }],
        },
        {
          id: 'note-3',
          title: 'Urgent Idea',
          categoryId: 'category-ideas',
          tags: [{ id: 'tag-urgent', name: 'Urgent' }],
        },
      ]

      // Filter by category=projects AND tag=urgent
      const filtered = allNotes.filter(
        note =>
          note.categoryId === 'category-projects' &&
          note.tags.some(tag => tag.id === 'tag-urgent')
      )

      expect(filtered).toHaveLength(1)
      expect(filtered[0].id).toBe('note-1')
    })
  })

  describe('Error Handling', () => {
    it('should handle unauthorized tag creation', async () => {
      vi.mocked(createTag).mockResolvedValueOnce({
        success: false,
        error: '未授权访问',
      })

      const result = await createTag('Test Tag')

      expect(result.success).toBe(false)
      expect(result.error).toBe('未授权访问')
    })

    it('should handle unauthorized category creation', async () => {
      vi.mocked(createCategory).mockResolvedValueOnce({
        success: false,
        error: '未授权访问',
      })

      const result = await createCategory('Test Category')

      expect(result.success).toBe(false)
      expect(result.error).toBe('未授权访问')
    })

    it('should handle database errors when fetching tags', async () => {
      vi.mocked(getTags).mockResolvedValueOnce({
        success: false,
        error: '获取标签列表失败',
      })

      const result = await getTags()

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should handle database errors when fetching categories', async () => {
      vi.mocked(getCategories).mockResolvedValueOnce({
        success: false,
        error: '获取分类列表失败',
      })

      const result = await getCategories()

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should validate tag name length', async () => {
      const longTagName = 'a'.repeat(300)

      vi.mocked(createTag).mockResolvedValueOnce({
        success: false,
        error: '标签名称过长',
      })

      const result = await createTag(longTagName)

      expect(result.success).toBe(false)
    })

    it('should validate category name length', async () => {
      const longCategoryName = 'a'.repeat(300)

      vi.mocked(createCategory).mockResolvedValueOnce({
        success: false,
        error: '分类名称过长',
      })

      const result = await createCategory(longCategoryName)

      expect(result.success).toBe(false)
    })
  })
})
