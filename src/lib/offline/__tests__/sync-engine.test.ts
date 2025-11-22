/**
 * SyncEngine 单元测试
 * 测试同步引擎的核心功能
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SyncEngine } from '../sync-engine';

describe('SyncEngine', () => {
  let engine: SyncEngine;

  beforeEach(() => {
    engine = SyncEngine.getInstance();
  });

  describe('初始化', () => {
    it('应该返回单例实例', () => {
      const instance1 = SyncEngine.getInstance();
      const instance2 = SyncEngine.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('同步操作', () => {
    it('应该定义 startSync 方法', () => {
      expect(engine.startSync).toBeDefined();
    });

    it('应该定义 stopSync 方法', () => {
      expect(engine.stopSync).toBeDefined();
    });

    it('应该定义 syncOperation 方法', () => {
      expect(engine.syncOperation).toBeDefined();
    });

    it('应该定义 batchSync 方法', () => {
      expect(engine.batchSync).toBeDefined();
    });
  });

  describe('进度监听', () => {
    it('应该定义 onProgress 方法', () => {
      expect(engine.onProgress).toBeDefined();
    });

    it('应该定义 onConflict 方法', () => {
      expect(engine.onConflict).toBeDefined();
    });
  });

  describe('状态管理', () => {
    it('应该定义 isSyncInProgress 方法', () => {
      expect(engine.isSyncInProgress).toBeDefined();
    });

    it('应该返回正确的同步状态', () => {
      const status = engine.isSyncInProgress();
      expect(typeof status).toBe('boolean');
    });
  });
});
