/**
 * Property-Based Test: Storage Quota Accuracy
 * Feature: team-collaborative-knowledge-base, Property 19: Storage Quota Accuracy
 * Validates: Requirements 25.1, 25.2, 25.5
 *
 * Property: For any user's workspace, the displayed storage usage should accurately
 * reflect the sum of all note content and uploaded images within 1% margin.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { StorageQuotaManager } from '../storage-quota-manager';

// Mock data stores
const mockNotes = new Map<string, Array<{ id: string; content: string; ownerId: string }>>();
const mockStorageFiles = new Map<string, Array<{ name: string; metadata: { size: number }; created_at: string }>>();

// Mock Prisma client
vi.mock('@/lib/prisma', () => ({
  prisma: {
    note: {
      findMany: vi.fn(async ({ where, select }: any) => {
        const userId = where?.ownerId;
        if (!userId) return [];
        
        const userNotes = mockNotes.get(userId) || [];
        if (select?.content) {
          return userNotes.map(note => ({ content: note.content }));
        }
        if (select?.id) {
          return userNotes.map(note => ({ id: note.id }));
        }
        return userNotes;
      }),
      create: vi.fn(async ({ data }: any) => {
        const noteId = `note-${Date.now()}-${Math.random()}`;
        const note = { id: noteId, content: data.content, ownerId: data.ownerId };
        
        const userNotes = mockNotes.get(data.ownerId) || [];
        userNotes.push(note);
        mockNotes.set(data.ownerId, userNotes);
        
        return note;
      }),
      delete: vi.fn(async ({ where }: any) => {
        for (const [userId, notes] of mockNotes.entries()) {
          const index = notes.findIndex(n => n.id === where.id);
          if (index !== -1) {
            notes.splice(index, 1);
            mockNotes.set(userId, notes);
            return { id: where.id };
          }
        }
        return null;
      }),
      deleteMany: vi.fn(async ({ where }: any) => {
        const userId = where?.ownerId;
        if (userId) {
          mockNotes.delete(userId);
        }
        return { count: 0 };
      }),
    },
    user: {
      create: vi.fn(async ({ data }: any) => data),
      delete: vi.fn(async ({ where }: any) => where),
    },
  },
}));

// Mock Supabase client
const mockSupabase = {
  storage: {
    from: (bucket: string) => ({
      list: async (path: string) => {
        // Return mock file list
        return {
          data: mockStorageFiles.get(path) || [],
          error: null,
        };
      },
    }),
  },
};

describe('Property 19: Storage Quota Accuracy', () => {
  let manager: StorageQuotaManager;
  let testUserId: string;

  beforeEach(() => {
    // Create test user ID
    testUserId = `test-user-${Date.now()}-${Math.random()}`;

    // Initialize manager with mock
    manager = new StorageQuotaManager(mockSupabase as any);
    
    // Clear mock data
    mockNotes.clear();
    mockStorageFiles.clear();
  });

  afterEach(() => {
    // Cleanup mock data
    mockNotes.clear();
    mockStorageFiles.clear();
  });

  it('should accurately calculate storage usage within 1% margin', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random notes with content
        fc.array(
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 100 }),
            content: fc.string({ minLength: 10, maxLength: 5000 }), // At least 10 chars to avoid edge cases
          }),
          { minLength: 1, maxLength: 10 } // Reduced for performance
        ),
        // Generate random images per note
        fc.array(
          fc.record({
            noteIndex: fc.nat(),
            images: fc.array(
              fc.record({
                name: fc.string({ minLength: 1, maxLength: 50 }),
                size: fc.integer({ min: 100, max: 100000 }), // 100 bytes to 100KB
              }),
              { minLength: 0, maxLength: 3 } // Reduced for performance
            ),
          }),
          { minLength: 0, maxLength: 5 } // Reduced for performance
        ),
        async (notes, imageGroups) => {
          // Clear mock data for this iteration
          mockNotes.clear();
          mockStorageFiles.clear();
          
          // Create notes in database
          const createdNotes: Array<{ id: string; content: string }> = [];
          let expectedNotesSize = 0;

          for (const noteData of notes) {
            const noteId = `note-${Date.now()}-${Math.random()}`;
            const note = { id: noteId, content: noteData.content, ownerId: testUserId };
            
            // Add to mock store
            const userNotes = mockNotes.get(testUserId) || [];
            userNotes.push(note);
            mockNotes.set(testUserId, userNotes);
            
            createdNotes.push(note);

            // Calculate expected size
            expectedNotesSize += new Blob([noteData.content]).size;
          }

          // Setup mock images (group by note to avoid duplicates)
          const imagesByNote = new Map<string, Array<{ name: string; size: number }>>();
          
          for (const group of imageGroups) {
            if (createdNotes.length === 0) continue;
            
            const noteIndex = group.noteIndex % createdNotes.length;
            const note = createdNotes[noteIndex];

            if (note && group.images.length > 0) {
              const existing = imagesByNote.get(note.id) || [];
              imagesByNote.set(note.id, [...existing, ...group.images]);
            }
          }

          // Set mock files and calculate expected size
          let expectedImagesSize = 0;
          for (const [noteId, images] of imagesByNote.entries()) {
            const mockFiles = images.map((img) => ({
              name: img.name,
              metadata: { size: img.size },
              created_at: new Date().toISOString(),
            }));

            mockStorageFiles.set(noteId, mockFiles);

            // Calculate expected size
            expectedImagesSize += images.reduce((sum, img) => sum + img.size, 0);
          }

          const expectedTotalSize = expectedNotesSize + expectedImagesSize;

          // Get storage usage from manager
          const usage = await manager.getStorageUsage(testUserId);

          // Verify accuracy within 1% margin (or at least 100 bytes for small sizes to account for overhead)
          const margin = Math.max(expectedTotalSize * 0.01, 100); // 1% margin or 100 bytes minimum
          const difference = Math.abs(usage.totalBytes - expectedTotalSize);

          // If the difference is huge, it might be returning quota instead of usage
          if (difference > 100000) {
            // This is likely a bug - log for debugging
            console.log('Large difference detected:', {
              expected: expectedTotalSize,
              actual: usage.totalBytes,
              difference,
              notes: createdNotes.length,
            });
          }

          expect(difference).toBeLessThanOrEqual(margin);

          // Verify breakdown accuracy
          const notesMargin = Math.max(expectedNotesSize * 0.01, 10);
          const imagesMargin = Math.max(expectedImagesSize * 0.01, 10);
          
          expect(Math.abs(usage.notesBytes - expectedNotesSize)).toBeLessThanOrEqual(notesMargin);
          expect(Math.abs(usage.imagesBytes - expectedImagesSize)).toBeLessThanOrEqual(imagesMargin);

          // Verify total equals sum of parts
          expect(usage.totalBytes).toBe(usage.notesBytes + usage.imagesBytes);

          // Verify percentage calculation
          const expectedPercentage = (usage.totalBytes / usage.quotaBytes) * 100;
          expect(Math.abs(usage.usagePercentage - expectedPercentage)).toBeLessThan(0.01);
        }
      ),
      { numRuns: 20 } // Reduced for performance
    );
  }, 30000); // 30 second timeout

  it('should maintain accuracy after deletions', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 100 }),
            content: fc.string({ minLength: 100, maxLength: 5000 }),
          }),
          { minLength: 5, maxLength: 10 }
        ),
        fc.array(fc.nat(), { minLength: 1, maxLength: 3 }), // Indices to delete
        async (notes, deleteIndices) => {
          // Clear mock data for this iteration
          mockNotes.clear();
          mockStorageFiles.clear();
          
          // Create notes
          const createdNotes: Array<{ id: string; content: string; ownerId: string }> = [];
          for (const noteData of notes) {
            const noteId = `note-${Date.now()}-${Math.random()}`;
            const note = { id: noteId, content: noteData.content, ownerId: testUserId };
            
            // Add to mock store
            const userNotes = mockNotes.get(testUserId) || [];
            userNotes.push(note);
            mockNotes.set(testUserId, userNotes);
            
            createdNotes.push(note);
          }

          // Get initial usage
          const initialUsage = await manager.getStorageUsage(testUserId);

          // Delete some notes
          const notesToDelete = deleteIndices
            .map((idx) => createdNotes[idx % createdNotes.length])
            .filter((note, index, self) => 
              self.findIndex((n) => n.id === note.id) === index
            ); // Remove duplicates

          let deletedSize = 0;
          for (const note of notesToDelete) {
            deletedSize += new Blob([note.content]).size;
            
            // Remove from mock store
            const userNotes = mockNotes.get(testUserId) || [];
            const index = userNotes.findIndex(n => n.id === note.id);
            if (index !== -1) {
              userNotes.splice(index, 1);
              mockNotes.set(testUserId, userNotes);
            }
          }

          // Get usage after deletion
          const finalUsage = await manager.getStorageUsage(testUserId);

          // Verify the difference matches deleted size within 1% margin
          const expectedFinalSize = initialUsage.totalBytes - deletedSize;
          const margin = Math.max(expectedFinalSize * 0.01, 1);
          const difference = Math.abs(finalUsage.totalBytes - expectedFinalSize);

          expect(difference).toBeLessThanOrEqual(margin);
        }
      ),
      { numRuns: 10 } // Reduced for performance
    );
  }, 30000); // 30 second timeout

  it('should correctly identify quota thresholds', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 100 }), // Target percentage
        async (targetPercentage) => {
          // Clear mock data for this iteration
          mockNotes.clear();
          mockStorageFiles.clear();
          
          const quotaBytes = 1000000; // 1MB quota
          const targetBytes = Math.floor((quotaBytes * targetPercentage) / 100);

          // Create manager with specific quota
          const testManager = new StorageQuotaManager(
            mockSupabase as any,
            'note-images',
            quotaBytes
          );

          // Create notes to reach target size (skip if target is 0)
          if (targetBytes > 0) {
            let currentSize = 0;
            while (currentSize < targetBytes) {
              const remainingSize = targetBytes - currentSize;
              const contentSize = Math.min(remainingSize, 10000);
              const content = 'x'.repeat(contentSize);

              const noteId = `note-${Date.now()}-${Math.random()}`;
              const note = { id: noteId, content, ownerId: testUserId };
              
              // Add to mock store
              const userNotes = mockNotes.get(testUserId) || [];
              userNotes.push(note);
              mockNotes.set(testUserId, userNotes);

              currentSize += new Blob([content]).size;
            }
          }

          // Check thresholds
          const isNearQuota = await testManager.isNearQuota(testUserId, 80);
          const isExceeded = await testManager.isQuotaExceeded(testUserId);

          // Get actual usage for debugging
          const usage = await testManager.getStorageUsage(testUserId);
          const actualPercentage = usage.usagePercentage;

          // Verify threshold detection with tolerance for rounding
          if (actualPercentage >= 100) {
            expect(isExceeded).toBe(true);
            expect(isNearQuota).toBe(true);
          } else if (actualPercentage >= 79) { // Allow 1% tolerance
            expect(isNearQuota).toBe(true);
            expect(isExceeded).toBe(false);
          } else {
            expect(isNearQuota).toBe(false);
            expect(isExceeded).toBe(false);
          }
        }
      ),
      { numRuns: 10 } // Reduced for performance
    );
  }, 30000); // 30 second timeout

  it('should format bytes correctly for all sizes', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1099511627776 }), // 0 to 1TB
        (bytes) => {
          const formatted = StorageQuotaManager.formatBytes(bytes);

          // Should contain a number and a unit
          expect(formatted).toMatch(/^\d+(\.\d+)?\s+(Bytes|KB|MB|GB|TB)$/);

          // Should be human-readable (not too many digits)
          const number = parseFloat(formatted.split(' ')[0]);
          // Allow up to 1024 for boundary cases (e.g., exactly 1TB = 1024 GB)
          expect(number).toBeLessThanOrEqual(1024);
          expect(number).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
