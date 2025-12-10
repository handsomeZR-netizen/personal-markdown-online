/**
 * Property-Based Test: Template Functionality Completeness
 * Feature: comprehensive-feature-audit, Property 1: 功能完整性
 * 
 * Validates: Requirements 11.1
 * 
 * Property: For any template operation (create, read, update, delete, use),
 * the system should handle it correctly and maintain data integrity.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as fc from 'fast-check'
import { prisma } from '@/lib/prisma'
import {
  getTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  createNoteFromTemplate,
  saveNoteAsTemplate,
} from '@/lib/actions/templates'

// Mock Next.js modules
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('@/auth', () => ({
  auth: vi.fn(() =>
    Promise.resolve({
      user: { id: 'test-user-id', email: 'test@example.com' },
    })
  ),
}))

describe('Property 1: Template Functionality Completeness', () => {
  let testUserId: string
  let createdTemplateIds: string[] = []
  let createdNoteIds: string[] = []

  beforeEach(async () => {
    testUserId = 'test-user-id'
    createdTemplateIds = []
    createdNoteIds = []

    // Ensure test user exists
    await prisma.user.upsert({
      where: { id: testUserId },
      update: {},
      create: {
        id: testUserId,
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashedpassword',
      },
    })
  })

  afterEach(async () => {
    // Clean up created notes
    if (createdNoteIds.length > 0) {
      try {
        await prisma.note.deleteMany({
          where: { id: { in: createdNoteIds } },
        })
      } catch (error) {
        console.error('Error cleaning up notes:', error)
      }
    }

    // Clean up created templates
    if (createdTemplateIds.length > 0) {
      try {
        await prisma.noteTemplate.deleteMany({
          where: { id: { in: createdTemplateIds } },
        })
      } catch (error) {
        console.error('Error cleaning up templates:', error)
      }
    }
  })

  it('creating and retrieving templates preserves all data', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }),
          description: fc.option(fc.string({ minLength: 0, maxLength: 200 }), { nil: undefined }),
          content: fc.string({ minLength: 1, maxLength: 500 }),
        }),
        async ({ name, description, content }) => {
          // Create template
          const created = await createTemplate({
            name,
            description,
            content,
          })
          createdTemplateIds.push(created.id)

          // Retrieve template
          const retrieved = await getTemplate(created.id)

          // Verify all data is preserved
          expect(retrieved).toBeDefined()
          expect(retrieved!.id).toBe(created.id)
          expect(retrieved!.name).toBe(name)
          expect(retrieved!.description).toBe(description ?? null)
          expect(retrieved!.content).toBe(content)
          expect(retrieved!.userId).toBe(testUserId)
          expect(retrieved!.usageCount).toBe(0)
        }
      ),
      { numRuns: 20 }
    )
  }, 60000)

  it('updating templates preserves unchanged fields', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          initialName: fc.string({ minLength: 1, maxLength: 50 }),
          initialContent: fc.string({ minLength: 1, maxLength: 500 }),
          updateName: fc.boolean(),
          newName: fc.string({ minLength: 1, maxLength: 50 }),
          updateContent: fc.boolean(),
          newContent: fc.string({ minLength: 1, maxLength: 500 }),
        }),
        async ({ initialName, initialContent, updateName, newName, updateContent, newContent }) => {
          // Create initial template
          const template = await createTemplate({
            name: initialName,
            content: initialContent,
          })
          createdTemplateIds.push(template.id)

          // Build update object
          const updates: any = {}
          if (updateName) updates.name = newName
          if (updateContent) updates.content = newContent

          // Update template
          const updated = await updateTemplate(template.id, updates)

          // Verify updates applied correctly
          expect(updated.name).toBe(updateName ? newName : initialName)
          expect(updated.content).toBe(updateContent ? newContent : initialContent)
          expect(updated.userId).toBe(testUserId)
        }
      ),
      { numRuns: 20 }
    )
  }, 60000)

  it('creating notes from templates copies content correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          templateName: fc.string({ minLength: 1, maxLength: 50 }),
          templateContent: fc.string({ minLength: 1, maxLength: 500 }),
          noteTitle: fc.string({ minLength: 1, maxLength: 100 }),
        }),
        async ({ templateName, templateContent, noteTitle }) => {
          // Create template
          const template = await createTemplate({
            name: templateName,
            content: templateContent,
          })
          createdTemplateIds.push(template.id)

          const initialUsageCount = template.usageCount

          // Create note from template
          const result = await createNoteFromTemplate(
            template.id,
            noteTitle
          )
          createdNoteIds.push(result.id)

          // Retrieve created note
          const note = await prisma.note.findUnique({
            where: { id: result.id },
          })

          // Verify note has template content
          expect(note).toBeDefined()
          expect(note!.title).toBe(noteTitle)
          expect(note!.content).toBe(templateContent)
          expect(note!.userId).toBe(testUserId)

          // Verify usage count incremented
          const updatedTemplate = await getTemplate(template.id)
          expect(updatedTemplate!.usageCount).toBe(initialUsageCount + 1)
        }
      ),
      { numRuns: 20 }
    )
  }, 60000)

  it('saving notes as templates creates independent copies', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          noteTitle: fc.string({ minLength: 1, maxLength: 100 }),
          noteContent: fc.string({ minLength: 1, maxLength: 500 }),
          templateName: fc.string({ minLength: 1, maxLength: 50 }),
          templateDescription: fc.option(fc.string({ minLength: 0, maxLength: 200 }), { nil: undefined }),
        }),
        async ({ noteTitle, noteContent, templateName, templateDescription }) => {
          // Create note
          const note = await prisma.note.create({
            data: {
              title: noteTitle,
              content: noteContent,
              userId: testUserId,
              ownerId: testUserId,
            },
          })
          createdNoteIds.push(note.id)

          // Save note as template
          const template = await saveNoteAsTemplate(
            note.id,
            templateName,
            templateDescription
          )
          createdTemplateIds.push(template.id)

          // Verify template has note content
          expect(template.name).toBe(templateName)
          expect(template.description).toBe(templateDescription ?? null)
          expect(template.content).toBe(noteContent)
          expect(template.userId).toBe(testUserId)

          // Modify note content
          const modifiedContent = noteContent + '\n\n## Additional Section'
          await prisma.note.update({
            where: { id: note.id },
            data: { content: modifiedContent },
          })

          // Verify template content unchanged
          const unchangedTemplate = await getTemplate(template.id)
          expect(unchangedTemplate!.content).toBe(noteContent)
          expect(unchangedTemplate!.content).not.toBe(modifiedContent)
        }
      ),
      { numRuns: 15 }
    )
  }, 60000)

  it('deleting templates does not affect notes created from them', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          templateName: fc.string({ minLength: 1, maxLength: 50 }),
          templateContent: fc.string({ minLength: 1, maxLength: 500 }),
          noteTitle: fc.string({ minLength: 1, maxLength: 100 }),
        }),
        async ({ templateName, templateContent, noteTitle }) => {
          // Create template
          const template = await createTemplate({
            name: templateName,
            content: templateContent,
          })
          createdTemplateIds.push(template.id)

          // Create note from template
          const result = await createNoteFromTemplate(
            template.id,
            noteTitle
          )
          createdNoteIds.push(result.id)

          // Delete template
          await deleteTemplate(template.id)
          createdTemplateIds = createdTemplateIds.filter(id => id !== template.id)

          // Verify template is deleted
          const deletedTemplate = await getTemplate(template.id)
          expect(deletedTemplate).toBeNull()

          // Verify note still exists with original content
          const note = await prisma.note.findUnique({
            where: { id: result.id },
          })
          expect(note).toBeDefined()
          expect(note!.title).toBe(noteTitle)
          expect(note!.content).toBe(templateContent)
        }
      ),
      { numRuns: 15 }
    )
  }, 60000)

  it('template list retrieval is consistent and ordered', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 50 }),
            content: fc.string({ minLength: 1, maxLength: 200 }),
            usageCount: fc.integer({ min: 0, max: 100 }),
          }),
          { minLength: 2, maxLength: 5 }
        ),
        async (templateSpecs) => {
          // Create multiple templates
          const templates = []
          for (const spec of templateSpecs) {
            const template = await prisma.noteTemplate.create({
              data: {
                name: spec.name,
                content: spec.content,
                userId: testUserId,
                usageCount: spec.usageCount,
              },
            })
            createdTemplateIds.push(template.id)
            templates.push(template)
          }

          // Retrieve all templates
          const retrieved = await getTemplates()

          // Verify all created templates are in the list
          for (const template of templates) {
            const found = retrieved.find(t => t.id === template.id)
            expect(found).toBeDefined()
            expect(found!.name).toBe(template.name)
            expect(found!.content).toBe(template.content)
          }

          // Verify ordering by usage count (descending)
          const createdTemplatesList = retrieved.filter(t =>
            templates.some(created => created.id === t.id)
          )
          
          for (let i = 0; i < createdTemplatesList.length - 1; i++) {
            expect(createdTemplatesList[i].usageCount).toBeGreaterThanOrEqual(
              createdTemplatesList[i + 1].usageCount
            )
          }
        }
      ),
      { numRuns: 10 }
    )
  }, 60000)
})
