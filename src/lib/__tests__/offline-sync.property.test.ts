/**
 * Offline and Sync Property-Based Tests
 * 
 * Property 1: Functionality Completeness
 * Property 7: Data Consistency
 * 
 * Validates Requirements 5.1, 15.1
 * 
 * Feature: comprehensive-feature-audit, Property 1: 功能完整性
 * Feature: comprehensive-feature-audit, Property 7: 数据一致性
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { DraftManager } from '@/lib/offline/draft-manager';
import { IndexedDBManager } from '@/lib/offline/indexeddb-manager';
import { ConflictResolver, RemoteNote } from '@/lib/offline/conflict-resolver';
import { SyncQueueManager } from '@/lib/offline/sync-queue-manager';
import { LocalNote, DraftContent, SyncOperation } from '@/types/offline';

describe('Property 1: Offline and Sync Functionality Completeness', () => {
  let draftManager: DraftManager;
  let dbManager: IndexedDBManager;
  let conflictResolver: ConflictResolver;
  let queueManager: SyncQueueManager;

  beforeEach(() => {
    draftManager = new DraftManager();
    dbManager = IndexedDBManager.getInstance();
    conflictResolver = ConflictResolver.getInstance();
    queueManager = SyncQueueManager.getInstance();

    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
  });

  afterEach(() => {
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
  });

  /**
   * Property: For any valid note data, creating a note offline should save it to IndexedDB
   * with pending sync status
   * Validates: Requirements 5.1
   */
  it('should save any valid offline note to IndexedDB with pending status', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random note data
        fc.record({
          id: fc.string({ minLength: 1, maxLength: 50 }),
          title: fc.string({ minLength: 0, maxLength: 200 }),
          content: fc.string({ minLength: 0, maxLength: 5000 }),
          userId: fc.uuid(),
          tags: fc.array(fc.uuid(), { maxLength: 10 }),
          categoryId: fc.option(fc.uuid(), { nil: undefined }),
        }),
        async (noteData) => {
          // Create offline note
          const now = Date.now();
          const localNote: LocalNote = {
            ...noteData,
            createdAt: now,
            updatedAt: now,
            lastAccessedAt: now,
            syncStatus: 'pending',
            tempId: noteData.id,
          };

          // Save to IndexedDB
          await dbManager.saveNote(localNote);

          // Retrieve and verify
          const saved = await dbManager.getNote(noteData.id);

          expect(saved).toBeDefined();
          expect(saved?.id).toBe(noteData.id);
          expect(saved?.title).toBe(noteData.title);
          expect(saved?.content).toBe(noteData.content);
          expect(saved?.syncStatus).toBe('pending');
          expect(saved?.tempId).toBe(noteData.id);

          // Cleanup
          await dbManager.deleteNote(noteData.id);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: For any valid draft content, saving and retrieving should preserve all data
   * Validates: Requirements 5.5
   */
  it('should preserve any valid draft content through save and retrieve', () => {
    fc.assert(
      fc.property(
        fc.record({
          noteId: fc.string({ minLength: 1, maxLength: 50 }),
          title: fc.string({ minLength: 0, maxLength: 200 }),
          content: fc.string({ minLength: 0, maxLength: 5000 }),
        }),
        (data) => {
          const draftContent: DraftContent = {
            title: data.title,
            content: data.content,
            savedAt: Date.now(),
          };

          // Save draft
          draftManager.saveDraft(data.noteId, draftContent);

          // Retrieve draft
          const retrieved = draftManager.getDraft(data.noteId);

          // Verify
          expect(retrieved).toBeDefined();
          expect(retrieved?.title).toBe(data.title);
          expect(retrieved?.content).toBe(data.content);
          expect(retrieved?.savedAt).toBeDefined();

          // Cleanup
          draftManager.deleteDraft(data.noteId);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: For any note, editing offline should update the content and mark as pending
   * Validates: Requirements 5.2
   */
  it('should mark any edited note as pending sync', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.uuid(),
          originalTitle: fc.string({ minLength: 1, maxLength: 100 }),
          originalContent: fc.string({ minLength: 0, maxLength: 1000 }),
          newTitle: fc.string({ minLength: 1, maxLength: 100 }),
          newContent: fc.string({ minLength: 0, maxLength: 1000 }),
        }),
        async (data) => {
          // Create original note (synced)
          const originalNote: LocalNote = {
            id: data.id,
            title: data.originalTitle,
            content: data.originalContent,
            userId: 'user-1',
            createdAt: Date.now() - 10000,
            updatedAt: Date.now() - 10000,
            lastAccessedAt: Date.now() - 10000,
            syncStatus: 'synced',
          };

          await dbManager.saveNote(originalNote);

          // Edit note offline
          const editedNote: LocalNote = {
            ...originalNote,
            title: data.newTitle,
            content: data.newContent,
            updatedAt: Date.now(),
            syncStatus: 'pending',
          };

          await dbManager.saveNote(editedNote);

          // Verify
          const saved = await dbManager.getNote(data.id);
          expect(saved?.title).toBe(data.newTitle);
          expect(saved?.content).toBe(data.newContent);
          expect(saved?.syncStatus).toBe('pending');
          expect(saved?.createdAt).toBe(originalNote.createdAt);

          // Cleanup
          await dbManager.deleteNote(data.id);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: For any sync operation, adding to queue should preserve all operation data
   * Validates: Requirements 5.3
   */
  it('should preserve any sync operation data in queue', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.uuid(),
          type: fc.constantFrom('create', 'update', 'delete'),
          noteId: fc.uuid(),
          title: fc.string({ minLength: 0, maxLength: 100 }),
          content: fc.string({ minLength: 0, maxLength: 1000 }),
        }),
        async (data) => {
          const operation: SyncOperation = {
            id: data.id,
            type: data.type as 'create' | 'update' | 'delete',
            noteId: data.noteId,
            data: {
              title: data.title,
              content: data.content,
            },
            timestamp: Date.now(),
            retryCount: 0,
            status: 'pending',
          };

          // Enqueue operation
          await queueManager.enqueue(operation);

          // Retrieve operation
          const retrieved = await queueManager.getOperation(data.id);

          // Verify
          expect(retrieved).toBeDefined();
          expect(retrieved?.id).toBe(data.id);
          expect(retrieved?.type).toBe(data.type);
          expect(retrieved?.noteId).toBe(data.noteId);
          expect(retrieved?.data.title).toBe(data.title);
          expect(retrieved?.data.content).toBe(data.content);
          expect(retrieved?.status).toBe('pending');

          // Cleanup
          await queueManager.dequeue(data.id);
        }
      ),
      { numRuns: 50 }
    );
  });
});

describe('Property 7: Data Consistency', () => {
  let conflictResolver: ConflictResolver;
  let dbManager: IndexedDBManager;

  beforeEach(() => {
    conflictResolver = ConflictResolver.getInstance();
    dbManager = IndexedDBManager.getInstance();
  });

  /**
   * Property: For any local and remote note pair, conflict detection should be consistent
   * Validates: Requirements 5.4, 15.1
   */
  it('should consistently detect conflicts based on timestamps', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          localTitle: fc.string({ minLength: 1, maxLength: 100 }),
          remoteTitle: fc.string({ minLength: 1, maxLength: 100 }),
          localTimestamp: fc.integer({ min: 1000000000000, max: Date.now() }),
          remoteTimestamp: fc.integer({ min: 1000000000000, max: Date.now() }),
        }),
        (data) => {
          const localNote: LocalNote = {
            id: data.id,
            title: data.localTitle,
            content: 'Local content',
            userId: 'user-1',
            createdAt: data.localTimestamp - 10000,
            updatedAt: data.localTimestamp,
            lastAccessedAt: data.localTimestamp,
            syncStatus: 'pending',
          };

          const remoteNote: RemoteNote = {
            id: data.id,
            title: data.remoteTitle,
            content: 'Remote content',
            updatedAt: new Date(data.remoteTimestamp),
          };

          // Detect conflict
          const hasConflict = conflictResolver.detectConflict(localNote, remoteNote);

          // Conflict should exist if local is newer than remote
          const expectedConflict = data.localTimestamp > data.remoteTimestamp;
          expect(hasConflict).toBe(expectedConflict);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: For any conflict resolution strategy, the result should maintain data integrity
   * Validates: Requirements 5.4, 15.1
   */
  it('should maintain data integrity for any conflict resolution strategy', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.uuid(),
          localTitle: fc.string({ minLength: 1, maxLength: 100 }),
          localContent: fc.string({ minLength: 0, maxLength: 1000 }),
          remoteTitle: fc.string({ minLength: 1, maxLength: 100 }),
          remoteContent: fc.string({ minLength: 0, maxLength: 1000 }),
          strategy: fc.constantFrom('use-local', 'use-remote'),
        }),
        async (data) => {
          const localNote: LocalNote = {
            id: data.id,
            title: data.localTitle,
            content: data.localContent,
            userId: 'user-1',
            createdAt: Date.now() - 10000,
            updatedAt: Date.now(),
            lastAccessedAt: Date.now(),
            syncStatus: 'pending',
          };

          const remoteNote: RemoteNote = {
            id: data.id,
            title: data.remoteTitle,
            content: data.remoteContent,
            updatedAt: new Date(Date.now() - 5000),
          };

          // Resolve conflict
          const resolved = await conflictResolver.resolveConflict(
            localNote,
            remoteNote,
            data.strategy as 'use-local' | 'use-remote'
          );

          // Verify data integrity
          expect(resolved.id).toBe(data.id);
          expect(resolved.title).toBeDefined();
          expect(resolved.content).toBeDefined();
          expect(resolved.userId).toBeDefined();
          expect(resolved.createdAt).toBeDefined();
          expect(resolved.updatedAt).toBeDefined();

          // Verify strategy was applied correctly
          if (data.strategy === 'use-local') {
            expect(resolved.title).toBe(data.localTitle);
            expect(resolved.content).toBe(data.localContent);
            expect(resolved.syncStatus).toBe('pending');
          } else {
            expect(resolved.title).toBe(data.remoteTitle);
            expect(resolved.content).toBe(data.remoteContent);
            expect(resolved.syncStatus).toBe('synced');
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: For any note, the sync status should accurately reflect its state
   * Validates: Requirements 15.1
   */
  it('should maintain accurate sync status for any note state', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.uuid(),
          title: fc.string({ minLength: 1, maxLength: 100 }),
          content: fc.string({ minLength: 0, maxLength: 1000 }),
          syncStatus: fc.constantFrom('synced', 'pending', 'syncing', 'failed'),
        }),
        async (data) => {
          const note: LocalNote = {
            id: data.id,
            title: data.title,
            content: data.content,
            userId: 'user-1',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            lastAccessedAt: Date.now(),
            syncStatus: data.syncStatus as 'synced' | 'pending' | 'syncing' | 'failed',
          };

          // Save note
          await dbManager.saveNote(note);

          // Retrieve and verify
          const saved = await dbManager.getNote(data.id);
          expect(saved?.syncStatus).toBe(data.syncStatus);

          // Cleanup
          await dbManager.deleteNote(data.id);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: For any sequence of edits, the final state should reflect all changes
   * Validates: Requirements 15.1
   */
  it('should maintain consistency through multiple edits', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.uuid(),
          edits: fc.array(
            fc.record({
              title: fc.string({ minLength: 1, maxLength: 100 }),
              content: fc.string({ minLength: 0, maxLength: 500 }),
            }),
            { minLength: 1, maxLength: 10 }
          ),
        }),
        async (data) => {
          // Create initial note
          let currentNote: LocalNote = {
            id: data.id,
            title: 'Initial',
            content: 'Initial content',
            userId: 'user-1',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            lastAccessedAt: Date.now(),
            syncStatus: 'synced',
          };

          await dbManager.saveNote(currentNote);

          // Apply all edits
          for (const edit of data.edits) {
            currentNote = {
              ...currentNote,
              title: edit.title,
              content: edit.content,
              updatedAt: Date.now(),
              syncStatus: 'pending',
            };
            await dbManager.saveNote(currentNote);
          }

          // Verify final state
          const finalNote = await dbManager.getNote(data.id);
          const lastEdit = data.edits[data.edits.length - 1];

          expect(finalNote?.title).toBe(lastEdit.title);
          expect(finalNote?.content).toBe(lastEdit.content);
          expect(finalNote?.syncStatus).toBe('pending');

          // Cleanup
          await dbManager.deleteNote(data.id);
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * Property: For any draft, cleanup should remove only expired drafts
   * Validates: Requirements 5.5
   */
  it('should only cleanup expired drafts while preserving recent ones', () => {
    fc.assert(
      fc.property(
        fc.record({
          recentDrafts: fc.array(
            fc.record({
              noteId: fc.uuid(),
              title: fc.string({ minLength: 1, maxLength: 100 }),
              content: fc.string({ minLength: 0, maxLength: 500 }),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          expiryDays: fc.integer({ min: 1, max: 30 }),
        }),
        (data) => {
          const draftManager = new DraftManager();

          // Save recent drafts
          const recentIds: string[] = [];
          for (const draft of data.recentDrafts) {
            draftManager.saveDraft(draft.noteId, {
              title: draft.title,
              content: draft.content,
              savedAt: Date.now(),
            });
            recentIds.push(draft.noteId);
          }

          // Save expired draft
          const expiredId = 'expired-' + Date.now();
          if (typeof window !== 'undefined') {
            localStorage.setItem(
              `draft_${expiredId}`,
              JSON.stringify({
                title: 'Expired',
                content: 'Old',
                savedAt: Date.now() - (data.expiryDays + 1) * 24 * 60 * 60 * 1000,
              })
            );
          }

          // Cleanup
          draftManager.cleanupExpiredDrafts(data.expiryDays);

          // Verify recent drafts still exist
          for (const id of recentIds) {
            const draft = draftManager.getDraft(id);
            expect(draft).toBeDefined();
          }

          // Verify expired draft is removed
          const expiredDraft = draftManager.getDraft(expiredId);
          expect(expiredDraft).toBeNull();

          // Cleanup
          for (const id of recentIds) {
            draftManager.deleteDraft(id);
          }
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * Property: For any note with temporary ID, mapping to real ID should preserve all data
   * Validates: Requirements 5.1, 15.1
   */
  it('should preserve data when mapping temporary ID to real ID', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          tempId: fc.string({ minLength: 5, maxLength: 50 }).map(s => 'temp_' + s),
          realId: fc.uuid(),
          title: fc.string({ minLength: 1, maxLength: 100 }),
          content: fc.string({ minLength: 0, maxLength: 1000 }),
          tags: fc.array(fc.uuid(), { maxLength: 5 }),
        }),
        async (data) => {
          // Create note with temporary ID
          const tempNote: LocalNote = {
            id: data.tempId,
            title: data.title,
            content: data.content,
            tags: data.tags,
            userId: 'user-1',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            lastAccessedAt: Date.now(),
            syncStatus: 'pending',
            tempId: data.tempId,
          };

          await dbManager.saveNote(tempNote);

          // Simulate ID mapping after sync
          await dbManager.deleteNote(data.tempId);
          
          const realNote: LocalNote = {
            ...tempNote,
            id: data.realId,
            tempId: undefined,
            syncStatus: 'synced',
          };

          await dbManager.saveNote(realNote);

          // Verify data preservation
          const saved = await dbManager.getNote(data.realId);
          expect(saved?.title).toBe(data.title);
          expect(saved?.content).toBe(data.content);
          expect(saved?.tags).toEqual(data.tags);
          expect(saved?.syncStatus).toBe('synced');
          expect(saved?.tempId).toBeUndefined();

          // Cleanup
          await dbManager.deleteNote(data.realId);
        }
      ),
      { numRuns: 50 }
    );
  });
});
