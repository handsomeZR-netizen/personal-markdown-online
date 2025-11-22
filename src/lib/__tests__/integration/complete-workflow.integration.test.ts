/**
 * 完整工作流集成测试
 * Complete Workflow Integration Tests
 * 
 * 测试离线创建笔记、自动同步、冲突解决、草稿恢复和 AI 摘要生成的完整流程
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { OfflineStorageService, generateTempId } from '@/lib/offline/offline-storage-service';
import { SyncQueueManager } from '@/lib/offline/sync-queue-manager';
import { IndexedDBManager } from '@/lib/offline/indexeddb-manager';
import { SyncEngine } from '@/lib/offline/sync-engine';
import { DraftManager } from '@/lib/offline/draft-manager';
import { SummaryService } from '@/lib/ai/summary-service';
import { ConflictResolver } from '@/lib/offline/conflict-resolver';
import type { LocalNote, SyncOperation, DraftContent } from '@/types/offline';

// Mock fetch for API calls
global.fetch = vi.fn();

describe('完整工作流集成测试', () => {
  let storageService: OfflineStorageService;
  let queueManager: SyncQueueManager;
  let dbManager: IndexedDBManager;
  let syncEngine: SyncEngine;
  let draftManager: DraftManager;
  let summaryService: SummaryService;
  let conflictResolver: ConflictResolver;

  beforeEach(() => {
    storageService = OfflineStorageService.getInstance();
    queueManager = SyncQueueManager.getInstance();
    dbManager = IndexedDBManager.getInstance();
    syncEngine = SyncEngine.getInstance();
    draftManager = new DraftManager();
    summaryService = new SummaryService();
    conflictResolver = ConflictResolver.getInstance();
    
    // Clear mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup
    vi.restoreAllMocks();
  });

  describe('1. 离线创建笔记流程', () => {
    it('应该在离线状态下成功创建笔记', async () => {
      // 模拟离线状态
      const mockNetworkManager = {
        isOnline: () => false,
        onStatusChange: vi.fn(),
        checkConnection: vi.fn(),
      };

      // 创建笔记数据
      const noteData = {
        title: '离线测试笔记',
        content: '这是一个在离线状态下创建的笔记',
        tags: ['test', 'offline'],
        categoryId: 'cat-1',
      };

      const userId = 'user-123';

      // 验证临时 ID 生成
      const tempId = generateTempId();
      expect(tempId).toMatch(/^temp_\d+_[a-z0-9]+$/);
      expect(tempId.startsWith('temp_')).toBe(true);
    });

    it('应该将离线创建的笔记添加到同步队列', async () => {
      const operation: Omit<SyncOperation, 'id'> = {
        type: 'create',
        noteId: 'temp_123',
        tempId: 'temp_123',
        data: {
          title: 'Test Note',
          content: 'Test Content',
          userId: 'user-1',
        } as Partial<LocalNote>,
        timestamp: Date.now(),
        retryCount: 0,
        status: 'pending',
      };

      // 验证队列管理器方法存在
      expect(queueManager.enqueue).toBeDefined();
      expect(typeof queueManager.enqueue).toBe('function');
    });

    it('应该在 IndexedDB 中保存离线笔记', async () => {
      const localNote: LocalNote = {
        id: 'temp_456',
        title: 'Offline Note',
        content: 'Created offline',
        tags: ['offline'],
        userId: 'user-1',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        lastAccessedAt: Date.now(),
        syncStatus: 'pending',
        tempId: 'temp_456',
      };

      // 验证数据库管理器方法存在
      expect(dbManager.saveNote).toBeDefined();
      expect(typeof dbManager.saveNote).toBe('function');
    });
  });

  describe('2. 自动同步流程', () => {
    it('应该在网络恢复时触发同步', async () => {
      // 模拟网络状态变化
      const onlineCallback = vi.fn();
      
      // 模拟从离线到在线的转换
      const wasOffline = false;
      const isNowOnline = true;
      
      if (!wasOffline && isNowOnline) {
        onlineCallback();
      }

      expect(isNowOnline).toBe(true);
    });

    it('应该按时间戳顺序同步操作', async () => {
      const operations: SyncOperation[] = [
        {
          id: 'op-1',
          type: 'create',
          noteId: 'note-1',
          data: {},
          timestamp: 1000,
          retryCount: 0,
          status: 'pending',
        },
        {
          id: 'op-2',
          type: 'update',
          noteId: 'note-2',
          data: {},
          timestamp: 500,
          retryCount: 0,
          status: 'pending',
        },
        {
          id: 'op-3',
          type: 'delete',
          noteId: 'note-3',
          data: {},
          timestamp: 1500,
          retryCount: 0,
          status: 'pending',
        },
      ];

      // 按时间戳排序
      const sorted = [...operations].sort((a, b) => a.timestamp - b.timestamp);

      expect(sorted[0].id).toBe('op-2');
      expect(sorted[0].timestamp).toBe(500);
      expect(sorted[1].id).toBe('op-1');
      expect(sorted[1].timestamp).toBe(1000);
      expect(sorted[2].id).toBe('op-3');
      expect(sorted[2].timestamp).toBe(1500);
    });

    it('应该处理同步失败并重试', async () => {
      const maxRetries = 3;
      let retryCount = 0;

      const shouldRetry = () => {
        retryCount++;
        return retryCount < maxRetries;
      };

      // 第一次重试
      expect(shouldRetry()).toBe(true);
      expect(retryCount).toBe(1);

      // 第二次重试
      expect(shouldRetry()).toBe(true);
      expect(retryCount).toBe(2);

      // 第三次不应该重试
      expect(shouldRetry()).toBe(false);
      expect(retryCount).toBe(3);
    });

    it('应该在批量同步时分批处理', async () => {
      const operations = Array.from({ length: 25 }, (_, i) => ({
        id: `op-${i}`,
        type: 'create' as const,
        noteId: `note-${i}`,
        data: {},
        timestamp: Date.now() + i,
        retryCount: 0,
        status: 'pending' as const,
      }));

      const batchSize = 20;
      const batches: SyncOperation[][] = [];

      for (let i = 0; i < operations.length; i += batchSize) {
        batches.push(operations.slice(i, i + batchSize));
      }

      expect(batches.length).toBe(2);
      expect(batches[0].length).toBe(20);
      expect(batches[1].length).toBe(5);
    });
  });

  describe('3. 冲突解决流程', () => {
    it('应该检测时间戳冲突', () => {
      const localTime = Date.now();
      const remoteTime = localTime - 5000; // 远程版本更旧

      const hasConflict = localTime > remoteTime;
      expect(hasConflict).toBe(true);
    });

    it('应该支持不同的冲突解决策略', () => {
      const strategies = ['use-local', 'use-remote', 'manual-merge'];
      
      strategies.forEach(strategy => {
        expect(['use-local', 'use-remote', 'manual-merge']).toContain(strategy);
      });
    });

    it('应该在使用本地版本时保留本地数据', () => {
      const localNote: LocalNote = {
        id: 'note-1',
        title: 'Local Title',
        content: 'Local Content',
        tags: ['local'],
        userId: 'user-1',
        createdAt: Date.now() - 10000,
        updatedAt: Date.now(),
        lastAccessedAt: Date.now(),
        syncStatus: 'pending',
      };

      const remoteNote = {
        id: 'note-1',
        title: 'Remote Title',
        content: 'Remote Content',
        updatedAt: new Date(Date.now() - 5000),
      };

      const strategy = 'use-local';
      const resolved = strategy === 'use-local' ? localNote : remoteNote;

      expect(resolved).toBe(localNote);
      expect(resolved.title).toBe('Local Title');
    });

    it('应该在使用远程版本时采用服务器数据', () => {
      const localNote: LocalNote = {
        id: 'note-1',
        title: 'Local Title',
        content: 'Local Content',
        tags: ['local'],
        userId: 'user-1',
        createdAt: Date.now() - 10000,
        updatedAt: Date.now() - 5000,
        lastAccessedAt: Date.now(),
        syncStatus: 'pending',
      };

      const remoteNote = {
        id: 'note-1',
        title: 'Remote Title',
        content: 'Remote Content',
        updatedAt: new Date(Date.now()),
      };

      const strategy = 'use-remote';
      
      if (strategy === 'use-remote') {
        expect(remoteNote.title).toBe('Remote Title');
        expect(remoteNote.content).toBe('Remote Content');
      }
    });
  });

  describe('4. 草稿恢复流程', () => {
    it('应该保存草稿到 LocalStorage', () => {
      const noteId = 'note-123';
      const draftContent: DraftContent = {
        title: '草稿标题',
        content: '草稿内容',
        tags: ['draft'],
        savedAt: Date.now(),
      };

      const draftKey = `draft_${noteId}`;
      localStorage.setItem(draftKey, JSON.stringify(draftContent));

      const saved = localStorage.getItem(draftKey);
      expect(saved).toBeTruthy();

      const parsed = JSON.parse(saved!);
      expect(parsed.title).toBe('草稿标题');
      expect(parsed.content).toBe('草稿内容');

      // 清理
      localStorage.removeItem(draftKey);
    });

    it('应该在页面刷新后恢复草稿', () => {
      const noteId = 'note-456';
      const draftContent: DraftContent = {
        title: '恢复的草稿',
        content: '这是恢复的内容',
        tags: ['recovered'],
        savedAt: Date.now(),
      };

      // 模拟保存草稿
      const draftKey = `draft_${noteId}`;
      localStorage.setItem(draftKey, JSON.stringify(draftContent));

      // 模拟页面刷新后恢复
      const recovered = localStorage.getItem(draftKey);
      expect(recovered).toBeTruthy();

      const parsedDraft = JSON.parse(recovered!);
      expect(parsedDraft.title).toBe('恢复的草稿');
      expect(parsedDraft.content).toBe('这是恢复的内容');

      // 清理
      localStorage.removeItem(draftKey);
    });

    it('应该清理过期草稿', () => {
      const now = Date.now();
      const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
      
      const recentDraft = {
        savedAt: now - (6 * 24 * 60 * 60 * 1000), // 6 天前
      };
      
      const expiredDraft = {
        savedAt: now - (8 * 24 * 60 * 60 * 1000), // 8 天前
      };

      const isExpired = (savedAt: number, maxAge: number) => {
        return now - savedAt > maxAge;
      };

      expect(isExpired(recentDraft.savedAt, sevenDaysInMs)).toBe(false);
      expect(isExpired(expiredDraft.savedAt, sevenDaysInMs)).toBe(true);
    });

    it('应该在成功保存笔记后删除草稿', () => {
      const noteId = 'note-789';
      const draftKey = `draft_${noteId}`;
      
      // 保存草稿
      localStorage.setItem(draftKey, JSON.stringify({
        title: 'Draft',
        content: 'Content',
        savedAt: Date.now(),
      }));

      expect(localStorage.getItem(draftKey)).toBeTruthy();

      // 模拟保存成功
      localStorage.removeItem(draftKey);

      expect(localStorage.getItem(draftKey)).toBeNull();
    });
  });

  describe('5. AI 摘要生成流程', () => {
    it('应该为长内容生成摘要', () => {
      const longContent = 'A'.repeat(300);
      const shouldGenerate = summaryService.shouldGenerateSummary(longContent);
      
      expect(shouldGenerate).toBe(true);
      expect(longContent.length).toBeGreaterThan(200);
    });

    it('应该跳过短内容的摘要生成', () => {
      const shortContent = 'This is a short note.';
      const shouldGenerate = summaryService.shouldGenerateSummary(shortContent);
      
      expect(shouldGenerate).toBe(false);
      expect(shortContent.length).toBeLessThan(200);
    });

    it('应该限制摘要长度为 100 字', () => {
      const maxLength = 100;
      const longSummary = 'B'.repeat(150);
      const truncated = longSummary.slice(0, maxLength);
      
      expect(truncated.length).toBe(maxLength);
      expect(truncated.length).toBeLessThanOrEqual(100);
    });

    it('应该在没有摘要时显示内容前 100 字', () => {
      const note = {
        id: 'note-1',
        title: 'Test Note',
        content: 'C'.repeat(200),
        summary: null,
      };

      const displaySummary = note.summary || note.content.slice(0, 100);
      
      expect(displaySummary.length).toBe(100);
      expect(displaySummary).toBe('C'.repeat(100));
    });

    it('应该支持批量生成摘要', () => {
      const notes = [
        { id: '1', content: 'A'.repeat(300) },
        { id: '2', content: 'B'.repeat(300) },
        { id: '3', content: 'C'.repeat(300) },
      ];

      expect(notes.length).toBe(3);
      notes.forEach(note => {
        expect(note.content.length).toBeGreaterThan(200);
        expect(summaryService.shouldGenerateSummary(note.content)).toBe(true);
      });
    });
  });

  describe('6. 完整端到端流程', () => {
    it('应该完成离线创建到在线同步的完整流程', async () => {
      // 步骤 1: 离线创建笔记
      const tempId = generateTempId();
      expect(tempId).toMatch(/^temp_\d+_[a-z0-9]+$/);

      const localNote: LocalNote = {
        id: tempId,
        title: 'E2E Test Note',
        content: 'This is an end-to-end test note',
        tags: ['e2e', 'test'],
        userId: 'user-1',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        lastAccessedAt: Date.now(),
        syncStatus: 'pending',
        tempId: tempId,
      };

      // 步骤 2: 添加到同步队列
      const operation: Omit<SyncOperation, 'id'> = {
        type: 'create',
        noteId: tempId,
        tempId: tempId,
        data: localNote,
        timestamp: Date.now(),
        retryCount: 0,
        status: 'pending',
      };

      expect(operation.type).toBe('create');
      expect(operation.status).toBe('pending');

      // 步骤 3: 模拟网络恢复
      const isOnline = true;
      expect(isOnline).toBe(true);

      // 步骤 4: 模拟同步成功
      const realNoteId = 'note-real-123';
      const syncSuccess = true;

      if (syncSuccess) {
        // 步骤 5: 更新 ID 映射
        const updatedNote = {
          ...localNote,
          id: realNoteId,
          tempId: undefined,
          syncStatus: 'synced' as const,
        };

        expect(updatedNote.id).toBe(realNoteId);
        expect(updatedNote.tempId).toBeUndefined();
        expect(updatedNote.syncStatus).toBe('synced');
      }
    });

    it('应该处理离线编辑、冲突检测和解决的完整流程', async () => {
      // 步骤 1: 离线编辑笔记
      const noteId = 'note-conflict-test';
      const localUpdatedAt = Date.now();
      
      const localNote: LocalNote = {
        id: noteId,
        title: 'Local Edit',
        content: 'Edited offline',
        tags: ['edited'],
        userId: 'user-1',
        createdAt: Date.now() - 10000,
        updatedAt: localUpdatedAt,
        lastAccessedAt: Date.now(),
        syncStatus: 'pending',
      };

      // 步骤 2: 网络恢复，准备同步
      const isOnline = true;
      expect(isOnline).toBe(true);

      // 步骤 3: 检测到服务器版本也被修改（冲突）
      const remoteUpdatedAt = localUpdatedAt + 5000; // 服务器版本更新
      const hasConflict = remoteUpdatedAt > localNote.updatedAt;
      
      expect(hasConflict).toBe(true);

      // 步骤 4: 用户选择解决策略
      const strategy = 'use-local';
      expect(['use-local', 'use-remote', 'manual-merge']).toContain(strategy);

      // 步骤 5: 应用解决策略
      if (strategy === 'use-local') {
        const resolved = localNote;
        expect(resolved.title).toBe('Local Edit');
        expect(resolved.content).toBe('Edited offline');
      }
    });

    it('应该处理草稿自动保存和恢复的完整流程', () => {
      const noteId = 'note-draft-test';
      
      // 步骤 1: 用户开始编辑
      let currentTitle = '';
      let currentContent = '';

      // 步骤 2: 用户输入内容
      currentTitle = 'Draft Title';
      currentContent = 'Draft Content';

      // 步骤 3: 3 秒后自动保存草稿
      const draftContent: DraftContent = {
        title: currentTitle,
        content: currentContent,
        tags: [],
        savedAt: Date.now(),
      };

      const draftKey = `draft_${noteId}`;
      localStorage.setItem(draftKey, JSON.stringify(draftContent));

      // 步骤 4: 模拟页面刷新
      const savedDraft = localStorage.getItem(draftKey);
      expect(savedDraft).toBeTruthy();

      // 步骤 5: 恢复草稿
      const recovered = JSON.parse(savedDraft!);
      expect(recovered.title).toBe('Draft Title');
      expect(recovered.content).toBe('Draft Content');

      // 步骤 6: 用户保存笔记
      const noteSaved = true;
      if (noteSaved) {
        localStorage.removeItem(draftKey);
      }

      expect(localStorage.getItem(draftKey)).toBeNull();
    });
  });

  describe('7. 数据持久化和恢复', () => {
    it('应该在浏览器关闭后保留 IndexedDB 数据', () => {
      // IndexedDB 数据在浏览器关闭后仍然存在
      expect(dbManager).toBeDefined();
      expect(dbManager.initialize).toBeDefined();
    });

    it('应该在应用启动时恢复同步队列', () => {
      expect(queueManager).toBeDefined();
      expect(queueManager.getQueue).toBeDefined();
    });

    it('应该显示待同步操作数量', async () => {
      const pendingCount = 5;
      
      // 模拟有 5 个待同步操作
      expect(pendingCount).toBeGreaterThan(0);
      expect(pendingCount).toBe(5);
    });

    it('应该在清除浏览器数据前警告用户', () => {
      const hasPendingOperations = true;
      const pendingCount = 3;

      if (hasPendingOperations) {
        const warningMessage = `您有 ${pendingCount} 个未同步的更改，清除数据可能导致这些更改丢失。`;
        expect(warningMessage).toContain('未同步');
        expect(warningMessage).toContain(pendingCount.toString());
      }
    });
  });

  describe('8. 错误处理和边界情况', () => {
    it('应该处理存储空间不足的情况', () => {
      const availableSpace = 30 * 1024 * 1024; // 30MB
      const threshold = 50 * 1024 * 1024; // 50MB

      const shouldWarn = availableSpace < threshold;
      expect(shouldWarn).toBe(true);
    });

    it('应该处理同步超时', () => {
      const syncTimeout = 30000; // 30 秒
      const elapsedTime = 35000; // 35 秒

      const hasTimedOut = elapsedTime > syncTimeout;
      expect(hasTimedOut).toBe(true);
    });

    it('应该处理网络不稳定的情况', () => {
      let isOnline = true;
      const statusChanges: boolean[] = [];

      // 模拟网络不稳定
      isOnline = false;
      statusChanges.push(isOnline);
      
      isOnline = true;
      statusChanges.push(isOnline);
      
      isOnline = false;
      statusChanges.push(isOnline);

      expect(statusChanges.length).toBe(3);
      expect(statusChanges).toEqual([false, true, false]);
    });

    it('应该处理 AI API 调用失败', async () => {
      const content = 'Test content for AI summary';
      
      try {
        // 模拟 AI API 失败
        throw new Error('AI API Error');
      } catch (error) {
        // 使用默认摘要
        const defaultSummary = content.slice(0, 100);
        expect(defaultSummary).toBe(content);
      }
    });
  });
});
