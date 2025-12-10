/**
 * Property-Based Test: Version History Functionality
 * Feature: comprehensive-feature-audit, Property 1: 功能完整性
 * 
 * Validates: Requirements 12.1
 * 
 * Property: For any note with version history, all version operations
 * (create, view, compare, restore) should work correctly and maintain data integrity
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { fc } from '@fast-check/vitest'
import { prisma } from '@/lib/prisma'
import {
  saveNoteVersion,
  getNoteVersions,
  getNoteVersion,
  restoreNoteVersion,
} from '@/lib/versions/version-manager'

describe('Property 1: Version History Functionality Completeness', () => {
  let testUserId: string
  let testNoteId: string

  beforeEach(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: `test-${Date.now()}-${Math.random()}@example.com`,
        name: 'Test User',
        password: 'hashedpassword',
      },
    })
    testUserId = user.id

    // Create test note
    const note = await prisma.note.create({
      data: {
        title: 'Test Note',
        content: 'Initial content',
        userId: testUserId,
        ownerId: testUserId,
      },
    })
    testNoteId = note.id
  })

  afterEach(async () => {
    // Clean up test data
    await prisma.noteVersion.deleteMany({
      where: { noteId: testNoteId },
    })
    await prisma.note.deleteMany({
      where: { userId: testUserId },
    })
    await prisma.user.delete({
      where: { id: testUserId },
    })
  })

  it('should maintain version integrity across random edits', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 100 }),
            content: fc.string({ minLength: 0, maxLength: 1000 }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (edits) => {
          // Save all edits as versions
          for (const edit of edits) {
            const result = await saveNoteVersion(
              testUserId,
              testNoteId,
              edit.title,
              edit.content
            )
            expect(result.success).toBe(true)
          }

          // Verify all versions are retrievable
          const versions = await getNoteVersions(testNoteId, testUserId)
          expect(versions.success).toBe(true)
          expect(versions.data).toBeDefined()

          // Should have at most 50 versions (due to limit)
          const expectedCount = Math.min(edits.length, 50)
          expect(versions.data!.length).toBe(expectedCount)

          // Verify each version has complete data
          for (const version of versions.data!) {
            expect(version.id).toBeDefined()
            expect(version.noteId).toBe(testNoteId)
            expect(version.userId).toBe(testUserId)
            expect(version.title).toBeDefined()
            expect(version.content).toBeDefined()
            expect(version.createdAt).toBeInstanceOf(Date)
          }

          // Clean up for next iteration
          await prisma.noteVersion.deleteMany({
            where: { noteId: testNoteId },
          })
        }
      ),
      { numRuns: 20 }
    )
  })

  it('should preserve version data after restoration', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          originalTitle: fc.string({ minLength: 1, maxLength: 100 }),
          originalContent: fc.string({ minLength: 0, maxLength: 500 }),
          newTitle: fc.string({ minLength: 1, maxLength: 100 }),
          newContent: fc.string({ minLength: 0, maxLength: 500 }),
        }),
        async ({ originalTitle, originalContent, newTitle, newContent }) => {
          // Create original version
          await saveNoteVersion(testUserId, testNoteId, originalTitle, originalContent)

          // Get the version ID
          const versions1 = await getNoteVersions(testNoteId, testUserId)
          const originalVersionId = versions1.data![0].id

          // Update note to new content
          await prisma.note.update({
            where: { id: testNoteId },
            data: { title: newTitle, content: newContent },
          })

          // Restore to original version
          const restoreResult = await restoreNoteVersion(
            testNoteId,
            originalVersionId,
            testUserId
          )
          expect(restoreResult.success).toBe(true)

          // Verify note was restored
          const note = await prisma.note.findUnique({
            where: { id: testNoteId },
          })
          expect(note!.title).toBe(originalTitle)
          expect(note!.content).toBe(originalContent)

          // Verify original version still exists and is unchanged
          const originalVersion = await getNoteVersion(originalVersionId, testUserId)
          expect(originalVersion.success).toBe(true)
          expect(originalVersion.data!.title).toBe(originalTitle)
          expect(originalVersion.data!.content).toBe(originalContent)

          // Clean up for next iteration
          await prisma.noteVersion.deleteMany({
            where: { noteId: testNoteId },
          })
        }
      ),
      { numRuns: 15 }
    )
  })

  it('should maintain chronological order of versions', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 50 }),
            content: fc.string({ minLength: 0, maxLength: 200 }),
          }),
          { minLength: 2, maxLength: 10 }
        ),
        async (edits) => {
          const timestamps: Date[] = []

          // Create versions with small delays to ensure different timestamps
          for (const edit of edits) {
            await saveNoteVersion(testUserId, testNoteId, edit.title, edit.content)
            // Small delay to ensure different timestamps
            await new Promise(resolve => setTimeout(resolve, 10))
          }

          // Get versions
          const versions = await getNoteVersions(testNoteId, testUserId)
          expect(versions.success).toBe(true)

          // Verify versions are in reverse chronological order (newest first)
          for (let i = 0; i < versions.data!.length - 1; i++) {
            const current = versions.data![i].createdAt
            const next = versions.data![i + 1].createdAt
            expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime())
          }

          // Clean up for next iteration
          await prisma.noteVersion.deleteMany({
            where: { noteId: testNoteId },
          })
        }
      ),
      { numRuns: 15 }
    )
  })

  it('should handle version operations with various content types', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          title: fc.oneof(
            fc.string({ minLength: 1, maxLength: 100 }),
            fc.constant(''),
            fc.constant('   '),
            fc.string({ minLength: 1, maxLength: 50 })
          ),
          content: fc.oneof(
            fc.string({ minLength: 0, maxLength: 500 }),
            fc.constant(''),
            fc.constant('\n\n\n'),
            fc.string({ minLength: 0, maxLength: 200 }),
            fc.constant('# Markdown\n\n- List item\n- Another item')
          ),
        }),
        async ({ title, content }) => {
          // Skip empty titles as they might be invalid
          if (!title || title.trim().length === 0) {
            return
          }

          // Save version
          const saveResult = await saveNoteVersion(
            testUserId,
            testNoteId,
            title,
            content
          )
          expect(saveResult.success).toBe(true)

          // Retrieve version
          const versions = await getNoteVersions(testNoteId, testUserId)
          expect(versions.success).toBe(true)
          expect(versions.data!.length).toBeGreaterThan(0)

          // Verify content is preserved exactly
          const latestVersion = versions.data![0]
          expect(latestVersion.title).toBe(title)
          expect(latestVersion.content).toBe(content)

          // Clean up for next iteration
          await prisma.noteVersion.deleteMany({
            where: { noteId: testNoteId },
          })
        }
      ),
      { numRuns: 20 }
    )
  })

  it('should enforce 50 version limit consistently', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 51, max: 100 }),
        async (numVersions) => {
          // Create more than 50 versions
          for (let i = 0; i < numVersions; i++) {
            await saveNoteVersion(
              testUserId,
              testNoteId,
              `Version ${i}`,
              `Content ${i}`
            )
          }

          // Verify only 50 versions are kept
          const versions = await getNoteVersions(testNoteId, testUserId)
          expect(versions.success).toBe(true)
          expect(versions.data!.length).toBe(50)

          // Verify the kept versions are the most recent ones
          const titles = versions.data!.map(v => v.title)
          const expectedStart = numVersions - 50
          for (let i = expectedStart; i < numVersions; i++) {
            expect(titles).toContain(`Version ${i}`)
          }

          // Verify oldest versions were deleted
          for (let i = 0; i < expectedStart; i++) {
            expect(titles).not.toContain(`Version ${i}`)
          }

          // Clean up for next iteration
          await prisma.noteVersion.deleteMany({
            where: { noteId: testNoteId },
          })
        }
      ),
      { numRuns: 10 }
    )
  })

  it('should maintain version metadata integrity', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 50 }),
            content: fc.string({ minLength: 0, maxLength: 200 }),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        async (edits) => {
          // Create versions
          for (const edit of edits) {
            await saveNoteVersion(testUserId, testNoteId, edit.title, edit.content)
          }

          // Get all versions
          const versions = await getNoteVersions(testNoteId, testUserId)
          expect(versions.success).toBe(true)

          // Verify each version has complete and valid metadata
          for (const version of versions.data!) {
            // ID should be a non-empty string
            expect(typeof version.id).toBe('string')
            expect(version.id.length).toBeGreaterThan(0)

            // Note ID should match
            expect(version.noteId).toBe(testNoteId)

            // User ID should match
            expect(version.userId).toBe(testUserId)

            // Created at should be a valid date
            expect(version.createdAt).toBeInstanceOf(Date)
            expect(version.createdAt.getTime()).toBeLessThanOrEqual(Date.now())

            // User info should be present
            expect(version.userName).toBe('Test User')
            expect(version.userEmail).toContain('@example.com')

            // Content should be defined (can be empty string)
            expect(version.title).toBeDefined()
            expect(version.content).toBeDefined()
          }

          // Clean up for next iteration
          await prisma.noteVersion.deleteMany({
            where: { noteId: testNoteId },
          })
        }
      ),
      { numRuns: 15 }
    )
  })

  it('should handle concurrent version operations safely', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 50 }),
            content: fc.string({ minLength: 0, maxLength: 200 }),
          }),
          { minLength: 3, maxLength: 10 }
        ),
        async (edits) => {
          // Create versions concurrently
          const promises = edits.map(edit =>
            saveNoteVersion(testUserId, testNoteId, edit.title, edit.content)
          )

          const results = await Promise.all(promises)

          // All operations should succeed
          results.forEach(result => {
            expect(result.success).toBe(true)
          })

          // Verify all versions were created
          const versions = await getNoteVersions(testNoteId, testUserId)
          expect(versions.success).toBe(true)
          expect(versions.data!.length).toBe(Math.min(edits.length, 50))

          // Clean up for next iteration
          await prisma.noteVersion.deleteMany({
            where: { noteId: testNoteId },
          })
        }
      ),
      { numRuns: 10 }
    )
  })
})
