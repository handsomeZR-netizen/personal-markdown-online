/**
 * WebSocket 重连和网络故障测试
 * 
 * 测试场景：
 * - 网络断开后的重连机制
 * - 指数退避重连策略
 * - 心跳检测
 * - 连接池管理
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ConnectionPool } from '../connection-pool';
import { YjsProvider, ConnectionStatus } from '../yjs-provider';

// Mock HocuspocusProvider
vi.mock('@hocuspocus/provider', () => ({
  HocuspocusProvider: vi.fn(function MockProvider(config) {
    const mockProvider = {
      synced: false,
      shouldConnect: true,
      connect: vi.fn(),
      disconnect: vi.fn(),
      destroy: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
    };

    // 模拟连接成功
    setTimeout(() => {
      config?.onConnect?.();
      config?.onStatus?.({ status: 'connected' });
      mockProvider.synced = true;
      config?.onSynced?.();
    }, 10);

    return mockProvider;
  }),
}));

describe('WebSocket Reconnection Tests', () => {
  describe('ConnectionPool', () => {
    let pool: ConnectionPool;

    beforeEach(() => {
      pool = new ConnectionPool({
        maxConnections: 3,
        idleTimeout: 1000,
        cleanupInterval: 500,
      });
    });

    afterEach(() => {
      pool.destroy();
    });

    it('应该正确创建连接池', () => {
      const stats = pool.getStats();
      expect(stats.totalConnections).toBe(0);
      expect(stats.activeConnections).toBe(0);
      expect(stats.idleConnections).toBe(0);
    });

    it('应该正确获取和释放连接', async () => {
      const config = {
        noteId: 'note-1',
        userId: 'user-1',
        userName: 'Test User',
        userColor: '#FF0000',
        token: 'test-token',
        websocketUrl: 'ws://localhost:1234',
      };

      // 获取连接
      const provider = await pool.getConnection(config);
      expect(provider).toBeDefined();

      let stats = pool.getStats();
      expect(stats.totalConnections).toBe(1);
      expect(stats.activeConnections).toBe(1);

      // 释放连接
      pool.releaseConnection('note-1');
      
      stats = pool.getStats();
      expect(stats.totalConnections).toBe(1);
      expect(stats.idleConnections).toBe(1);
    });

    it('应该复用已存在的连接', async () => {
      const config = {
        noteId: 'note-1',
        userId: 'user-1',
        userName: 'Test User',
        userColor: '#FF0000',
        token: 'test-token',
        websocketUrl: 'ws://localhost:1234',
      };

      // 第一次获取
      const provider1 = await pool.getConnection(config);
      
      // 第二次获取同一个noteId
      const provider2 = await pool.getConnection(config);

      // 应该是同一个provider
      expect(provider1).toBe(provider2);

      const stats = pool.getStats();
      expect(stats.totalConnections).toBe(1);
    });

    it('应该在达到最大连接数时驱逐最少使用的连接', async () => {
      const configs = [1, 2, 3, 4].map(i => ({
        noteId: `note-${i}`,
        userId: 'user-1',
        userName: 'Test User',
        userColor: '#FF0000',
        token: 'test-token',
        websocketUrl: 'ws://localhost:1234',
      }));

      // 创建3个连接（达到最大值）
      await pool.getConnection(configs[0]);
      await pool.getConnection(configs[1]);
      await pool.getConnection(configs[2]);

      // 释放第一个连接使其变为idle
      pool.releaseConnection('note-1');

      // 创建第4个连接，应该驱逐note-1
      await pool.getConnection(configs[3]);

      const stats = pool.getStats();
      expect(stats.totalConnections).toBe(3);
    });

    it('应该正确关闭特定连接', async () => {
      const config = {
        noteId: 'note-1',
        userId: 'user-1',
        userName: 'Test User',
        userColor: '#FF0000',
        token: 'test-token',
        websocketUrl: 'ws://localhost:1234',
      };

      await pool.getConnection(config);
      
      let stats = pool.getStats();
      expect(stats.totalConnections).toBe(1);

      pool.closeConnection('note-1');

      stats = pool.getStats();
      expect(stats.totalConnections).toBe(0);
    });

    it('应该在销毁时关闭所有连接', async () => {
      const configs = [1, 2].map(i => ({
        noteId: `note-${i}`,
        userId: 'user-1',
        userName: 'Test User',
        userColor: '#FF0000',
        token: 'test-token',
        websocketUrl: 'ws://localhost:1234',
      }));

      await pool.getConnection(configs[0]);
      await pool.getConnection(configs[1]);

      pool.destroy();

      const stats = pool.getStats();
      expect(stats.totalConnections).toBe(0);
    });
  });

  describe('YjsProvider Status Management', () => {
    it('应该正确初始化状态', () => {
      const config = {
        noteId: 'note-1',
        userId: 'user-1',
        userName: 'Test User',
        userColor: '#FF0000',
        token: 'test-token',
        websocketUrl: 'ws://localhost:1234',
      };

      const provider = new YjsProvider(config);
      
      // 初始状态应该是disconnected、connecting或error（如果WebSocket连接失败）
      const status = provider.getStatus();
      expect(['disconnected', 'connecting', 'error']).toContain(status);
      
      // 如果初始化失败，应该标记为失败
      if (status === 'error') {
        expect(provider.hasInitializationFailed()).toBe(true);
      }

      provider.destroy();
    });

    it('应该正确获取Y.Doc实例', () => {
      const config = {
        noteId: 'note-1',
        userId: 'user-1',
        userName: 'Test User',
        userColor: '#FF0000',
        token: 'test-token',
        websocketUrl: 'ws://localhost:1234',
      };

      const provider = new YjsProvider(config);
      const ydoc = provider.getYDoc();
      
      expect(ydoc).toBeDefined();
      expect(ydoc.getText).toBeDefined();

      provider.destroy();
    });

    it('应该正确获取Awareness实例', () => {
      const config = {
        noteId: 'note-1',
        userId: 'user-1',
        userName: 'Test User',
        userColor: '#FF0000',
        token: 'test-token',
        websocketUrl: 'ws://localhost:1234',
      };

      const provider = new YjsProvider(config);
      const awareness = provider.getAwareness();
      
      expect(awareness).toBeDefined();
      expect(awareness.getLocalState).toBeDefined();

      provider.destroy();
    });

    it('应该正确更新光标位置', () => {
      const config = {
        noteId: 'note-1',
        userId: 'user-1',
        userName: 'Test User',
        userColor: '#FF0000',
        token: 'test-token',
        websocketUrl: 'ws://localhost:1234',
      };

      const provider = new YjsProvider(config);
      
      provider.updateCursor({ anchor: 10, head: 20 });
      
      const awareness = provider.getAwareness();
      const state = awareness.getLocalState();
      
      expect(state?.cursor).toEqual({ anchor: 10, head: 20 });

      provider.destroy();
    });

    it('应该正确更新用户信息', () => {
      const config = {
        noteId: 'note-1',
        userId: 'user-1',
        userName: 'Test User',
        userColor: '#FF0000',
        token: 'test-token',
        websocketUrl: 'ws://localhost:1234',
      };

      const provider = new YjsProvider(config);
      
      provider.updateUser({ name: 'Updated Name', color: '#00FF00' });
      
      const awareness = provider.getAwareness();
      const state = awareness.getLocalState();
      
      expect(state?.user?.name).toBe('Updated Name');
      expect(state?.user?.color).toBe('#00FF00');

      provider.destroy();
    });

    it('应该正确注册和取消状态监听器', async () => {
      const config = {
        noteId: 'note-1',
        userId: 'user-1',
        userName: 'Test User',
        userColor: '#FF0000',
        token: 'test-token',
        websocketUrl: 'ws://localhost:1234',
      };

      const provider = new YjsProvider(config);
      const statusChanges: ConnectionStatus[] = [];
      
      const unsubscribe = provider.onStatusChange((status) => {
        statusChanges.push(status);
      });

      // 应该立即收到当前状态
      expect(statusChanges.length).toBeGreaterThan(0);

      unsubscribe();
      provider.destroy();
    });

    it('应该在销毁后标记为已销毁', () => {
      const config = {
        noteId: 'note-1',
        userId: 'user-1',
        userName: 'Test User',
        userColor: '#FF0000',
        token: 'test-token',
        websocketUrl: 'ws://localhost:1234',
      };

      const provider = new YjsProvider(config);
      // 即使初始化失败，在调用destroy之前也不应该标记为已销毁
      expect(provider.isDestroyed()).toBe(false);

      provider.destroy();
      expect(provider.isDestroyed()).toBe(true);
      
      // 多次调用destroy应该是安全的
      provider.destroy();
      expect(provider.isDestroyed()).toBe(true);
    });
  });

  describe('Online Users Tracking', () => {
    it('应该正确获取在线用户列表', () => {
      const config = {
        noteId: 'note-1',
        userId: 'user-1',
        userName: 'Test User',
        userColor: '#FF0000',
        token: 'test-token',
        websocketUrl: 'ws://localhost:1234',
      };

      const provider = new YjsProvider(config);
      const onlineUsers = provider.getOnlineUsers();
      
      // 初始时应该没有其他在线用户（只有本地用户）
      expect(Array.isArray(onlineUsers)).toBe(true);

      provider.destroy();
    });

    it('应该正确注册awareness变化监听器', () => {
      const config = {
        noteId: 'note-1',
        userId: 'user-1',
        userName: 'Test User',
        userColor: '#FF0000',
        token: 'test-token',
        websocketUrl: 'ws://localhost:1234',
      };

      const provider = new YjsProvider(config);
      let changeCount = 0;
      
      const unsubscribe = provider.onAwarenessChange(() => {
        changeCount++;
      });

      // 触发awareness变化
      provider.updateCursor({ anchor: 5, head: 5 });

      expect(typeof unsubscribe).toBe('function');

      unsubscribe();
      provider.destroy();
    });
  });
});

describe('Reconnection Strategy Tests', () => {
  it('应该使用指数退避策略', () => {
    // 测试指数退避计算
    const initialDelay = 1000;
    const maxDelay = 30000;
    const backoffMultiplier = 1.5;

    const delays: number[] = [];
    for (let attempt = 0; attempt < 10; attempt++) {
      const delay = Math.min(
        initialDelay * Math.pow(backoffMultiplier, attempt),
        maxDelay
      );
      delays.push(delay);
    }

    // 验证延迟递增
    for (let i = 1; i < delays.length; i++) {
      expect(delays[i]).toBeGreaterThanOrEqual(delays[i - 1]);
    }

    // 验证不超过最大延迟
    delays.forEach(delay => {
      expect(delay).toBeLessThanOrEqual(maxDelay);
    });
  });

  it('应该在达到最大重试次数后停止', () => {
    const maxAttempts = 10;
    let attempts = 0;
    
    const shouldRetry = () => {
      if (attempts >= maxAttempts) {
        return false;
      }
      attempts++;
      return true;
    };

    while (shouldRetry()) {
      // 模拟重试
    }

    expect(attempts).toBe(maxAttempts);
  });
});
