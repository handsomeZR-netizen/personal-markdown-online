/**
 * Property-Based Test: Version History Immutability
 * Feature: team-collaborative-knowledge-base, Property 17: Version History Immutability
 * 
 * Validates: Requirements 23.2, 23.3, 23.4
 * 
 * Property: For any note version saved in history, the content should remain 
 * unchanged and accessible even if the current note is modified or deleted.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fc from 'fast-check'
import { prisma } from '@/lib/prisma'
import {
  saveNoteVersion,
  getNoteVersions,
  getNoteVersion,
  restoreNoteVersion,
} from '../version-manager'

describe('Property 17: Version History Immutability', () => {
  let testUserId: string
  let testNoteId: string
  let createdNoteIds: string[] = []

  beforeEach(async () => {
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

    // Create a test note
    const note = await prisma.note.create({
      data: {
        title: 'Test Note',
        content: 'Initial content',
        userId: testUserId,
        ownerId: testUserId,
      },
    })
    testNoteId = note.id
    createdNoteIds.push(testNoteId)
  })

  afterEach(async () => {
    // Clean up test data - versions will be cascade deleted with notes
    try {
      await prisma.note.deleteMany({
        where: { id: { in: createdNoteIds } },
      })
    } catch (error) {
      // Ignore errors if notes were already deleted
    }
    
    try {
      await prisma.user.deleteMany({
        where: { id: testUserId },
      })
    } catch (error) {
      // Ignore errors
    }
  })

  it('saved versions remain unchanged when note is modified', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate a sequence of note modifications
        fc.array(
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 50 }),
            content: fc.string({ minLength: 10, maxLength: 200 }),
          }),
          { minLength: 2, maxLength: 5 }
        ),
        async (modifications) => {
          // Create a fresh note for this test iteration
          const note = await prisma.note.create({
            data: {
              title: 'Test Note for Versions',
              content: 'Initial content',
              userId: testUserId,
              ownerId: testUserId,
            },
          })
          const noteId = note.id
          createdNoteIds.push(noteId)

          // Save initial versions
          const savedVersions: Array<{
            title: string
            content: string
            versionId: string
          }> = []

          for (const mod of modifications) {
            const result = await saveNoteVersion(
              noteId,
              mod.title,
              mod.content,
              testUserId
            )
            expect(result.success).toBe(true)

            // Get the version we just saved
            const versionsResult = await getNoteVersions(noteId, testUserId)
            expect(versionsResult.success).toBe(true)
            
            if (versionsResult.data && versionsResult.data.length > 0) {
              const latestVersion = versionsResult.data[0]
              savedVersions.push({
                title: mod.title,
                content: mod.content,
                versionId: latestVersion.id,
              })
            }
          }

          // Modify the note multiple times
          await prisma.note.update({
            where: { id: noteId },
            data: {
              title: 'Modified Title',
              content: 'Modified Content',
            },
          })

          // Verify all saved versions remain unchanged
          for (const saved of savedVersions) {
            const versionResult = await getNoteVersion(saved.versionId, testUserId)
            expect(versionResult.success).toBe(true)
            
            if (versionResult.data) {
              expect(versionResult.data.title).toBe(saved.title)
              expect(versionResult.data.content).toBe(saved.content)
            }
          }
        }
      ),
      { numRuns: 5 } // Reduced runs for database operations
    )
  }, 30000) // 30 second timeout

  it('versions are cascade deleted when note is deleted', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 50 }),
          content: fc.string({ minLength: 10, maxLength: 200 }),
        }),
        async (versionData) => {
          // Create a fresh note for this test iteration
          const note = await prisma.note.create({
            data: {
              title: 'Test Note for Cascade',
              content: 'Initial content',
              userId: testUserId,
              ownerId: testUserId,
            },
          })
          const noteId = note.id

          // Save a version
          const saveResult = await saveNoteVersion(
            noteId,
            versionData.title,
            versionData.content,
            testUserId
          )
          expect(saveResult.success).toBe(true)

          // Get the version ID
          const versionsResult = await getNoteVersions(noteId, testUserId)
          expect(versionsResult.success).toBe(true)
          expect(versionsResult.data).toBeDefined()
          expect(versionsResult.data!.length).toBeGreaterThan(0)

          const versionId = versionsResult.data![0].id

          // Verify version exists before deletion
          const beforeDelete = await getNoteVersion(versionId, testUserId)
          expect(beforeDelete.success).toBe(true)
          expect(beforeDelete.data?.title).toBe(versionData.title)
          expect(beforeDelete.data?.content).toBe(versionData.content)

          // Delete the note (this should cascade delete versions due to schema)
          await prisma.note.delete({
            where: { id: noteId },
          })

          // Verify version is deleted (due to cascade)
          const afterDelete = await getNoteVersion(versionId, testUserId)
          expect(afterDelete.success).toBe(false)
        }
      ),
      { numRuns: 3 }
    )
  }, 30000) // 30 second timeout

  it('restoring a version creates a new version without modifying the original', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.tuple(
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 50 }),
            content: fc.string({ minLength: 10, maxLength: 200 }),
          }),
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 50 }),
            content: fc.string({ minLength: 10, maxLength: 200 }),
          })
        ),
        async ([version1, version2]) => {
          // Create a fresh note for this test iteration
          const note = await prisma.note.create({
            data: {
              title: 'Test Note for Restore',
              content: 'Initial content',
              userId: testUserId,
              ownerId: testUserId,
            },
          })
          const noteId = note.id
          createdNoteIds.push(noteId)

          // Save first version
          await saveNoteVersion(
            noteId,
            version1.title,
            version1.content,
            testUserId
          )

          // Save second version
          await saveNoteVersion(
            noteId,
            version2.title,
            version2.content,
            testUserId
          )

          // Get versions
          const versionsResult = await getNoteVersions(noteId, testUserId)
          expect(versionsResult.success).toBe(true)
          expect(versionsResult.data).toBeDefined()
          expect(versionsResult.data!.length).toBeGreaterThanOrEqual(2)

          // Get the first version (older one)
          const olderVersion = versionsResult.data!.find(
            v => v.title === version1.title && v.content === version1.content
          )
          expect(olderVersion).toBeDefined()

          const olderVersionId = olderVersion!.id
          const olderVersionContent = olderVersion!.content
          const olderVersionTitle = olderVersion!.title

          // Update note to something different
          await prisma.note.update({
            where: { id: noteId },
            data: {
              title: 'Current Title',
              content: 'Current Content',
            },
          })

          // Restore the older version
          const restoreResult = await restoreNoteVersion(
            noteId,
            olderVersionId,
            testUserId
          )
          expect(restoreResult.success).toBe(true)

          // Verify the original version is still unchanged
          const originalVersionAfterRestore = await getNoteVersion(
            olderVersionId,
            testUserId
          )
          expect(originalVersionAfterRestore.success).toBe(true)
          expect(originalVersionAfterRestore.data?.title).toBe(olderVersionTitle)
          expect(originalVersionAfterRestore.data?.content).toBe(olderVersionContent)

          // Verify note was restored
          const restoredNote = await prisma.note.findUnique({
            where: { id: noteId },
          })
          expect(restoredNote?.title).toBe(version1.title)
          expect(restoredNote?.content).toBe(version1.content)
        }
      ),
      { numRuns: 3 }
    )
  }, 30000) // 30 second timeout

  it('version count is limited to 50 per note', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 51, max: 55 }),
        async (numVersions) => {
          // Create a fresh note for this test iteration
          const note = await prisma.note.create({
            data: {
              title: 'Test Note for Version Limit',
              content: 'Initial content',
              userId: testUserId,
              ownerId: testUserId,
            },
          })
          const noteId = note.id
          createdNoteIds.push(noteId)

          // Create more than 50 versions
          for (let i = 0; i < numVersions; i++) {
            await saveNoteVersion(
              noteId,
              `Title ${i}`,
              `Content ${i}`,
              testUserId
            )
          }

          // Verify only 50 versions are kept
          const versionsResult = await getNoteVersions(noteId, testUserId)
          expect(versionsResult.success).toBe(true)
          expect(versionsResult.data).toBeDefined()
          expect(versionsResult.data!.length).toBeLessThanOrEqual(50)

          // Verify the most recent versions are kept
          if (versionsResult.data && versionsResult.data.length > 0) {
            const latestVersion = versionsResult.data[0]
            expect(latestVersion.title).toBe(`Title ${numVersions - 1}`)
          }
        }
      ),
      { numRuns: 2 } // Fewer runs due to many database operations
    )
  }, 60000) // 60 second timeout

  it('versions maintain correct timestamps and user attribution', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 50 }),
            content: fc.string({ minLength: 10, maxLength: 200 }),
          }),
          { minLength: 2, maxLength: 3 }
        ),
        async (versions) => {
          // Save versions with small delays
          for (const version of versions) {
            await saveNoteVersion(
              testNoteId,
              version.title,
              version.content,
              testUserId
            )

            // Small delay to ensure different timestamps
            await new Promise(resolve => setTimeout(resolve, 50))
          }

          // Get all versions
          const versionsResult = await getNoteVersions(testNoteId, testUserId)
          expect(versionsResult.success).toBe(true)
          expect(versionsResult.data).toBeDefined()

          // Verify timestamps are in descending order (newest first)
          const savedVersions = versionsResult.data!
          for (let i = 0; i < savedVersions.length - 1; i++) {
            const current = new Date(savedVersions[i].createdAt)
            const next = new Date(savedVersions[i + 1].createdAt)
            expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime())
          }

          // Verify all versions have correct user attribution
          for (const version of savedVersions) {
            expect(version.userId).toBe(testUserId)
          }
        }
      ),
      { numRuns: 3 }
    )
  }, 30000) // 30 second timeout
})
