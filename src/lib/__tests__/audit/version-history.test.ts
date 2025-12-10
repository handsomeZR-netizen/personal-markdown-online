/**
 * Unit Tests: Version History Functionality
 * Tests version history features including creation, viewing, comparison, and restoration
 * 
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { prisma } from '@/lib/prisma'
import {
  saveNoteVersion,
  getNoteVersions,
  getNoteVersion,
  restoreNoteVersion,
} from '@/lib/versions/version-manager'

describe('Version History Functionality', () => {
  let testUserId: string
  let testNoteId: string

  beforeEach(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
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

  describe('Requirement 12.1: 版本自动创建', () => {
    it('should automatically create version snapshot when editing note', async () => {
      // Save a version
      const result = await saveNoteVersion(
        testUserId,
        testNoteId,
        'Updated Title',
        'Updated content'
      )

      expect(result.success).toBe(true)

      // Verify version was created
      const versions = await getNoteVersions(testNoteId, testUserId)
      expect(versions.success).toBe(true)
      expect(versions.data).toBeDefined()
      expect(versions.data!.length).toBe(1)
      expect(versions.data![0].title).toBe('Updated Title')
      expect(versions.data![0].content).toBe('Updated content')
    })

    it('should create multiple versions for multiple edits', async () => {
      // Save multiple versions
      await saveNoteVersion(testUserId, testNoteId, 'Version 1', 'Content 1')
      await saveNoteVersion(testUserId, testNoteId, 'Version 2', 'Content 2')
      await saveNoteVersion(testUserId, testNoteId, 'Version 3', 'Content 3')

      // Verify all versions were created
      const versions = await getNoteVersions(testNoteId, testUserId)
      expect(versions.success).toBe(true)
      expect(versions.data!.length).toBe(3)
    })

    it('should limit versions to 50 most recent', async () => {
      // Create 55 versions
      for (let i = 0; i < 55; i++) {
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

      // Verify oldest versions were deleted (versions 0-4)
      const titles = versions.data!.map(v => v.title)
      expect(titles).not.toContain('Version 0')
      expect(titles).not.toContain('Version 4')
      expect(titles).toContain('Version 54')
    })
  })

  describe('Requirement 12.2: 版本历史查看', () => {
    beforeEach(async () => {
      // Create some test versions
      await saveNoteVersion(testUserId, testNoteId, 'Version 1', 'Content 1')
      await saveNoteVersion(testUserId, testNoteId, 'Version 2', 'Content 2')
      await saveNoteVersion(testUserId, testNoteId, 'Version 3', 'Content 3')
    })

    it('should display all historical versions list', async () => {
      const result = await getNoteVersions(testNoteId, testUserId)

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data!.length).toBe(3)
    })

    it('should show versions in reverse chronological order (newest first)', async () => {
      const result = await getNoteVersions(testNoteId, testUserId)

      expect(result.success).toBe(true)
      expect(result.data![0].title).toBe('Version 3')
      expect(result.data![1].title).toBe('Version 2')
      expect(result.data![2].title).toBe('Version 1')
    })

    it('should include user information with each version', async () => {
      const result = await getNoteVersions(testNoteId, testUserId)

      expect(result.success).toBe(true)
      expect(result.data![0].userName).toBe('Test User')
      expect(result.data![0].userEmail).toContain('@example.com')
    })

    it('should return empty list for note with no versions', async () => {
      // Create a new note without versions
      const newNote = await prisma.note.create({
        data: {
          title: 'New Note',
          content: 'New content',
          userId: testUserId,
          ownerId: testUserId,
        },
      })

      const result = await getNoteVersions(newNote.id, testUserId)

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data!.length).toBe(0)

      // Cleanup
      await prisma.note.delete({ where: { id: newNote.id } })
    })

    it('should deny access to versions of notes user does not own', async () => {
      // Create another user
      const otherUser = await prisma.user.create({
        data: {
          email: `other-${Date.now()}@example.com`,
          name: 'Other User',
          password: 'hashedpassword',
        },
      })

      // Try to access versions with wrong user
      const result = await getNoteVersions(testNoteId, otherUser.id)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()

      // Cleanup
      await prisma.user.delete({ where: { id: otherUser.id } })
    })
  })

  describe('Requirement 12.3: 版本比较', () => {
    let version1Id: string
    let version2Id: string

    beforeEach(async () => {
      // Create two versions with different content
      await saveNoteVersion(
        testUserId,
        testNoteId,
        'Original Title',
        'This is the original content with some text.'
      )
      await saveNoteVersion(
        testUserId,
        testNoteId,
        'Modified Title',
        'This is the modified content with different text.'
      )

      const versions = await getNoteVersions(testNoteId, testUserId)
      version1Id = versions.data![1].id // Older version
      version2Id = versions.data![0].id // Newer version
    })

    it('should retrieve specific version for comparison', async () => {
      const result = await getNoteVersion(version1Id, testUserId)

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data!.title).toBe('Original Title')
      expect(result.data!.content).toContain('original content')
    })

    it('should highlight differences between versions (title)', async () => {
      const v1 = await getNoteVersion(version1Id, testUserId)
      const v2 = await getNoteVersion(version2Id, testUserId)

      expect(v1.data!.title).toBe('Original Title')
      expect(v2.data!.title).toBe('Modified Title')
      expect(v1.data!.title).not.toBe(v2.data!.title)
    })

    it('should highlight differences between versions (content)', async () => {
      const v1 = await getNoteVersion(version1Id, testUserId)
      const v2 = await getNoteVersion(version2Id, testUserId)

      expect(v1.data!.content).toContain('original')
      expect(v2.data!.content).toContain('modified')
      expect(v1.data!.content).not.toBe(v2.data!.content)
    })

    it('should show character count differences', async () => {
      const v1 = await getNoteVersion(version1Id, testUserId)
      const v2 = await getNoteVersion(version2Id, testUserId)

      const length1 = v1.data!.content.length
      const length2 = v2.data!.content.length

      expect(length1).toBeGreaterThan(0)
      expect(length2).toBeGreaterThan(0)
      // Content lengths should be different
      expect(Math.abs(length1 - length2)).toBeGreaterThan(0)
    })
  })

  describe('Requirement 12.4: 版本恢复', () => {
    let versionId: string

    beforeEach(async () => {
      // Create a version to restore
      await saveNoteVersion(
        testUserId,
        testNoteId,
        'Version to Restore',
        'Content to restore'
      )

      // Update the note to different content
      await prisma.note.update({
        where: { id: testNoteId },
        data: {
          title: 'Current Title',
          content: 'Current content',
        },
      })

      const versions = await getNoteVersions(testNoteId, testUserId)
      versionId = versions.data![0].id
    })

    it('should restore note content to selected version', async () => {
      const result = await restoreNoteVersion(testNoteId, versionId, testUserId)

      expect(result.success).toBe(true)

      // Verify note was restored
      const note = await prisma.note.findUnique({
        where: { id: testNoteId },
      })

      expect(note!.title).toBe('Version to Restore')
      expect(note!.content).toBe('Content to restore')
    })

    it('should save current version before restoring', async () => {
      const versionsBefore = await getNoteVersions(testNoteId, testUserId)
      const countBefore = versionsBefore.data!.length

      await restoreNoteVersion(testNoteId, versionId, testUserId)

      const versionsAfter = await getNoteVersions(testNoteId, testUserId)
      const countAfter = versionsAfter.data!.length

      // Should have 1 more version: one for current state before restore
      // (only if content differs from the version being restored)
      expect(countAfter).toBe(countBefore + 1)
    })

    it('should create new version after restoration', async () => {
      await restoreNoteVersion(testNoteId, versionId, testUserId)

      const versions = await getNoteVersions(testNoteId, testUserId)

      // Latest version should be the current state saved before restore
      // The restored content will be saved as a new version on the next edit
      expect(versions.data![0].title).toBe('Current Title')
      expect(versions.data![0].content).toBe('Current content')
    })

    it('should deny restoration of non-existent version', async () => {
      const result = await restoreNoteVersion(
        testNoteId,
        'non-existent-id',
        testUserId
      )

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should deny restoration by unauthorized user', async () => {
      // Create another user
      const otherUser = await prisma.user.create({
        data: {
          email: `other-${Date.now()}@example.com`,
          name: 'Other User',
          password: 'hashedpassword',
        },
      })

      const result = await restoreNoteVersion(testNoteId, versionId, otherUser.id)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()

      // Cleanup
      await prisma.user.delete({ where: { id: otherUser.id } })
    })
  })

  describe('Requirement 12.5: 版本元数据', () => {
    beforeEach(async () => {
      await saveNoteVersion(
        testUserId,
        testNoteId,
        'Test Version',
        'Test content'
      )
    })

    it('should display modification time for each version', async () => {
      const versions = await getNoteVersions(testNoteId, testUserId)

      expect(versions.data![0].createdAt).toBeDefined()
      expect(versions.data![0].createdAt).toBeInstanceOf(Date)
    })

    it('should display modifier (user) for each version', async () => {
      const versions = await getNoteVersions(testNoteId, testUserId)

      expect(versions.data![0].userId).toBe(testUserId)
      expect(versions.data![0].userName).toBe('Test User')
      expect(versions.data![0].userEmail).toBeDefined()
    })

    it('should include version ID for reference', async () => {
      const versions = await getNoteVersions(testNoteId, testUserId)

      expect(versions.data![0].id).toBeDefined()
      expect(typeof versions.data![0].id).toBe('string')
      expect(versions.data![0].id.length).toBeGreaterThan(0)
    })

    it('should include note ID reference', async () => {
      const versions = await getNoteVersions(testNoteId, testUserId)

      expect(versions.data![0].noteId).toBe(testNoteId)
    })

    it('should preserve metadata across multiple versions', async () => {
      // Create multiple versions
      await saveNoteVersion(testUserId, testNoteId, 'Version 2', 'Content 2')
      await saveNoteVersion(testUserId, testNoteId, 'Version 3', 'Content 3')

      const versions = await getNoteVersions(testNoteId, testUserId)

      // All versions should have complete metadata
      versions.data!.forEach(version => {
        expect(version.id).toBeDefined()
        expect(version.noteId).toBe(testNoteId)
        expect(version.userId).toBe(testUserId)
        expect(version.createdAt).toBeInstanceOf(Date)
        expect(version.userName).toBe('Test User')
      })
    })
  })

  describe('Integration: Complete Version History Workflow', () => {
    it('should support complete version history workflow', async () => {
      // 1. Create initial version
      await saveNoteVersion(testUserId, testNoteId, 'V1', 'Content 1')

      // 2. Create more versions
      await saveNoteVersion(testUserId, testNoteId, 'V2', 'Content 2')
      await saveNoteVersion(testUserId, testNoteId, 'V3', 'Content 3')

      // 3. View version history
      const history = await getNoteVersions(testNoteId, testUserId)
      expect(history.success).toBe(true)
      expect(history.data!.length).toBe(3)

      // 4. View specific version
      const versionId = history.data![1].id // V2
      const version = await getNoteVersion(versionId, testUserId)
      expect(version.success).toBe(true)
      expect(version.data!.title).toBe('V2')

      // 5. Restore to previous version
      const restore = await restoreNoteVersion(testNoteId, versionId, testUserId)
      expect(restore.success).toBe(true)

      // 6. Verify restoration
      const note = await prisma.note.findUnique({ where: { id: testNoteId } })
      expect(note!.title).toBe('V2')
      expect(note!.content).toBe('Content 2')

      // 7. Verify new versions were created during restoration
      const finalHistory = await getNoteVersions(testNoteId, testUserId)
      expect(finalHistory.data!.length).toBeGreaterThan(3)
    })
  })
})
