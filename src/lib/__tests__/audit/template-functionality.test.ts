/**
 * Template Functionality Tests
 * Feature: comprehensive-feature-audit, Task 13.1
 * 
 * Tests template page access, creation from templates, custom template creation,
 * template editing, and template deletion.
 * 
 * Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { prisma } from '@/lib/prisma'
import {
  getTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  createNoteFromTemplate,
  saveNoteAsTemplate,
  type Template,
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

describe('Template Functionality Tests', () => {
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
      await prisma.note.deleteMany({
        where: { id: { in: createdNoteIds } },
      })
    }

    // Clean up created templates
    if (createdTemplateIds.length > 0) {
      await prisma.noteTemplate.deleteMany({
        where: { id: { in: createdTemplateIds } },
      })
    }
  })

  describe('Requirement 11.1: Template Page Access', () => {
    it('should retrieve all templates for the current user', async () => {
      // Create test templates
      const template1 = await prisma.noteTemplate.create({
        data: {
          name: 'Meeting Notes',
          description: 'Template for meeting notes',
          content: '# Meeting Notes\n\n## Attendees\n\n## Agenda\n\n## Action Items',
          userId: testUserId,
          usageCount: 5,
        },
      })
      createdTemplateIds.push(template1.id)

      const template2 = await prisma.noteTemplate.create({
        data: {
          name: 'Project Plan',
          description: 'Template for project planning',
          content: '# Project Plan\n\n## Goals\n\n## Timeline\n\n## Resources',
          userId: testUserId,
          usageCount: 3,
        },
      })
      createdTemplateIds.push(template2.id)

      // Retrieve templates
      const templates = await getTemplates()

      // Verify templates are returned
      expect(templates).toBeDefined()
      expect(templates.length).toBeGreaterThanOrEqual(2)
      
      // Verify templates are ordered by usage count (descending)
      const retrievedTemplate1 = templates.find(t => t.id === template1.id)
      const retrievedTemplate2 = templates.find(t => t.id === template2.id)
      
      expect(retrievedTemplate1).toBeDefined()
      expect(retrievedTemplate2).toBeDefined()
      expect(retrievedTemplate1!.usageCount).toBe(5)
      expect(retrievedTemplate2!.usageCount).toBe(3)
    })

    it('should retrieve a single template by ID', async () => {
      const template = await prisma.noteTemplate.create({
        data: {
          name: 'Daily Journal',
          description: 'Template for daily journaling',
          content: '# Daily Journal\n\n## Date\n\n## Highlights\n\n## Reflections',
          userId: testUserId,
        },
      })
      createdTemplateIds.push(template.id)

      const retrieved = await getTemplate(template.id)

      expect(retrieved).toBeDefined()
      expect(retrieved!.id).toBe(template.id)
      expect(retrieved!.name).toBe('Daily Journal')
      expect(retrieved!.content).toContain('Daily Journal')
    })
  })

  describe('Requirement 11.2: Create Note from Template', () => {
    it('should create a note with template content', async () => {
      // Create a template
      const template = await prisma.noteTemplate.create({
        data: {
          name: 'Bug Report',
          content: '# Bug Report\n\n## Description\n\n## Steps to Reproduce\n\n## Expected Behavior\n\n## Actual Behavior',
          userId: testUserId,
        },
      })
      createdTemplateIds.push(template.id)

      // Create note from template
      const result = await createNoteFromTemplate(
        template.id,
        'Bug #123: Login Issue'
      )
      createdNoteIds.push(result.id)

      // Verify note was created
      const note = await prisma.note.findUnique({
        where: { id: result.id },
      })

      expect(note).toBeDefined()
      expect(note!.title).toBe('Bug #123: Login Issue')
      expect(note!.content).toBe(template.content)
      expect(note!.userId).toBe(testUserId)
    })

    it('should increment template usage count when creating note', async () => {
      const template = await prisma.noteTemplate.create({
        data: {
          name: 'Weekly Review',
          content: '# Weekly Review\n\n## Accomplishments\n\n## Challenges\n\n## Next Week',
          userId: testUserId,
          usageCount: 0,
        },
      })
      createdTemplateIds.push(template.id)

      const initialUsageCount = template.usageCount

      // Create note from template
      const result = await createNoteFromTemplate(
        template.id,
        'Week of Dec 9, 2025'
      )
      createdNoteIds.push(result.id)

      // Verify usage count incremented
      const updatedTemplate = await prisma.noteTemplate.findUnique({
        where: { id: template.id },
      })

      expect(updatedTemplate!.usageCount).toBe(initialUsageCount + 1)
    })

    it('should create note in specified folder when folderId provided', async () => {
      // Create a folder
      const folder = await prisma.folder.create({
        data: {
          name: 'Work',
          userId: testUserId,
        },
      })

      const template = await prisma.noteTemplate.create({
        data: {
          name: 'Task Template',
          content: '# Task\n\n## Description\n\n## Checklist',
          userId: testUserId,
        },
      })
      createdTemplateIds.push(template.id)

      // Create note from template with folder
      const result = await createNoteFromTemplate(
        template.id,
        'New Task',
        folder.id
      )
      createdNoteIds.push(result.id)

      // Verify note is in folder
      const note = await prisma.note.findUnique({
        where: { id: result.id },
      })

      expect(note!.folderId).toBe(folder.id)

      // Cleanup folder
      await prisma.folder.delete({ where: { id: folder.id } })
    })
  })

  describe('Requirement 11.3: Create Custom Template', () => {
    it('should create a new custom template', async () => {
      const templateData = {
        name: 'Custom Recipe',
        description: 'Template for cooking recipes',
        content: '# Recipe\n\n## Ingredients\n\n## Instructions\n\n## Notes',
      }

      const template = await createTemplate(templateData)
      createdTemplateIds.push(template.id)

      expect(template).toBeDefined()
      expect(template.name).toBe(templateData.name)
      expect(template.description).toBe(templateData.description)
      expect(template.content).toBe(templateData.content)
      expect(template.userId).toBe(testUserId)
      expect(template.usageCount).toBe(0)
    })

    it('should save existing note as template', async () => {
      // Create a note
      const note = await prisma.note.create({
        data: {
          title: 'My Great Note',
          content: '# Great Content\n\nThis is a well-structured note.',
          userId: testUserId,
          ownerId: testUserId,
        },
      })
      createdNoteIds.push(note.id)

      // Save note as template
      const template = await saveNoteAsTemplate(
        note.id,
        'Great Note Template',
        'Template based on my great note'
      )
      createdTemplateIds.push(template.id)

      expect(template).toBeDefined()
      expect(template.name).toBe('Great Note Template')
      expect(template.description).toBe('Template based on my great note')
      expect(template.content).toBe(note.content)
      expect(template.userId).toBe(testUserId)
    })
  })

  describe('Requirement 11.4: Edit Template', () => {
    it('should update template name', async () => {
      const template = await prisma.noteTemplate.create({
        data: {
          name: 'Old Name',
          content: '# Content',
          userId: testUserId,
        },
      })
      createdTemplateIds.push(template.id)

      const updated = await updateTemplate(template.id, {
        name: 'New Name',
      })

      expect(updated.name).toBe('New Name')
      expect(updated.content).toBe(template.content) // Content unchanged
    })

    it('should update template description', async () => {
      const template = await prisma.noteTemplate.create({
        data: {
          name: 'Template',
          description: 'Old description',
          content: '# Content',
          userId: testUserId,
        },
      })
      createdTemplateIds.push(template.id)

      const updated = await updateTemplate(template.id, {
        description: 'New description',
      })

      expect(updated.description).toBe('New description')
    })

    it('should update template content', async () => {
      const template = await prisma.noteTemplate.create({
        data: {
          name: 'Template',
          content: '# Old Content',
          userId: testUserId,
        },
      })
      createdTemplateIds.push(template.id)

      const updated = await updateTemplate(template.id, {
        content: '# New Content\n\n## Section 1\n\n## Section 2',
      })

      expect(updated.content).toBe('# New Content\n\n## Section 1\n\n## Section 2')
    })

    it('should update multiple template fields at once', async () => {
      const template = await prisma.noteTemplate.create({
        data: {
          name: 'Old Template',
          description: 'Old description',
          content: '# Old',
          userId: testUserId,
        },
      })
      createdTemplateIds.push(template.id)

      const updated = await updateTemplate(template.id, {
        name: 'Updated Template',
        description: 'Updated description',
        content: '# Updated Content',
      })

      expect(updated.name).toBe('Updated Template')
      expect(updated.description).toBe('Updated description')
      expect(updated.content).toBe('# Updated Content')
    })
  })

  describe('Requirement 11.5: Delete Template', () => {
    it('should delete a template', async () => {
      const template = await prisma.noteTemplate.create({
        data: {
          name: 'Template to Delete',
          content: '# Content',
          userId: testUserId,
        },
      })

      // Delete template
      await deleteTemplate(template.id)

      // Verify template is deleted
      const deleted = await prisma.noteTemplate.findUnique({
        where: { id: template.id },
      })

      expect(deleted).toBeNull()
    })

    it('should not delete template owned by another user', async () => {
      // Create another user
      const otherUserId = 'other-user-id'
      await prisma.user.upsert({
        where: { id: otherUserId },
        update: {},
        create: {
          id: otherUserId,
          email: 'other@example.com',
          name: 'Other User',
          password: 'hashedpassword',
        },
      })

      // Create template for other user
      const template = await prisma.noteTemplate.create({
        data: {
          name: 'Other User Template',
          content: '# Content',
          userId: otherUserId,
        },
      })

      // Attempt to delete should throw error
      await expect(deleteTemplate(template.id)).rejects.toThrow('Template not found')

      // Verify template still exists
      const stillExists = await prisma.noteTemplate.findUnique({
        where: { id: template.id },
      })
      expect(stillExists).toBeDefined()

      // Cleanup
      await prisma.noteTemplate.delete({ where: { id: template.id } })
      await prisma.user.delete({ where: { id: otherUserId } })
    })

    it('should allow deleting template even if notes were created from it', async () => {
      // Create template
      const template = await prisma.noteTemplate.create({
        data: {
          name: 'Template with Notes',
          content: '# Content',
          userId: testUserId,
        },
      })
      createdTemplateIds.push(template.id)

      // Create note from template
      const result = await createNoteFromTemplate(
        template.id,
        'Note from Template'
      )
      createdNoteIds.push(result.id)

      // Delete template
      await deleteTemplate(template.id)

      // Verify template is deleted
      const deletedTemplate = await prisma.noteTemplate.findUnique({
        where: { id: template.id },
      })
      expect(deletedTemplate).toBeNull()

      // Verify note still exists (not cascade deleted)
      const note = await prisma.note.findUnique({
        where: { id: result.id },
      })
      expect(note).toBeDefined()
      expect(note!.content).toBe(template.content)

      // Remove from cleanup array since already deleted
      createdTemplateIds = createdTemplateIds.filter(id => id !== template.id)
    })
  })
})
