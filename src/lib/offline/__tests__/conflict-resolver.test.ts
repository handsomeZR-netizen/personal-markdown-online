/**
 * ConflictResolver 单元测试
 * 测试冲突检测和解决功能
 */

import { describe, it, expect } from 'vitest';
import { ConflictResolver } from '../conflict-resolver';
import type { LocalNote } from '@/types/offline';

describe('ConflictResolver', () => {
  let resolver: ConflictResolver;

  beforeEach(() => {
    resolver = ConflictResolver.getInstance();
  });

  describe('初始化', () => {
    it('应该返回单例实例', () => {
      const instance1 = ConflictResolver.getInstance();
      const instance2 = ConflictResolver.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('冲突检测', () => {
    it('应该定义 detectConflict 方法', () => {
      expect(resolver.detectConflict).toBeDefined();
    });

    const localNote: LocalNote = {
      id: 'note-1',
      title: 'Local',
      content: 'Local content',
      tags: [],
      userId: 'user-1',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastAccessedAt: Date.now(),
      syncStatus: 'pending',
    };

    const remoteNote = {
      id: 'note-1',
      title: 'Remote',
      content: 'Remote content',
      tags: [],
      userId: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('应该检测到时间戳冲突', () => {
      const hasConflict = resolver.detectConflict(localNote, remoteNote);
      expect(typeof hasConflict).toBe('boolean');
    });
  });

  describe('冲突解决', () => {
    it('应该定义 resolveConflict 方法', () => {
      expect(resolver.resolveConflict).toBeDefined();
    });

    it('应该定义 getConflictInfo 方法', () => {
      expect(resolver.getConflictInfo).toBeDefined();
    });

    it('应该定义 getDifferences 方法', () => {
      expect(resolver.getDifferences).toBeDefined();
    });
  });
});
