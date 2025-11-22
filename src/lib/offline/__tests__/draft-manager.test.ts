/**
 * DraftManager 单元测试
 * 测试草稿管理功能
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DraftManager } from '../draft-manager';
import type { DraftContent } from '@/types/offline';

describe('DraftManager', () => {
  let manager: DraftManager;

  beforeEach(() => {
    manager = new DraftManager();
    // 清空 localStorage
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('初始化', () => {
    it('应该创建 DraftManager 实例', () => {
      const instance = new DraftManager();
      expect(instance).toBeInstanceOf(DraftManager);
    });
  });

  describe('草稿操作', () => {
    const mockDraft: DraftContent = {
      title: 'Draft Title',
      content: 'Draft content',
      tags: ['tag1'],
      savedAt: Date.now(),
    };

    it('应该保存草稿', () => {
      manager.saveDraft('note-1', mockDraft);
      const saved = manager.getDraft('note-1');
      expect(saved).toBeDefined();
      expect(saved?.title).toBe(mockDraft.title);
    });

    it('应该获取草稿', () => {
      manager.saveDraft('note-1', mockDraft);
      const draft = manager.getDraft('note-1');
      expect(draft).not.toBeNull();
      expect(draft?.content).toBe(mockDraft.content);
    });

    it('应该删除草稿', () => {
      manager.saveDraft('note-1', mockDraft);
      manager.deleteDraft('note-1');
      const draft = manager.getDraft('note-1');
      expect(draft).toBeNull();
    });

    it('应该检查草稿是否存在', () => {
      expect(manager.hasDraft('note-1')).toBe(false);
      manager.saveDraft('note-1', mockDraft);
      expect(manager.hasDraft('note-1')).toBe(true);
    });
  });

  describe('清理功能', () => {
    it('应该定义 cleanupExpiredDrafts 方法', () => {
      expect(manager.cleanupExpiredDrafts).toBeDefined();
    });

    it('应该清理过期草稿', () => {
      // 直接在 localStorage 中设置过期草稿
      const oldDraft: DraftContent = {
        title: 'Old Draft',
        content: 'Old content',
        tags: [],
        savedAt: Date.now() - 8 * 24 * 60 * 60 * 1000, // 8天前
      };

      localStorage.setItem('draft_old-note', JSON.stringify(oldDraft));
      
      const cleanedCount = manager.cleanupExpiredDrafts(7); // 清理7天前的草稿
      
      expect(cleanedCount).toBeGreaterThan(0);
      const draft = manager.getDraft('old-note');
      expect(draft).toBeNull();
    });
  });
});
