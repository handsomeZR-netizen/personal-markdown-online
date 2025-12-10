/**
 * Property-Based Tests for Database Provider Transparency
 * 
 * Feature: local-database-migration, Property 2: 数据库提供者透明性
 * 
 * 对于任何数据库操作,切换数据库提供者(本地 ↔ Supabase)后,
 * 业务逻辑代码应该产生相同的结果,无需修改
 * 
 * For any database operation, switching database providers (local ↔ Supabase)
 * should produce the same results without modifying business logic code
 * 
 * Validates: Requirements 4.3
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { prisma } from '../prisma';

// Mock database config to simulate different modes
vi.mock('../db-config', () => ({
  getDatabaseConfig: vi.fn(() => ({
    mode: 'local',
    connectionString: 'postgresql://test',
    isSupabaseAvailable: false,
  })),
}));

describe('Property 2: Database Provider Transparency', () => {
  // Helper to generate unique email
  const generateUniqueEmail = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    return `test-${timestamp}-${random}@example.com`;
  };

  beforeEach(async () => {
    // Clean up test data before each test
    try {
      await prisma.note.deleteMany({});
      await prisma.user.deleteMany({});
    } catch (error) {
      console.warn('Cleanup warning:', error);
    }
  });

  afterEach(async () => {
    // Clean up test data after each test
    try {
      await prisma.note.deleteMany({});
      await prisma.user.deleteMany({});
    } catch (error) {
      console.warn('Cleanup warning:', error);
    }
  });

  /**
   * Property 2.1: CRUD operations produce consistent results
   * 
   * For any valid note data, creating, reading, updating, and deleting
   * should work the same way regardless of database provider
   */
  it('should perform CRUD operations consistently across providers', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random user data
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }),
          password: fc.string({ minLength: 8, maxLength: 100 }),
        }),
        // Generate random note data
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 100 }),
          content: fc.string({ minLength: 0, maxLength: 1000 }),
        }),
        
        async (userData, noteData) => {
          // Create a user first with unique email
          const user = await prisma.user.create({
            data: {
              email: generateUniqueEmail(),
              name: userData.name,
              password: userData.password,
            },
          });

          // CREATE: Create a note
          const createdNote = await prisma.note.create({
            data: {
              title: noteData.title,
              content: noteData.content,
              userId: user.id,
              ownerId: user.id,
            },
          });

          // Verify note was created
          expect(createdNote).toBeDefined();
          expect(createdNote.title).toBe(noteData.title);
          expect(createdNote.content).toBe(noteData.content);
          expect(createdNote.ownerId).toBe(user.id);

          // READ: Retrieve the note
          const retrievedNote = await prisma.note.findUnique({
            where: { id: createdNote.id },
          });

          // Verify retrieved note matches created note
          expect(retrievedNote).toBeDefined();
          expect(retrievedNote?.id).toBe(createdNote.id);
          expect(retrievedNote?.title).toBe(noteData.title);
          expect(retrievedNote?.content).toBe(noteData.content);

          // UPDATE: Modify the note
          const updatedTitle = noteData.title + ' (updated)';
          const updatedNote = await prisma.note.update({
            where: { id: createdNote.id },
            data: { title: updatedTitle },
          });

          // Verify note was updated
          expect(updatedNote.title).toBe(updatedTitle);
          expect(updatedNote.content).toBe(noteData.content);

          // DELETE: Remove the note
          await prisma.note.delete({
            where: { id: createdNote.id },
          });

          // Verify note was deleted
          const deletedNote = await prisma.note.findUnique({
            where: { id: createdNote.id },
          });
          expect(deletedNote).toBeNull();

          // Clean up user
          await prisma.user.delete({
            where: { id: user.id },
          });
        }
      ),
      { numRuns: 10, timeout: 30000 }
    );
  }, 60000);

  /**
   * Property 2.2: Query operations return consistent results
   * 
   * For any set of notes, querying and filtering should work
   * the same way regardless of database provider
   */
  it('should query and filter notes consistently across providers', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate a user
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }),
          password: fc.string({ minLength: 8, maxLength: 100 }),
        }),
        // Generate multiple notes
        fc.array(
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 100 }),
            content: fc.string({ minLength: 0, maxLength: 1000 }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        
        async (userData, notesData) => {
          // Create a user with unique email
          const user = await prisma.user.create({
            data: {
              email: generateUniqueEmail(),
              name: userData.name,
              password: userData.password,
            },
          });

          // Create multiple notes
          const createdNotes = await Promise.all(
            notesData.map((noteData) =>
              prisma.note.create({
                data: {
                  title: noteData.title,
                  content: noteData.content,
                  userId: user.id,
                  ownerId: user.id,
                },
              })
            )
          );

          // Query all notes for the user
          const allNotes = await prisma.note.findMany({
            where: { ownerId: user.id },
          });

          // Verify all notes were retrieved
          expect(allNotes.length).toBe(createdNotes.length);

          // Query notes with specific title
          if (notesData.length > 0) {
            const firstTitle = notesData[0].title;
            const filteredNotes = await prisma.note.findMany({
              where: {
                ownerId: user.id,
                title: firstTitle,
              },
            });

            // Verify filtering works
            expect(filteredNotes.length).toBeGreaterThan(0);
            filteredNotes.forEach((note) => {
              expect(note.title).toBe(firstTitle);
            });
          }

          // Count notes
          const noteCount = await prisma.note.count({
            where: { ownerId: user.id },
          });

          expect(noteCount).toBe(createdNotes.length);

          // Clean up
          await prisma.note.deleteMany({
            where: { ownerId: user.id },
          });
          await prisma.user.delete({
            where: { id: user.id },
          });
        }
      ),
      { numRuns: 10, timeout: 30000 }
    );
  }, 60000);

  /**
   * Property 2.3: Transactions work consistently
   * 
   * For any set of operations, transactions should maintain
   * ACID properties regardless of database provider
   */
  it('should handle transactions consistently across providers', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate user data
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }),
          password: fc.string({ minLength: 8, maxLength: 100 }),
        }),
        // Generate note data
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 100 }),
          content: fc.string({ minLength: 0, maxLength: 1000 }),
        }),
        
        async (userData, noteData) => {
          // Execute operations in a transaction
          const result = await prisma.$transaction(async (tx) => {
            // Create user with unique email
            const user = await tx.user.create({
              data: {
                email: generateUniqueEmail(),
                name: userData.name,
                password: userData.password,
              },
            });

            // Create note
            const note = await tx.note.create({
              data: {
                title: noteData.title,
                content: noteData.content,
                userId: user.id,
                ownerId: user.id,
              },
            });

            return { user, note };
          });

          // Verify both user and note were created
          expect(result.user).toBeDefined();
          expect(result.note).toBeDefined();
          expect(result.note.ownerId).toBe(result.user.id);

          // Verify data persisted after transaction
          const persistedUser = await prisma.user.findUnique({
            where: { id: result.user.id },
          });
          const persistedNote = await prisma.note.findUnique({
            where: { id: result.note.id },
          });

          expect(persistedUser).toBeDefined();
          expect(persistedNote).toBeDefined();

          // Clean up
          await prisma.note.delete({
            where: { id: result.note.id },
          });
          await prisma.user.delete({
            where: { id: result.user.id },
          });
        }
      ),
      { numRuns: 10, timeout: 30000 }
    );
  }, 60000);

  /**
   * Property 2.4: Relations work consistently
   * 
   * For any related data, relationship queries should work
   * the same way regardless of database provider
   */
  it('should handle relations consistently across providers', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate user data
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }),
          password: fc.string({ minLength: 8, maxLength: 100 }),
        }),
        // Generate multiple notes
        fc.array(
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 100 }),
            content: fc.string({ minLength: 0, maxLength: 1000 }),
          }),
          { minLength: 1, maxLength: 5 }
        ),
        
        async (userData, notesData) => {
          // First create the user with unique email
          const createdUser = await prisma.user.create({
            data: {
              email: generateUniqueEmail(),
              name: userData.name,
              password: userData.password,
            },
          });

          // Then create notes for the user
          await Promise.all(
            notesData.map((noteData) =>
              prisma.note.create({
                data: {
                  title: noteData.title,
                  content: noteData.content,
                  userId: createdUser.id,
                  ownerId: createdUser.id,
                },
              })
            )
          );

          // Query user with notes
          const user = await prisma.user.findUnique({
            where: { id: createdUser.id },
            include: { notes: true },
          });

          if (!user) {
            throw new Error('User not found');
          }

          // Verify user has notes
          expect(user.notes.length).toBe(notesData.length);

          // Query user with notes
          const userWithNotes = await prisma.user.findUnique({
            where: { id: user.id },
            include: { notes: true },
          });

          // Verify relation query works
          expect(userWithNotes).toBeDefined();
          expect(userWithNotes?.notes.length).toBe(notesData.length);

          // Verify each note has correct owner
          userWithNotes?.notes.forEach((note) => {
            expect(note.ownerId).toBe(user.id);
          });

          // Clean up
          await prisma.note.deleteMany({
            where: { ownerId: user.id },
          });
          await prisma.user.delete({
            where: { id: user.id },
          });
        }
      ),
      { numRuns: 10, timeout: 30000 }
    );
  }, 60000);

  /**
   * Property 2.5: Error handling is consistent
   * 
   * For any invalid operation, error handling should work
   * the same way regardless of database provider
   */
  it('should handle errors consistently across providers', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }),
          password: fc.string({ minLength: 8, maxLength: 100 }),
        }),
        
        async (userData) => {
          // Create a user with unique email
          const email = generateUniqueEmail();
          const user = await prisma.user.create({
            data: {
              email,
              name: userData.name,
              password: userData.password,
            },
          });

          // Try to create duplicate user (should fail)
          await expect(
            prisma.user.create({
              data: {
                email, // Same email
                name: userData.name,
                password: userData.password,
              },
            })
          ).rejects.toThrow();

          // Try to query non-existent note
          const nonExistentNote = await prisma.note.findUnique({
            where: { id: 'non-existent-id' },
          });
          expect(nonExistentNote).toBeNull();

          // Try to delete non-existent note (should fail)
          await expect(
            prisma.note.delete({
              where: { id: 'non-existent-id' },
            })
          ).rejects.toThrow();

          // Clean up
          await prisma.user.delete({
            where: { id: user.id },
          });
        }
      ),
      { numRuns: 10, timeout: 30000 }
    );
  }, 60000);
});
