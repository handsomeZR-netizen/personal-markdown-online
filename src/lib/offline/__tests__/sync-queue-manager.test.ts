/**
 * SyncQueueManager 单元测试
 * 测试同步队列的核心功能
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SyncQueueManager } from '../sync-queue-manager';
import type { SyncOperation } from '@/types/offline';

describe('SyncQueueManager', () => {
  let manager: SyncQueueManager;

  beforeEach(() => {
    manager = SyncQueueManager.getInstance();
  });

  describe('初始化', () => {
    it('应该返回单例实例', () => {
      const instance1 = SyncQueueManager.getInstance();
      const instance2 = SyncQueueManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('队列操作', () => {
    it('应该定义 enqueue 方法', () => {
      expect(manager.enqueue).toBeDefined();
    });

    it('应该定义 getQueue 方法', () => {
      expect(manager.getQueue).toBeDefined();
    });

    it('应该定义 dequeue 方法', () => {
      expect(manager.dequeue).toBeDefined();
    });

    it('应该定义 updateStatus 方法', () => {
      expect(manager.updateStatus).toBeDefined();
    });

    it('应该定义 clear 方法', () => {
      expect(manager.clear).toBeDefined();
    });

    it('应该定义 getCount 方法', () => {
      expect(manager.getCount).toBeDefined();
    });

    it('应该定义 hasPendingOperations 方法', () => {
      expect(manager.hasPendingOperations).toBeDefined();
    });

    it('应该定义 getFailedOperations 方法', () => {
      expect(manager.getFailedOperations).toBeDefined();
    });
  });
});
