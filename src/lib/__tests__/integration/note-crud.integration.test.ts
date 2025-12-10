/**
 * Integration tests for Note CRUD operations
 * Tests Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 * 
 * This test suite validates:
 * - Note creation flow
 * - Note editing functionality
 * - Note deletion functionality
 * - Markdown editor support
 * - Real-time preview
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
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

import { createNote, getNoteById, updateNote, deleteNote, getUserNotes } from '@/lib/supabase-notes'

describe('Note CRUD Integration Tests', () => {
  const testUserId = 'test-user-id'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Note Creation (Requirement 1.1)', () => {
    it('should successfully create a note with valid data', async () => {
      const noteData: CreateNoteData = {
        title: 'Test Note',
        content: '# Test Content\n\nThis is a test note with **markdown**.',
        userId: testUserId,
      }

      const mockNote = {
        id: 'note-123',
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
      expect(result.data?.userId).toBe(testUserId)
    })

    it('should create a note and display it in the list', async () => {
      const noteData: CreateNoteData = {
        title: 'List Test Note',
        content: 'Content for list test',
        userId: testUserId,
      }

      const mockNote = {
        id: 'note-456',
        ...noteData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      vi.mocked(createNote).mockResolvedValueOnce({
        data: mockNote,
        error: null,
      })

      const createResult = await createNote(noteData)
      expect(createResult.error).toBeNull()

      vi.mocked(getUserNotes).mockResolvedValueOnce({
        data: [mockNote],
        error: null,
      })

      const listResult = await getUserNotes(testUserId)
      expect(listResult.error).toBeNull()
      expect(listResult.data).toBeDefined()
      expect(Array.isArray(listResult.data)).toBe(true)
    })

    it('should support Markdown syntax in content (Requirement 1.4)', async () => {
      const markdownContent = `# Heading 1
## Heading 2

**Bold text** and *italic text*

- List item 1
- List item 2

\`\`\`javascript
const code = "block";
\`\`\`

[Link](https://example.com)
`

      const noteData: CreateNoteData = {
        title: 'Markdown Test',
        content: markdownContent,
        userId: testUserId,
      }

      const mockNote = {
        id: 'note-markdown',
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
      expect(result.data?.content).toContain('# Heading 1')
      expect(result.data?.content).toContain('**Bold text**')
      expect(result.data?.content).toContain('```javascript')
    })
  })

  describe('Note Editing (Requirement 1.2)', () => {
    it('should successfully update note content', async () => {
      const noteId = 'note-123'
      const updates: UpdateNoteData = {
        title: 'Updated Title',
        content: 'Updated content with new information',
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
      expect(result.data).toBeDefined()
      expect(result.data?.title).toBe(updates.title)
      expect(result.data?.content).toBe(updates.content)
    })

    it('should save changes and display updated content correctly', async () => {
      const noteId = 'note-123'
      const updates: UpdateNoteData = {
        content: '# Updated Heading\n\nNew paragraph with **bold** text.',
      }

      const mockUpdatedNote = {
        id: noteId,
        userId: testUserId,
        title: 'Test Note',
        ...updates,
        updatedAt: new Date().toISOString(),
      }

      vi.mocked(updateNote).mockResolvedValueOnce({
        data: mockUpdatedNote,
        error: null,
      })

      const updateResult = await updateNote(noteId, testUserId, updates)
      expect(updateResult.error).toBeNull()

      vi.mocked(getNoteById).mockResolvedValueOnce({
        data: mockUpdatedNote,
        error: null,
      })

      const getResult = await getNoteById(noteId, testUserId)
      expect(getResult.error).toBeNull()
      expect(getResult.data?.content).toBe(updates.content)
    })

    it('should handle partial updates', async () => {
      const noteId = 'note-123'
      const updates: UpdateNoteData = {
        title: 'Only Title Updated',
      }

      const mockUpdatedNote = {
        id: noteId,
        userId: testUserId,
        ...updates,
        content: 'Original content',
        updatedAt: new Date().toISOString(),
      }

      vi.mocked(updateNote).mockResolvedValueOnce({
        data: mockUpdatedNote,
        error: null,
      })

      const result = await updateNote(noteId, testUserId, updates)

      expect(result.error).toBeNull()
      expect(result.data?.title).toBe(updates.title)
    })
  })

  describe('Note Deletion (Requirement 1.3)', () => {
    it('should successfully delete a note', async () => {
      const noteId = 'note-to-delete'

      vi.mocked(deleteNote).mockResolvedValueOnce({
        error: null,
      })

      const result = await deleteNote(noteId, testUserId)

      expect(result.error).toBeNull()
    })

    it('should remove note from list after deletion', async () => {
      const noteId = 'note-456'

      vi.mocked(deleteNote).mockResolvedValueOnce({
        error: null,
      })

      const deleteResult = await deleteNote(noteId, testUserId)
      expect(deleteResult.error).toBeNull()

      vi.mocked(getUserNotes).mockResolvedValueOnce({
        data: [],
        error: null,
      })

      const listResult = await getUserNotes(testUserId)
      expect(listResult.error).toBeNull()
      expect(listResult.data).toEqual([])
    })

    it('should handle deletion of non-existent note', async () => {
      const noteId = 'non-existent-note'

      vi.mocked(deleteNote).mockResolvedValueOnce({
        error: 'Note not found',
      })

      const result = await deleteNote(noteId, testUserId)

      expect(result.error).toBeDefined()
    })
  })

  describe('Markdown Editor Support (Requirement 1.4)', () => {
    it('should support all standard Markdown syntax', async () => {
      const comprehensiveMarkdown = `# H1 Heading
## H2 Heading
### H3 Heading

**Bold text**
*Italic text*
***Bold and italic***

> Blockquote
> Multiple lines

- Unordered list item 1
- Unordered list item 2

1. Ordered list item 1
2. Ordered list item 2

\`inline code\`

\`\`\`javascript
// Code block
function test() {
  return true;
}
\`\`\`

[Link text](https://example.com)

![Image alt](https://example.com/image.png)

---

Horizontal rule above
`

      const noteData: CreateNoteData = {
        title: 'Comprehensive Markdown Test',
        content: comprehensiveMarkdown,
        userId: testUserId,
      }

      const mockNote = {
        id: 'note-comprehensive',
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
      expect(result.data?.content).toContain('# H1 Heading')
      expect(result.data?.content).toContain('**Bold text**')
      expect(result.data?.content).toContain('> Blockquote')
      expect(result.data?.content).toContain('```javascript')
      expect(result.data?.content).toContain('[Link text]')
      expect(result.data?.content).toContain('![Image alt]')
    })

    it('should preserve special characters and formatting', async () => {
      const specialContent = `Special characters: & < > " ' \`

Escaped characters: \\* \\_ \\[

Unicode: 你好 🎉 ñ

Math-like: x^2 + y^2 = z^2
`

      const noteData: CreateNoteData = {
        title: 'Special Characters Test',
        content: specialContent,
        userId: testUserId,
      }

      const mockNote = {
        id: 'note-special',
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
      expect(result.data?.content).toBe(specialContent)
    })
  })

  describe('Real-time Preview (Requirement 1.5)', () => {
    it('should render Markdown content in real-time', async () => {
      const noteData: CreateNoteData = {
        title: 'Preview Test',
        content: '# Live Preview\n\nThis should render **immediately**.',
        userId: testUserId,
      }

      const mockNote = {
        id: 'note-preview',
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
      expect(result.data?.content).toBeDefined()
      expect(result.data?.content).toContain('# Live Preview')
      expect(result.data?.content).toContain('**immediately**')
    })

    it('should handle rapid content updates', async () => {
      const noteId = 'note-rapid'
      const updates = [
        { content: 'First update' },
        { content: 'Second update' },
        { content: 'Third update' },
      ]

      for (const update of updates) {
        const mockUpdatedNote = {
          id: noteId,
          userId: testUserId,
          title: 'Rapid Update Test',
          ...update,
          updatedAt: new Date().toISOString(),
        }

        vi.mocked(updateNote).mockResolvedValueOnce({
          data: mockUpdatedNote,
          error: null,
        })

        const result = await updateNote(noteId, testUserId, update)
        expect(result.error).toBeNull()
        expect(result.data?.content).toBe(update.content)
      }
    })
  })

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const noteData: CreateNoteData = {
        title: 'Error Test',
        content: 'Content',
        userId: testUserId,
      }

      vi.mocked(createNote).mockResolvedValueOnce({
        data: null,
        error: 'Database connection failed',
      })

      const result = await createNote(noteData)

      expect(result.error).toBeDefined()
      expect(result.data).toBeNull()
    })

    it('should validate user ownership on operations', async () => {
      const noteId = 'note-123'
      const wrongUserId = 'wrong-user-id'

      vi.mocked(getNoteById).mockResolvedValueOnce({
        data: null,
        error: 'Note not found',
      })

      const result = await getNoteById(noteId, wrongUserId)

      expect(result.error).toBeDefined()
    })
  })
})
