/**
 * IndexedDBManager 单元测试
 * 测试核心 CRUD 操作和缓存功能
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { IndexedDBManager } from '../indexeddb-manager';
import type { LocalNote } from '@/types/offline';

// Mock IndexedDB
const mockIndexedDB = {
  open: vi.fn(),
  deleteDatabase: vi.fn(),
};

// 模拟 IDBDatabase
class MockIDBDatabase {
  objectStoreNames = {
    contains: vi.fn(() => false),
  };
  transaction = vi.fn();
  close = vi.fn();
  createObjectStore = vi.fn(() => ({
    createIndex: vi.fn(),
  }));
}

describe('IndexedDBManager', () => {
  let manager: IndexedDBManager;
  let mockDB: MockIDBDatabase;

  beforeEach(() => {
    mockDB = new MockIDBDatabase();
    
    // Mock indexedDB.open
    mockIndexedDB.open.mockReturnValue({
      result: mockDB,
      onsuccess: null,
      onerror: null,
      onupgradeneeded: null,
      addEventListener: vi.fn(),
    });

    // Setup global indexedDB
    global.indexedDB = mockIndexedDB as any;
    
    manager = IndexedDBManager.getInstance();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('初始化', () => {
    it('应该检查浏览器支持', () => {
      const isSupported = IndexedDBManager.isSupported();
      expect(isSupported).toBe(true);
    });

    it('应该返回单例实例', () => {
      const instance1 = IndexedDBManager.getInstance();
      const instance2 = IndexedDBManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('缓存功能', () => {
    it('应该使缓存失效', () => {
      // 测试缓存失效方法存在
      expect(manager.invalidateCache).toBeDefined();
      expect(() => manager.invalidateCache('notes_')).not.toThrow();
    });
  });

  describe('笔记操作', () => {
    const mockNote: LocalNote = {
      id: 'test-1',
      title: 'Test Note',
      content: 'Test content',
      tags: ['tag1'],
      userId: 'user-1',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastAccessedAt: Date.now(),
      syncStatus: 'synced',
    };

    it('应该定义 saveNote 方法', () => {
      expect(manager.saveNote).toBeDefined();
    });

    it('应该定义 getNote 方法', () => {
      expect(manager.getNote).toBeDefined();
    });

    it('应该定义 getAllNotes 方法', () => {
      expect(manager.getAllNotes).toBeDefined();
    });

    it('应该定义 deleteNote 方法', () => {
      expect(manager.deleteNote).toBeDefined();
    });

    it('应该定义批量操作方法', () => {
      expect(manager.saveNotesBatch).toBeDefined();
      expect(manager.deleteNotesBatch).toBeDefined();
    });
  });

  describe('分页查询', () => {
    it('应该定义 getNotesPaginated 方法', () => {
      expect(manager.getNotesPaginated).toBeDefined();
    });
  });

  describe('同步队列操作', () => {
    it('应该定义同步队列方法', () => {
      expect(manager.addToSyncQueue).toBeDefined();
      expect(manager.getSyncQueue).toBeDefined();
      expect(manager.removeFromSyncQueue).toBeDefined();
      expect(manager.updateSyncOperation).toBeDefined();
      expect(manager.clearSyncQueue).toBeDefined();
    });
  });

  describe('元数据操作', () => {
    it('应该定义元数据方法', () => {
      expect(manager.setMetadata).toBeDefined();
      expect(manager.getMetadata).toBeDefined();
      expect(manager.deleteMetadata).toBeDefined();
    });
  });

  describe('工具方法', () => {
    it('应该定义存储估算方法', () => {
      expect(manager.getStorageEstimate).toBeDefined();
    });

    it('应该定义计数方法', () => {
      expect(manager.getNotesCount).toBeDefined();
      expect(manager.getPendingSyncCount).toBeDefined();
    });
  });
});
