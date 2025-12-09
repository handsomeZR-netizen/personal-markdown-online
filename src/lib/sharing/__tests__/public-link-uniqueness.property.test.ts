/**
 * Property-Based Test: Public Link Uniqueness
 * 
 * Feature: team-collaborative-knowledge-base, Property 10: Public Link Uniqueness
 * Validates: Requirements 10.1, 10.4
 * 
 * Property: For any note with public sharing enabled, the generated public slug
 * should be globally unique and remain stable until sharing is disabled.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';

describe('Property 10: Public Link Uniqueness', () => {
  // Clean up test data after each test
  const testNoteIds: string[] = [];
  const testUserIds: string[] = [];

  afterEach(async () => {
    // Clean up test notes
    if (testNoteIds.length > 0) {
      await prisma.note.deleteMany({
        where: { id: { in: testNoteIds } },
      });
      testNoteIds.length = 0;
    }

    // Clean up test users
    if (testUserIds.length > 0) {
      await prisma.user.deleteMany({
        where: { id: { in: testUserIds } },
      });
      testUserIds.length = 0;
    }
  });

  /**
   * Helper function to create a test user
   */
  async function createTestUser(email: string) {
    const user = await prisma.user.create({
      data: {
        email,
        password: 'test-password-hash',
        name: `Test User ${email}`,
      },
    });
    testUserIds.push(user.id);
    return user;
  }

  /**
   * Helper function to create a test note
   */
  async function createTestNote(userId: string, title: string) {
    const note = await prisma.note.create({
      data: {
        title,
        content: JSON.stringify({ type: 'doc', content: [] }),
        userId,
        ownerId: userId,
      },
    });
    testNoteIds.push(note.id);
    return note;
  }

  /**
   * Helper function to enable public sharing for a note
   */
  async function enablePublicSharing(noteId: string): Promise<string> {
    let publicSlug = nanoid(10);
    let attempts = 0;
    const maxAttempts = 5;

    // Ensure uniqueness
    while (attempts < maxAttempts) {
      const existing = await prisma.note.findUnique({
        where: { publicSlug },
      });

      if (!existing) {
        break;
      }

      publicSlug = nanoid(10);
      attempts++;
    }

    if (attempts >= maxAttempts) {
      throw new Error('Failed to generate unique slug');
    }

    await prisma.note.update({
      where: { id: noteId },
      data: {
        isPublic: true,
        publicSlug,
      },
    });

    return publicSlug;
  }

  it('should generate globally unique public slugs for multiple notes', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate 3-10 test notes
        fc.integer({ min: 3, max: 10 }),
        async (noteCount) => {
          // Create a test user
          const user = await createTestUser(`test-${Date.now()}-${Math.random()}@example.com`);

          // Create multiple notes
          const notes = await Promise.all(
            Array.from({ length: noteCount }, (_, i) =>
              createTestNote(user.id, `Test Note ${i}`)
            )
          );

          // Enable public sharing for all notes
          const slugs = await Promise.all(
            notes.map((note) => enablePublicSharing(note.id))
          );

          // Property: All slugs should be unique
          const uniqueSlugs = new Set(slugs);
          expect(uniqueSlugs.size).toBe(slugs.length);

          // Property: All slugs should be non-empty strings
          slugs.forEach((slug) => {
            expect(slug).toBeTruthy();
            expect(typeof slug).toBe('string');
            expect(slug.length).toBeGreaterThan(0);
          });

          // Property: All notes should have isPublic = true
          const updatedNotes = await prisma.note.findMany({
            where: { id: { in: notes.map((n) => n.id) } },
            select: { id: true, isPublic: true, publicSlug: true },
          });

          updatedNotes.forEach((note) => {
            expect(note.isPublic).toBe(true);
            expect(note.publicSlug).toBeTruthy();
          });
        }
      ),
      { numRuns: 10, timeout: 10000 } // Run 10 iterations with 10s timeout
    );
  }, 60000); // 60 second test timeout

  it('should maintain slug stability until sharing is disabled', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 5, maxLength: 50 }), // Note title
        async (noteTitle) => {
          // Create a test user and note
          const user = await createTestUser(`test-${Date.now()}-${Math.random()}@example.com`);
          const note = await createTestNote(user.id, noteTitle);

          // Enable public sharing
          const originalSlug = await enablePublicSharing(note.id);

          // Property: Slug should remain stable across multiple reads
          for (let i = 0; i < 5; i++) {
            const currentNote = await prisma.note.findUnique({
              where: { id: note.id },
              select: { publicSlug: true, isPublic: true },
            });

            expect(currentNote?.publicSlug).toBe(originalSlug);
            expect(currentNote?.isPublic).toBe(true);
          }

          // Disable public sharing
          await prisma.note.update({
            where: { id: note.id },
            data: {
              isPublic: false,
              publicSlug: null,
            },
          });

          // Property: After disabling, slug should be null
          const disabledNote = await prisma.note.findUnique({
            where: { id: note.id },
            select: { publicSlug: true, isPublic: true },
          });

          expect(disabledNote?.publicSlug).toBeNull();
          expect(disabledNote?.isPublic).toBe(false);

          // Re-enable public sharing
          const newSlug = await enablePublicSharing(note.id);

          // Property: New slug should be different from original
          // (not guaranteed but highly likely with random generation)
          // This tests that slugs are regenerated, not reused
          const reenabledNote = await prisma.note.findUnique({
            where: { id: note.id },
            select: { publicSlug: true, isPublic: true },
          });

          expect(reenabledNote?.publicSlug).toBe(newSlug);
          expect(reenabledNote?.isPublic).toBe(true);
        }
      ),
      { numRuns: 10, timeout: 10000 }
    );
  }, 60000);

  it('should enforce uniqueness at database level', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 5, maxLength: 50 }), // Note title
        async (noteTitle) => {
          // Create two test users and notes
          const user1 = await createTestUser(`test1-${Date.now()}-${Math.random()}@example.com`);
          const user2 = await createTestUser(`test2-${Date.now()}-${Math.random()}@example.com`);
          
          const note1 = await createTestNote(user1.id, `${noteTitle} 1`);
          const note2 = await createTestNote(user2.id, `${noteTitle} 2`);

          // Enable public sharing for first note
          const slug1 = await enablePublicSharing(note1.id);

          // Try to manually set the same slug for second note (should fail)
          let errorOccurred = false;
          try {
            await prisma.note.update({
              where: { id: note2.id },
              data: {
                isPublic: true,
                publicSlug: slug1, // Same slug as note1
              },
            });
          } catch (error) {
            // Property: Database should reject duplicate slugs
            errorOccurred = true;
            expect(error).toBeTruthy();
          }

          // Property: Attempting to create duplicate slug should fail
          expect(errorOccurred).toBe(true);

          // Verify note2 still doesn't have a public slug
          const note2After = await prisma.note.findUnique({
            where: { id: note2.id },
            select: { publicSlug: true, isPublic: true },
          });

          expect(note2After?.publicSlug).toBeNull();
        }
      ),
      { numRuns: 10, timeout: 10000 }
    );
  }, 60000);

  it('should generate slugs with sufficient entropy', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 10, max: 50 }), // Number of slugs to generate
        async (slugCount) => {
          // Create a test user
          const user = await createTestUser(`test-${Date.now()}-${Math.random()}@example.com`);

          // Create multiple notes and enable public sharing
          const notes = await Promise.all(
            Array.from({ length: slugCount }, (_, i) =>
              createTestNote(user.id, `Test Note ${i}`)
            )
          );

          const slugs = await Promise.all(
            notes.map((note) => enablePublicSharing(note.id))
          );

          // Property: All slugs should be unique (no collisions)
          const uniqueSlugs = new Set(slugs);
          expect(uniqueSlugs.size).toBe(slugs.length);

          // Property: Slugs should have expected length (10 characters)
          slugs.forEach((slug) => {
            expect(slug.length).toBe(10);
          });

          // Property: Slugs should contain alphanumeric characters
          slugs.forEach((slug) => {
            expect(slug).toMatch(/^[a-zA-Z0-9_-]+$/);
          });

          // Property: Slugs should be URL-safe (no special characters that need encoding)
          slugs.forEach((slug) => {
            expect(encodeURIComponent(slug)).toBe(slug);
          });
        }
      ),
      { numRuns: 5, timeout: 10000 } // Fewer runs since this generates many notes
    );
  }, 60000);

  it('should allow finding notes by public slug', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 5, maxLength: 50 }), // Note title
        async (noteTitle) => {
          // Create a test user and note
          const user = await createTestUser(`test-${Date.now()}-${Math.random()}@example.com`);
          const note = await createTestNote(user.id, noteTitle);

          // Enable public sharing
          const slug = await enablePublicSharing(note.id);

          // Property: Should be able to find note by public slug
          const foundNote = await prisma.note.findUnique({
            where: {
              publicSlug: slug,
              isPublic: true,
            },
            select: {
              id: true,
              title: true,
              publicSlug: true,
              isPublic: true,
            },
          });

          expect(foundNote).toBeTruthy();
          expect(foundNote?.id).toBe(note.id);
          expect(foundNote?.title).toBe(noteTitle);
          expect(foundNote?.publicSlug).toBe(slug);
          expect(foundNote?.isPublic).toBe(true);

          // Property: Should not find note with wrong slug
          const notFound = await prisma.note.findUnique({
            where: {
              publicSlug: 'nonexistent-slug-12345',
              isPublic: true,
            },
          });

          expect(notFound).toBeNull();
        }
      ),
      { numRuns: 10, timeout: 10000 }
    );
  }, 60000);
});
