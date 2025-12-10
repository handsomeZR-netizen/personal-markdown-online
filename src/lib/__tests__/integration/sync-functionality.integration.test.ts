/**
 * Sync Functionality Integration Tests
 * 
 * Tests automatic sync and conflict detection
 * Validates Requirements 5.3, 5.4
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SyncEngine } from '@/lib/offline/sync-engine';
import { SyncQueueManager } from '@/lib/offline/sync-queue-manager';
import { ConflictResolver, RemoteNote } from '@/lib/offline/conflict-resolver';
import { IndexedDBManager } from '@/lib/offline/indexeddb-manager';
import { LocalNote, SyncOperation } from '@/types/offline';

// Mock fetch for API calls
global.fetch = vi.fn();

describe('Sync Functionality Integration Tests', () => {
  let syncEngine: SyncEngine;
  let queueManager: SyncQueueManager;
  let conflictResolver: ConflictResolver;
  let dbManager: IndexedDBManager;

  beforeEach(() => {
    // Initialize managers
    syncEngine = SyncEngine.getInstance();
    queueManager = SyncQueueManager.getInstance();
    conflictResolver = ConflictResolver.getInstance();
    dbManager = IndexedDBManager.getInstance();

    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Stop any ongoing sync
    syncEngine.stopSync();
    vi.clearAllMocks();
  });

  describe('Automatic Sync (Requirement 5.3)', () => {
    it('should automatically sync pending operations when online', async () => {
      // Arrange
      const operation: SyncOperation = {
        id: 'op-1',
        type: 'create',
        noteId: 'temp-note-1',
        tempId: 'temp-note-1',
        data: {
          title: 'New Note',
          content: 'Content to sync',
        },
        timestamp: Date.now(),
        retryCount: 0,
        status: 'pending',
      };

      await queueManager.enqueue(operation);

      // Mock successful API response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'real-note-1', success: true }),
      });

      // Act
      const result = await syncEngine.startSync();

      // Assert
      expect(result.total).toBe(1);
      expect(result.success).toBe(1);
      expect(result.failed).toBe(0);
    });

    it('should sync multiple pending operations in order', async () => {
      // Arrange
      const operations: SyncOperation[] = [
        {
          id: 'op-1',
          type: 'create',
          noteId: 'temp-1',
          tempId: 'temp-1',
          data: { title: 'Note 1', content: 'Content 1' },
          timestamp: Date.now() - 3000,
          retryCount: 0,
          status: 'pending',
        },
        {
          id: 'op-2',
          type: 'update',
          noteId: 'note-2',
          data: { title: 'Updated Note 2', content: 'Updated content' },
          timestamp: Date.now() - 2000,
          retryCount: 0,
          status: 'pending',
        },
        {
          id: 'op-3',
          type: 'delete',
          noteId: 'note-3',
          data: {},
          timestamp: Date.now() - 1000,
          retryCount: 0,
          status: 'pending',
        },
      ];

      for (const op of operations) {
        await queueManager.enqueue(op);
      }

      // Mock API responses
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 'real-1', success: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

      // Act
      const result = await syncEngine.startSync();

      // Assert
      expect(result.total).toBe(3);
      expect(result.success).toBe(3);
      expect(result.failed).toBe(0);
    });

    it('should update sync status during sync process', async () => {
      // Arrange
      const operation: SyncOperation = {
        id: 'op-status',
        type: 'update',
        noteId: 'note-1',
        data: { title: 'Test', content: 'Test' },
        timestamp: Date.now(),
        retryCount: 0,
        status: 'pending',
      };

      await queueManager.enqueue(operation);

      // Mock API response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      // Act
      await syncEngine.syncOperation(operation);
      const queue = await queueManager.getQueue('pending');

      // Assert
      // Operation should be removed from queue after successful sync
      expect(queue.find(op => op.id === 'op-status')).toBeUndefined();
    });

    it('should handle sync progress callbacks', async () => {
      // Arrange
      const operations: SyncOperation[] = Array.from({ length: 5 }, (_, i) => ({
        id: `op-${i}`,
        type: 'create' as const,
        noteId: `temp-${i}`,
        tempId: `temp-${i}`,
        data: { title: `Note ${i}`, content: `Content ${i}` },
        timestamp: Date.now() - (5 - i) * 1000,
        retryCount: 0,
        status: 'pending' as const,
      }));

      for (const op of operations) {
        await queueManager.enqueue(op);
      }

      const progressUpdates: number[] = [];
      const unsubscribe = syncEngine.onProgress((progress) => {
        progressUpdates.push(progress.percentage);
      });

      // Mock API responses
      (global.fetch as any).mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({ id: 'real-id', success: true }),
        })
      );

      // Act
      await syncEngine.startSync();
      unsubscribe();

      // Assert
      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[progressUpdates.length - 1]).toBe(100);
    });

    it('should retry failed sync operations', async () => {
      // Arrange
      const operation: SyncOperation = {
        id: 'op-retry',
        type: 'update',
        noteId: 'note-1',
        data: { title: 'Test', content: 'Test' },
        timestamp: Date.now(),
        retryCount: 0,
        status: 'pending',
      };

      await queueManager.enqueue(operation);

      // Mock API failure then success
      (global.fetch as any)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

      // Act
      const firstAttempt = await syncEngine.syncOperation(operation);
      
      // Update retry count and reset status
      const updatedOp = await queueManager.getOperation(operation.id);
      if (updatedOp) {
        await queueManager.resetToPending(updatedOp.id);
        const secondAttempt = await syncEngine.syncOperation(updatedOp);

        // Assert
        expect(firstAttempt).toBe(false);
        expect(secondAttempt).toBe(true);
      }
    });
  });

  describe('Conflict Detection (Requirement 5.4)', () => {
    it('should detect conflict when local and remote versions differ', () => {
      // Arrange
      const localNote: LocalNote = {
        id: 'note-1',
        title: 'Local Version',
        content: 'Local content',
        userId: 'user-1',
        createdAt: Date.now() - 10000,
        updatedAt: Date.now(),
        lastAccessedAt: Date.now(),
        syncStatus: 'pending',
      };

      const remoteNote: RemoteNote = {
        id: 'note-1',
        title: 'Remote Version',
        content: 'Remote content',
        updatedAt: new Date(Date.now() - 5000),
      };

      // Act
      const hasConflict = conflictResolver.detectConflict(localNote, remoteNote);

      // Assert
      expect(hasConflict).toBe(true);
    });

    it('should not detect conflict when local is older than remote', () => {
      // Arrange
      const localNote: LocalNote = {
        id: 'note-2',
        title: 'Old Local',
        content: 'Old content',
        userId: 'user-1',
        createdAt: Date.now() - 10000,
        updatedAt: Date.now() - 5000,
        lastAccessedAt: Date.now(),
        syncStatus: 'synced',
      };

      const remoteNote: RemoteNote = {
        id: 'note-2',
        title: 'New Remote',
        content: 'New content',
        updatedAt: new Date(Date.now()),
      };

      // Act
      const hasConflict = conflictResolver.detectConflict(localNote, remoteNote);

      // Assert
      expect(hasConflict).toBe(false);
    });

    it('should identify conflicting fields', () => {
      // Arrange
      const localNote: LocalNote = {
        id: 'note-3',
        title: 'Local Title',
        content: 'Local content',
        summary: 'Local summary',
        userId: 'user-1',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        lastAccessedAt: Date.now(),
        syncStatus: 'pending',
      };

      const remoteNote: RemoteNote = {
        id: 'note-3',
        title: 'Remote Title',
        content: 'Local content', // Same
        summary: 'Remote summary',
        updatedAt: new Date(Date.now() - 1000),
      };

      // Act
      const conflictInfo = conflictResolver.getConflictInfo(localNote, remoteNote);

      // Assert
      expect(conflictInfo.conflictFields).toContain('title');
      expect(conflictInfo.conflictFields).toContain('summary');
      expect(conflictInfo.conflictFields).not.toContain('content');
    });

    it('should resolve conflict using local version', async () => {
      // Arrange
      const localNote: LocalNote = {
        id: 'note-4',
        title: 'Local Title',
        content: 'Local content',
        userId: 'user-1',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        lastAccessedAt: Date.now(),
        syncStatus: 'pending',
      };

      const remoteNote: RemoteNote = {
        id: 'note-4',
        title: 'Remote Title',
        content: 'Remote content',
        updatedAt: new Date(Date.now() - 1000),
      };

      // Act
      const resolved = await conflictResolver.resolveConflict(
        localNote,
        remoteNote,
        'use-local'
      );

      // Assert
      expect(resolved.title).toBe('Local Title');
      expect(resolved.content).toBe('Local content');
      expect(resolved.syncStatus).toBe('pending');
    });

    it('should resolve conflict using remote version', async () => {
      // Arrange
      const localNote: LocalNote = {
        id: 'note-5',
        title: 'Local Title',
        content: 'Local content',
        userId: 'user-1',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        lastAccessedAt: Date.now(),
        syncStatus: 'pending',
      };

      const remoteNote: RemoteNote = {
        id: 'note-5',
        title: 'Remote Title',
        content: 'Remote content',
        updatedAt: new Date(Date.now() - 1000),
      };

      // Act
      const resolved = await conflictResolver.resolveConflict(
        localNote,
        remoteNote,
        'use-remote'
      );

      // Assert
      expect(resolved.title).toBe('Remote Title');
      expect(resolved.content).toBe('Remote content');
      expect(resolved.syncStatus).toBe('synced');
    });

    it('should resolve conflict with manual merge', async () => {
      // Arrange
      const localNote: LocalNote = {
        id: 'note-6',
        title: 'Local Title',
        content: 'Local content',
        userId: 'user-1',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        lastAccessedAt: Date.now(),
        syncStatus: 'pending',
      };

      const remoteNote: RemoteNote = {
        id: 'note-6',
        title: 'Remote Title',
        content: 'Remote content',
        updatedAt: new Date(Date.now() - 1000),
      };

      const mergedData = {
        title: 'Merged Title',
        content: 'Local content\n\nRemote content',
      };

      // Act
      const resolved = await conflictResolver.resolveConflict(
        localNote,
        remoteNote,
        'manual-merge',
        mergedData
      );

      // Assert
      expect(resolved.title).toBe('Merged Title');
      expect(resolved.content).toBe('Local content\n\nRemote content');
      expect(resolved.syncStatus).toBe('pending');
    });

    it('should get differences between local and remote', () => {
      // Arrange
      const localNote: LocalNote = {
        id: 'note-7',
        title: 'Same Title',
        content: 'Local content',
        summary: 'Local summary',
        tags: ['tag1', 'tag2'],
        userId: 'user-1',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        lastAccessedAt: Date.now(),
        syncStatus: 'pending',
      };

      const remoteNote: RemoteNote = {
        id: 'note-7',
        title: 'Same Title',
        content: 'Remote content',
        summary: 'Remote summary',
        tags: [{ id: 'tag1', name: 'Tag 1' }, { id: 'tag3', name: 'Tag 3' }],
        updatedAt: new Date(Date.now() - 1000),
      };

      // Act
      const differences = conflictResolver.getDifferences(localNote, remoteNote);

      // Assert
      expect(differences.title).toBeUndefined(); // Same
      expect(differences.content).toBeDefined();
      expect(differences.summary).toBeDefined();
      expect(differences.tags).toBeDefined();
      expect(differences.content.local).toBe('Local content');
      expect(differences.content.remote).toBe('Remote content');
    });
  });

  describe('Sync Queue Management', () => {
    it('should maintain FIFO order in sync queue', async () => {
      // Arrange
      const operations: SyncOperation[] = [
        {
          id: 'op-1',
          type: 'create',
          noteId: 'note-1',
          data: {},
          timestamp: Date.now() - 3000,
          retryCount: 0,
          status: 'pending',
        },
        {
          id: 'op-2',
          type: 'update',
          noteId: 'note-2',
          data: {},
          timestamp: Date.now() - 2000,
          retryCount: 0,
          status: 'pending',
        },
        {
          id: 'op-3',
          type: 'delete',
          noteId: 'note-3',
          data: {},
          timestamp: Date.now() - 1000,
          retryCount: 0,
          status: 'pending',
        },
      ];

      // Act
      for (const op of operations) {
        await queueManager.enqueue(op);
      }

      const queue = await queueManager.getQueue('pending');

      // Assert
      expect(queue[0].id).toBe('op-1');
      expect(queue[1].id).toBe('op-2');
      expect(queue[2].id).toBe('op-3');
    });

    it('should remove operation from queue after successful sync', async () => {
      // Arrange
      const operation: SyncOperation = {
        id: 'op-remove',
        type: 'create',
        noteId: 'note-1',
        data: { title: 'Test', content: 'Test' },
        timestamp: Date.now(),
        retryCount: 0,
        status: 'pending',
      };

      await queueManager.enqueue(operation);

      // Act
      await queueManager.dequeue(operation.id);
      const queue = await queueManager.getQueue('pending');

      // Assert
      expect(queue.find(op => op.id === 'op-remove')).toBeUndefined();
    });

    it('should update operation status', async () => {
      // Arrange
      const operation: SyncOperation = {
        id: 'op-status-update',
        type: 'update',
        noteId: 'note-1',
        data: {},
        timestamp: Date.now(),
        retryCount: 0,
        status: 'pending',
      };

      await queueManager.enqueue(operation);

      // Act
      await queueManager.updateStatus('op-status-update', 'syncing');
      const updated = await queueManager.getOperation('op-status-update');

      // Assert
      expect(updated?.status).toBe('syncing');
    });

    it('should handle failed operations with error message', async () => {
      // Arrange
      const operation: SyncOperation = {
        id: 'op-failed',
        type: 'update',
        noteId: 'note-1',
        data: {},
        timestamp: Date.now(),
        retryCount: 0,
        status: 'pending',
      };

      await queueManager.enqueue(operation);

      // Act
      await queueManager.updateStatus('op-failed', 'failed', 'Network error');
      const failed = await queueManager.getOperation('op-failed');

      // Assert
      expect(failed?.status).toBe('failed');
      expect(failed?.error).toBe('Network error');
    });
  });

  describe('Batch Sync', () => {
    it('should use batch sync for large number of operations', async () => {
      // Arrange
      const operations: SyncOperation[] = Array.from({ length: 15 }, (_, i) => ({
        id: `batch-op-${i}`,
        type: 'create' as const,
        noteId: `temp-${i}`,
        tempId: `temp-${i}`,
        data: { title: `Note ${i}`, content: `Content ${i}` },
        timestamp: Date.now() - (15 - i) * 1000,
        retryCount: 0,
        status: 'pending' as const,
      }));

      for (const op of operations) {
        await queueManager.enqueue(op);
      }

      // Mock batch API response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: operations.map((op, i) => ({
            success: true,
            noteId: `real-${i}`,
          })),
          summary: { total: 15, success: 15, failed: 0 },
        }),
      });

      // Act
      const result = await syncEngine.startSync();

      // Assert
      expect(result.total).toBe(15);
      expect(result.success).toBe(15);
      expect(result.failed).toBe(0);
    });
  });

  describe('Network Status Handling', () => {
    it('should not sync when offline', async () => {
      // Arrange
      const operation: SyncOperation = {
        id: 'op-offline',
        type: 'create',
        noteId: 'temp-1',
        data: { title: 'Test', content: 'Test' },
        timestamp: Date.now(),
        retryCount: 0,
        status: 'pending',
      };

      await queueManager.enqueue(operation);

      // Mock network error
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      // Act
      const success = await syncEngine.syncOperation(operation);

      // Assert
      expect(success).toBe(false);
    });

    it('should queue operations for later sync when offline', async () => {
      // Arrange
      const operations: SyncOperation[] = [
        {
          id: 'offline-op-1',
          type: 'create',
          noteId: 'temp-1',
          data: { title: 'Offline 1', content: 'Content 1' },
          timestamp: Date.now(),
          retryCount: 0,
          status: 'pending',
        },
        {
          id: 'offline-op-2',
          type: 'update',
          noteId: 'note-2',
          data: { title: 'Offline 2', content: 'Content 2' },
          timestamp: Date.now(),
          retryCount: 0,
          status: 'pending',
        },
      ];

      // Act
      for (const op of operations) {
        await queueManager.enqueue(op);
      }

      const queue = await queueManager.getQueue('pending');

      // Assert
      expect(queue.length).toBe(2);
      expect(queue.map(op => op.id)).toContain('offline-op-1');
      expect(queue.map(op => op.id)).toContain('offline-op-2');
    });
  });
});
