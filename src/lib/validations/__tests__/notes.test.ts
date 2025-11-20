import { describe, it, expect } from 'vitest'
import {
  createNoteSchema,
  updateNoteSchema,
  deleteNoteSchema,
  getNotesSchema,
  searchNotesSchema,
} from '../notes'

describe('Note Validation Schemas', () => {
  describe('createNoteSchema', () => {
    it('should validate valid note data', () => {
      const validData = {
        title: '测试笔记',
        content: '这是测试内容',
        tagIds: ['c1234567890123456789abcde'],
        categoryId: 'c1234567890123456789abcde',
      }

      const result = createNoteSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject empty title', () => {
      const invalidData = {
        title: '',
        content: '内容',
      }

      const result = createNoteSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject title exceeding 200 characters', () => {
      const invalidData = {
        title: 'a'.repeat(201),
        content: '内容',
      }

      const result = createNoteSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should trim whitespace from title', () => {
      const data = {
        title: '  测试标题  ',
        content: '内容',
      }

      const result = createNoteSchema.safeParse(data)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.title).toBe('测试标题')
      }
    })

    it('should accept note without tags and category', () => {
      const validData = {
        title: '测试笔记',
        content: '内容',
      }

      const result = createNoteSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe('updateNoteSchema', () => {
    it('should validate valid update data', () => {
      const validData = {
        id: 'c1234567890123456789abcde',
        title: '更新的标题',
        content: '更新的内容',
      }

      const result = updateNoteSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should allow partial updates', () => {
      const validData = {
        id: 'c1234567890123456789abcde',
        title: '只更新标题',
      }

      const result = updateNoteSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should allow setting categoryId to null', () => {
      const validData = {
        id: 'c1234567890123456789abcde',
        categoryId: null,
      }

      const result = updateNoteSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe('deleteNoteSchema', () => {
    it('should validate valid note ID', () => {
      const validData = {
        id: 'c1234567890123456789abcde',
      }

      const result = deleteNoteSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe('getNotesSchema', () => {
    it('should validate with default values', () => {
      const result = getNotesSchema.safeParse({})
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(1)
        expect(result.data.pageSize).toBe(20)
        expect(result.data.sortBy).toBe('createdAt')
        expect(result.data.sortOrder).toBe('desc')
      }
    })

    it('should validate custom pagination', () => {
      const data = {
        page: 2,
        pageSize: 50,
      }

      const result = getNotesSchema.safeParse(data)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(2)
        expect(result.data.pageSize).toBe(50)
      }
    })

    it('should reject invalid page number', () => {
      const data = {
        page: 0,
      }

      const result = getNotesSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should reject pageSize exceeding 100', () => {
      const data = {
        pageSize: 101,
      }

      const result = getNotesSchema.safeParse(data)
      expect(result.success).toBe(false)
    })
  })

  describe('searchNotesSchema', () => {
    it('should validate valid search query', () => {
      const validData = {
        query: '搜索关键词',
      }

      const result = searchNotesSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject empty query', () => {
      const invalidData = {
        query: '',
      }

      const result = searchNotesSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject query exceeding 200 characters', () => {
      const invalidData = {
        query: 'a'.repeat(201),
      }

      const result = searchNotesSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })
})
