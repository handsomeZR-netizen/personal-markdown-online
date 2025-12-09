/**
 * Property-Based Test: Template Content Independence
 * Feature: team-collaborative-knowledge-base, Property 18: Template Content Independence
 * 
 * Validates: Requirements 24.2, 24.3
 * 
 * Property: For any note created from a template, modifications to the template 
 * should not affect the created note, and vice versa.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as fc from 'fast-check'
import { prisma } from '@/lib/prisma'
import {
  createTemplate,
  updateTemplate,
  createNoteFromTemplate,
  type Template,
} from '../templates'

// Mock Next.js cache functions
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

// Mock auth
vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

describe('Property 18: Template Content Independence', () => {
  let testUserId: string
  let createdTemplateIds: string[] = []
  let createdNoteIds: string[] = []

  beforeEach(async () => {
    createdTemplateIds = []
    createdNoteIds = []
    
    // Create a test user
    const user = await prisma.user.create({
      data: {
        email: `test-${Date.now()}-${Math.random()}@example.com`,
        password: 'test-password',
        name: 'Test User',
      },
    })
    testUserId = user.id

    // Mock auth to return the test user
    const { auth } = await import('@/auth')
    vi.mocked(auth).mockResolvedValue({
      user: { id: testUserId, email: user.email, name: user.name },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    } as any)
  })

  afterEach(async () => {
    // Clean up test data
    try {
      await prisma.note.deleteMany({
        where: { id: { in: createdNoteIds } },
      })
    } catch (error) {
      // Ignore errors if notes were already deleted
    }

    try {
      await prisma.noteTemplate.deleteMany({
        where: { id: { in: createdTemplateIds } },
      })
    } catch (error) {
      // Ignore errors
    }
    
    try {
      await prisma.user.deleteMany({
        where: { id: testUserId },
      })
    } catch (error) {
      // Ignore errors
    }
  })

  it('modifying template does not affect notes created from it', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          templateName: fc.string({ minLength: 1, maxLength: 20 }),
          templateDescription: fc.string({ minLength: 0, maxLength: 50 }),
          originalContent: fc.string({ minLength: 10, maxLength: 100 }),
          modifiedContent: fc.string({ minLength: 10, maxLength: 100 }),
          noteTitle: fc.string({ minLength: 1, maxLength: 20 }),
        }),
        async ({ templateName, templateDescription, originalContent, modifiedContent, noteTitle }) => {
          // Create a template with original content
          const template = await createTemplate({
            name: templateName,
            description: templateDescription,
            content: originalContent,
          })
          createdTemplateIds.push(template.id)

          // Create a note from the template
          const noteResult = await createNoteFromTemplate(
            template.id,
            noteTitle
          )
          createdNoteIds.push(noteResult.id)

          // Get the created note
          const noteBeforeUpdate = await prisma.note.findUnique({
            where: { id: noteResult.id },
          })
          expect(noteBeforeUpdate).toBeDefined()
          expect(noteBeforeUpdate!.content).toBe(originalContent)

          // Modify the template
          await updateTemplate(template.id, {
            content: modifiedContent,
          })

          // Verify the note content remains unchanged
          const noteAfterUpdate = await prisma.note.findUnique({
            where: { id: noteResult.id },
          })
          expect(noteAfterUpdate).toBeDefined()
          expect(noteAfterUpdate!.content).toBe(originalContent)
          expect(noteAfterUpdate!.content).not.toBe(modifiedContent)

          // Verify the template was actually updated
          const updatedTemplate = await prisma.noteTemplate.findUnique({
            where: { id: template.id },
          })
          expect(updatedTemplate).toBeDefined()
          expect(updatedTemplate!.content).toBe(modifiedContent)
        }
      ),
      { numRuns: 2, timeout: 15000 }
    )
  }, 60000) // 60 second timeout

  it('modifying note does not affect the template it was created from', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          templateName: fc.string({ minLength: 1, maxLength: 20 }),
          templateContent: fc.string({ minLength: 10, maxLength: 100 }),
          noteTitle: fc.string({ minLength: 1, maxLength: 20 }),
          modifiedNoteContent: fc.string({ minLength: 10, maxLength: 100 }),
        }),
        async ({ templateName, templateContent, noteTitle, modifiedNoteContent }) => {
          // Create a template
          const template = await createTemplate({
            name: templateName,
            content: templateContent,
          })
          createdTemplateIds.push(template.id)

          // Create a note from the template
          const noteResult = await createNoteFromTemplate(
            template.id,
            noteTitle
          )
          createdNoteIds.push(noteResult.id)

          // Modify the note
          await prisma.note.update({
            where: { id: noteResult.id },
            data: { content: modifiedNoteContent },
          })

          // Verify the template content remains unchanged
          const templateAfterUpdate = await prisma.noteTemplate.findUnique({
            where: { id: template.id },
          })
          expect(templateAfterUpdate).toBeDefined()
          expect(templateAfterUpdate!.content).toBe(templateContent)
          expect(templateAfterUpdate!.content).not.toBe(modifiedNoteContent)

          // Verify the note was actually updated
          const updatedNote = await prisma.note.findUnique({
            where: { id: noteResult.id },
          })
          expect(updatedNote).toBeDefined()
          expect(updatedNote!.content).toBe(modifiedNoteContent)
        }
      ),
      { numRuns: 2, timeout: 15000 }
    )
  }, 60000) // 60 second timeout

  it('multiple notes from same template are independent', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          templateName: fc.string({ minLength: 1, maxLength: 20 }),
          templateContent: fc.string({ minLength: 10, maxLength: 100 }),
          noteTitles: fc.array(
            fc.string({ minLength: 1, maxLength: 20 }),
            { minLength: 2, maxLength: 3 }
          ),
          modifications: fc.array(
            fc.string({ minLength: 10, maxLength: 100 }),
            { minLength: 2, maxLength: 3 }
          ),
        }),
        async ({ templateName, templateContent, noteTitles, modifications }) => {
          // Create a template
          const template = await createTemplate({
            name: templateName,
            content: templateContent,
          })
          createdTemplateIds.push(template.id)

          // Create multiple notes from the template
          const noteIds: string[] = []
          for (const title of noteTitles) {
            const noteResult = await createNoteFromTemplate(
              template.id,
              title
            )
            noteIds.push(noteResult.id)
            createdNoteIds.push(noteResult.id)
          }

          // Verify all notes start with the same content
          for (const noteId of noteIds) {
            const note = await prisma.note.findUnique({
              where: { id: noteId },
            })
            expect(note).toBeDefined()
            expect(note!.content).toBe(templateContent)
          }

          // Modify each note with different content
          for (let i = 0; i < noteIds.length && i < modifications.length; i++) {
            await prisma.note.update({
              where: { id: noteIds[i] },
              data: { content: modifications[i] },
            })
          }

          // Verify each note has its own independent content
          for (let i = 0; i < noteIds.length && i < modifications.length; i++) {
            const note = await prisma.note.findUnique({
              where: { id: noteIds[i] },
            })
            expect(note).toBeDefined()
            expect(note!.content).toBe(modifications[i])

            // Verify it's different from other notes
            for (let j = 0; j < noteIds.length && j < modifications.length; j++) {
              if (i !== j && modifications[i] !== modifications[j]) {
                const otherNote = await prisma.note.findUnique({
                  where: { id: noteIds[j] },
                })
                expect(note!.content).not.toBe(otherNote!.content)
              }
            }
          }

          // Verify template remains unchanged
          const templateAfterUpdates = await prisma.noteTemplate.findUnique({
            where: { id: template.id },
          })
          expect(templateAfterUpdates).toBeDefined()
          expect(templateAfterUpdates!.content).toBe(templateContent)
        }
      ),
      { numRuns: 2 } // Fewer runs due to multiple database operations
    )
  }, 60000) // 60 second timeout

  it('deleting template does not affect notes created from it', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          templateName: fc.string({ minLength: 1, maxLength: 20 }),
          templateContent: fc.string({ minLength: 10, maxLength: 100 }),
          noteTitle: fc.string({ minLength: 1, maxLength: 20 }),
        }),
        async ({ templateName, templateContent, noteTitle }) => {
          // Create a template
          const template = await createTemplate({
            name: templateName,
            content: templateContent,
          })
          createdTemplateIds.push(template.id)

          // Create a note from the template
          const noteResult = await createNoteFromTemplate(
            template.id,
            noteTitle
          )
          createdNoteIds.push(noteResult.id)

          // Verify note was created with template content
          const noteBeforeDelete = await prisma.note.findUnique({
            where: { id: noteResult.id },
          })
          expect(noteBeforeDelete).toBeDefined()
          expect(noteBeforeDelete!.content).toBe(templateContent)

          // Delete the template
          await prisma.noteTemplate.delete({
            where: { id: template.id },
          })

          // Remove from cleanup list since it's already deleted
          createdTemplateIds = createdTemplateIds.filter(id => id !== template.id)

          // Verify the note still exists with the same content
          const noteAfterDelete = await prisma.note.findUnique({
            where: { id: noteResult.id },
          })
          expect(noteAfterDelete).toBeDefined()
          expect(noteAfterDelete!.content).toBe(templateContent)
          expect(noteAfterDelete!.title).toBe(noteTitle)
        }
      ),
      { numRuns: 2, timeout: 15000 }
    )
  }, 60000) // 60 second timeout

  it('template usage count increments correctly without affecting note content', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          templateName: fc.string({ minLength: 1, maxLength: 20 }),
          templateContent: fc.string({ minLength: 10, maxLength: 100 }),
          numNotes: fc.integer({ min: 1, max: 3 }),
        }),
        async ({ templateName, templateContent, numNotes }) => {
          // Create a template
          const template = await createTemplate({
            name: templateName,
            content: templateContent,
          })
          createdTemplateIds.push(template.id)

          // Verify initial usage count is 0
          const initialTemplate = await prisma.noteTemplate.findUnique({
            where: { id: template.id },
          })
          expect(initialTemplate).toBeDefined()
          expect(initialTemplate!.usageCount).toBe(0)

          // Create multiple notes from the template
          const noteIds: string[] = []
          for (let i = 0; i < numNotes; i++) {
            const noteResult = await createNoteFromTemplate(
              template.id,
              `Note ${i}`
            )
            noteIds.push(noteResult.id)
            createdNoteIds.push(noteResult.id)
          }

          // Verify usage count incremented correctly
          const updatedTemplate = await prisma.noteTemplate.findUnique({
            where: { id: template.id },
          })
          expect(updatedTemplate).toBeDefined()
          expect(updatedTemplate!.usageCount).toBe(numNotes)

          // Verify all notes have the correct content
          for (const noteId of noteIds) {
            const note = await prisma.note.findUnique({
              where: { id: noteId },
            })
            expect(note).toBeDefined()
            expect(note!.content).toBe(templateContent)
          }

          // Verify template content is unchanged
          expect(updatedTemplate!.content).toBe(templateContent)
        }
      ),
      { numRuns: 2 }
    )
  }, 30000) // 30 second timeout

  it('template content format is preserved when creating notes', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          templateName: fc.string({ minLength: 1, maxLength: 20 }),
          // Generate JSON-like content to simulate Tiptap format
          templateContent: fc.oneof(
            fc.string({ minLength: 10, maxLength: 100 }),
            fc.constant(JSON.stringify({
              type: 'doc',
              content: [
                { type: 'paragraph', content: [{ type: 'text', text: 'Test content' }] }
              ]
            }))
          ),
          noteTitle: fc.string({ minLength: 1, maxLength: 20 }),
        }),
        async ({ templateName, templateContent, noteTitle }) => {
          // Create a template
          const template = await createTemplate({
            name: templateName,
            content: templateContent,
          })
          createdTemplateIds.push(template.id)

          // Create a note from the template
          const noteResult = await createNoteFromTemplate(
            template.id,
            noteTitle
          )
          createdNoteIds.push(noteResult.id)

          // Verify note content is exactly the same as template content
          const note = await prisma.note.findUnique({
            where: { id: noteResult.id },
          })
          expect(note).toBeDefined()
          expect(note!.content).toBe(templateContent)

          // If content is JSON, verify it's still valid JSON
          if (templateContent.startsWith('{')) {
            expect(() => JSON.parse(note!.content)).not.toThrow()
            expect(() => JSON.parse(templateContent)).not.toThrow()
            
            const noteJson = JSON.parse(note!.content)
            const templateJson = JSON.parse(templateContent)
            expect(noteJson).toEqual(templateJson)
          }
        }
      ),
      { numRuns: 2, timeout: 15000 }
    )
  }, 60000) // 60 second timeout
})
