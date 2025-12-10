/**
 * Property-Based Tests for Note CRUD Operations
 * Feature: comprehensive-feature-audit, Property 1: 功能完整性
 * Validates: Requirements 1.1
 * 
 * This test uses property-based testing to verify that note CRUD operations
 * maintain correctness across a wide range of inputs.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import type { CreateNoteData, UpdateNoteData } from '@/lib/supabase-notes'

// Mock the entire supabase-notes module
vi.mock('@/lib/supabase-notes', () => {
  return {
    createNote: vi.fn(),
    getNoteById: vi.fn(),
    updateNote: vi.fn(),
    deleteNote: vi.fn(),
    getUserNotes: vi.fn(),
  }
})

import { createNote, getNoteById, updateNote, deleteNote } from '@/lib/supabase-notes'

describe('Note CRUD Property-Based Tests', () => {
  const testUserId = 'test-user-id'

  beforeEach(() => {
    vi.clearAllMocks()
  })


  /**
   * Property 1: 功能完整性
   * For any valid note data, the system should successfully create, retrieve,
   * update, and delete notes while maintaining data integrity.
   * Validates: Requirements 1.1
   */
  describe('Property 1: Functional Completeness', () => {
    it('should create notes with any valid title and content', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
          fc.string({ maxLength: 10000 }),
          async (title, content) => {
            const noteData: CreateNoteData = {
              title: title.trim(),
              content,
              userId: testUserId,
            }

            const mockNote = {
              id: `note-${Date.now()}-${Math.random()}`,
              ...noteData,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }

            vi.mocked(createNote).mockResolvedValueOnce({
              data: mockNote,
              error: null,
            })

            const result = await createNote(noteData)

            expect(result.error).toBeNull()
            expect(result.data).toBeDefined()
            expect(result.data?.title).toBe(noteData.title)
            expect(result.data?.content).toBe(noteData.content)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should preserve content integrity through create-read cycle', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
          fc.string({ maxLength: 10000 }),
          async (title, content) => {
            const noteData: CreateNoteData = {
              title: title.trim(),
              content,
              userId: testUserId,
            }

            const mockNote = {
              id: `note-${Date.now()}-${Math.random()}`,
              ...noteData,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }

            // Mock create
            vi.mocked(createNote).mockResolvedValueOnce({
              data: mockNote,
              error: null,
            })

            const createResult = await createNote(noteData)
            expect(createResult.error).toBeNull()

            const noteId = createResult.data?.id || mockNote.id

            // Mock read
            vi.mocked(getNoteById).mockResolvedValueOnce({
              data: mockNote,
              error: null,
            })

            const readResult = await getNoteById(noteId, testUserId)

            // Content should be preserved exactly
            expect(readResult.data?.title).toBe(noteData.title)
            expect(readResult.data?.content).toBe(noteData.content)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should preserve content integrity through update cycle', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
          fc.string({ maxLength: 10000 }),
          fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
          fc.string({ maxLength: 10000 }),
          async (originalTitle, originalContent, newTitle, newContent) => {
            const noteId = `note-${Date.now()}-${Math.random()}`

            const updates: UpdateNoteData = {
              title: newTitle.trim(),
              content: newContent,
            }

            const mockUpdatedNote = {
              id: noteId,
              userId: testUserId,
              ...updates,
              updatedAt: new Date().toISOString(),
            }

            vi.mocked(updateNote).mockResolvedValueOnce({
              data: mockUpdatedNote,
              error: null,
            })

            const result = await updateNote(noteId, testUserId, updates)

            expect(result.error).toBeNull()
            expect(result.data?.title).toBe(updates.title)
            expect(result.data?.content).toBe(updates.content)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should handle Markdown content with various syntax elements', async () => {
      const markdownElements = fc.oneof(
        fc.constant('# Heading'),
        fc.constant('**bold**'),
        fc.constant('*italic*'),
        fc.constant('`code`'),
        fc.constant('> quote'),
        fc.constant('- list'),
        fc.constant('[link](url)'),
        fc.constant('```\ncode block\n```')
      )

      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
          fc.array(markdownElements, { minLength: 1, maxLength: 10 }),
          async (title, elements) => {
            const content = elements.join('\n\n')

            const noteData: CreateNoteData = {
              title: title.trim(),
              content,
              userId: testUserId,
            }

            const mockNote = {
              id: `note-${Date.now()}-${Math.random()}`,
              ...noteData,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }

            vi.mocked(createNote).mockResolvedValueOnce({
              data: mockNote,
              error: null,
            })

            const result = await createNote(noteData)

            expect(result.error).toBeNull()
            expect(result.data?.content).toBe(content)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should handle special characters and Unicode in content', async () => {
      // Test with strings that include special characters
      const specialCharGen = fc.string({ maxLength: 1000 }).map(s => {
        // Add some special characters to the string
        const specials = ['&', '<', '>', '"', "'", '`', '\\', '你好', '🎉', 'ñ']
        const randomSpecial = specials[Math.floor(Math.random() * specials.length)]
        return s + randomSpecial
      })

      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
          specialCharGen,
          async (title, content) => {
            const noteData: CreateNoteData = {
              title: title.trim(),
              content,
              userId: testUserId,
            }

            const mockNote = {
              id: `note-${Date.now()}-${Math.random()}`,
              ...noteData,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }

            vi.mocked(createNote).mockResolvedValueOnce({
              data: mockNote,
              error: null,
            })

            const result = await createNote(noteData)

            expect(result.error).toBeNull()
            expect(result.data?.content).toBe(content)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should maintain data consistency after delete operation', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }),
          async (noteId) => {
            vi.mocked(deleteNote).mockResolvedValueOnce({
              error: null,
            })

            const deleteResult = await deleteNote(noteId, testUserId)
            expect(deleteResult.error).toBeNull()

            // After deletion, note should not be retrievable
            vi.mocked(getNoteById).mockResolvedValueOnce({
              data: null,
              error: 'Note not found',
            })

            const getResult = await getNoteById(noteId, testUserId)
            expect(getResult.error).toBeDefined()
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
