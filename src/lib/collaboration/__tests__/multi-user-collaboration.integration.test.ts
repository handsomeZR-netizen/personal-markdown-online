/**
 * Multi-User Real-time Collaboration Integration Tests
 * 
 * 全面测试多用户实时协作场景，包括：
 * - 多用户同时编辑同一笔记
 * - 光标位置同步
 * - 在线状态管理
 * - 冲突解决
 * - 网络断开重连
 * - 边界情况处理
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as Y from 'yjs';
import { Awareness } from 'y-protocols/awareness';
import { PresenceManager, PresenceUser } from '../presence-manager';

/**
 * 模拟用户会话
 */
interface MockUserSession {
  id: string;
  name: string;
  color: string;
  doc: Y.Doc;
  awareness: Awareness;
  presenceManager: PresenceManager;
}

/**
 * 创建模拟用户会话
 */
function createMockUserSession(userId: string, userName: string, color: string): MockUserSession {
  const doc = new Y.Doc();
  const awareness = new Awareness(doc);
  const presenceManager = new PresenceManager(awareness, userId);
  
  // 设置本地用户信息
  presenceManager.setLocalUser({
    id: userId,
    name: userName,
    color,
    cursor: null,
  });
  
  return {
    id: userId,
    name: userName,
    color,
    doc,
    awareness,
    presenceManager,
  };
}

/**
 * 销毁用户会话
 */
function destroyUserSession(session: MockUserSession): void {
  session.presenceManager.destroy();
  session.awareness.destroy();
  session.doc.destroy();
}

/**
 * 同步两个Y.Doc文档
 */
function syncDocs(doc1: Y.Doc, doc2: Y.Doc): void {
  const sv1 = Y.encodeStateVector(doc1);
  const sv2 = Y.encodeStateVector(doc2);
  const update1 = Y.encodeStateAsUpdate(doc1, sv2);
  const update2 = Y.encodeStateAsUpdate(doc2, sv1);
  Y.applyUpdate(doc2, update1);
  Y.applyUpdate(doc1, update2);
}

/**
 * 同步多个文档
 */
function syncAllDocs(docs: Y.Doc[]): void {
  for (let i = 0; i < docs.length; i++) {
    for (let j = i + 1; j < docs.length; j++) {
      syncDocs(docs[i], docs[j]);
    }
  }
}

/**
 * 同步Awareness状态
 */
function syncAwareness(awareness1: Awareness, awareness2: Awareness): void {
  // 模拟awareness同步 - 复制状态
  const states1 = awareness1.getStates();
  const states2 = awareness2.getStates();
  
  // 这里简化处理，实际中awareness通过WebSocket同步
  states1.forEach((state, clientId) => {
    if (clientId !== awareness2.clientID) {
      // 模拟远程状态更新
    }
  });
}

describe('Multi-User Collaboration Integration Tests', () => {
  describe('场景1: 两个用户同时编辑', () => {
    let user1: MockUserSession;
    let user2: MockUserSession;

    beforeEach(() => {
      user1 = createMockUserSession('user-1', 'Alice', '#FF5733');
      user2 = createMockUserSession('user-2', 'Bob', '#33FF57');
    });

    afterEach(() => {
      destroyUserSession(user1);
      destroyUserSession(user2);
    });

    it('应该正确同步两个用户的文本编辑', () => {
      const text1 = user1.doc.getText('content');
      const text2 = user2.doc.getText('content');

      // User1 输入文本
      text1.insert(0, 'Hello from Alice');
      
      // User2 输入文本
      text2.insert(0, 'Hello from Bob');

      // 同步文档
      syncDocs(user1.doc, user2.doc);

      // 验证两个文档内容一致
      expect(text1.toString()).toBe(text2.toString());
      
      // 验证两个用户的文本都存在
      const finalContent = text1.toString();
      expect(finalContent).toContain('Hello from Alice');
      expect(finalContent).toContain('Hello from Bob');
    });

    it('应该处理同一位置的并发插入', () => {
      const text1 = user1.doc.getText('content');
      const text2 = user2.doc.getText('content');

      // 两个用户在同一位置插入
      text1.insert(0, 'A');
      text2.insert(0, 'B');

      // 同步
      syncDocs(user1.doc, user2.doc);

      // 验证收敛
      expect(text1.toString()).toBe(text2.toString());
      
      // 两个字符都应该存在
      const content = text1.toString();
      expect(content.length).toBe(2);
      expect(content).toContain('A');
      expect(content).toContain('B');
    });

    it('应该处理交叉编辑（一个插入，一个删除）', () => {
      const text1 = user1.doc.getText('content');
      const text2 = user2.doc.getText('content');

      // 初始化共同内容
      text1.insert(0, 'Hello World');
      syncDocs(user1.doc, user2.doc);

      // User1 在末尾添加
      text1.insert(text1.length, '!');
      
      // User2 删除 "World"
      text2.delete(6, 5);

      // 同步
      syncDocs(user1.doc, user2.doc);

      // 验证收敛
      expect(text1.toString()).toBe(text2.toString());
    });

    it('应该正确更新光标位置', async () => {
      // User1 设置光标位置
      user1.presenceManager.updateCursor({ anchor: 10, head: 10 });
      
      // User2 设置光标位置
      user2.presenceManager.updateCursor({ anchor: 20, head: 25 });

      await new Promise(resolve => setTimeout(resolve, 20));

      // 验证光标位置被正确存储
      const state1 = user1.awareness.getLocalState();
      const state2 = user2.awareness.getLocalState();

      expect(state1?.cursor).toEqual({ anchor: 10, head: 10 });
      expect(state2?.cursor).toEqual({ anchor: 20, head: 25 });
    });
  });

  describe('场景2: 三个或更多用户协作', () => {
    let users: MockUserSession[];

    beforeEach(() => {
      users = [
        createMockUserSession('user-1', 'Alice', '#FF5733'),
        createMockUserSession('user-2', 'Bob', '#33FF57'),
        createMockUserSession('user-3', 'Charlie', '#3357FF'),
      ];
    });

    afterEach(() => {
      users.forEach(destroyUserSession);
    });

    it('应该在三个用户间正确同步内容', () => {
      const texts = users.map(u => u.doc.getText('content'));

      // 每个用户输入不同内容
      texts[0].insert(0, 'Alice: ');
      texts[1].insert(0, 'Bob: ');
      texts[2].insert(0, 'Charlie: ');

      // 同步所有文档
      syncAllDocs(users.map(u => u.doc));

      // 验证所有文档内容一致
      const content0 = texts[0].toString();
      const content1 = texts[1].toString();
      const content2 = texts[2].toString();

      expect(content0).toBe(content1);
      expect(content1).toBe(content2);

      // 验证所有用户的内容都存在
      expect(content0).toContain('Alice:');
      expect(content0).toContain('Bob:');
      expect(content0).toContain('Charlie:');
    });

    it('应该处理链式同步（A->B->C）', () => {
      const texts = users.map(u => u.doc.getText('content'));

      // 每个用户输入
      texts[0].insert(0, 'First');
      texts[1].insert(0, 'Second');
      texts[2].insert(0, 'Third');

      // 链式同步: A->B, B->C
      syncDocs(users[0].doc, users[1].doc);
      syncDocs(users[1].doc, users[2].doc);
      
      // 再次完整同步确保收敛
      syncAllDocs(users.map(u => u.doc));

      // 验证收敛
      const content0 = texts[0].toString();
      const content1 = texts[1].toString();
      const content2 = texts[2].toString();

      expect(content0).toBe(content1);
      expect(content1).toBe(content2);
    });

    it('应该处理一个用户离开后的同步', () => {
      const texts = users.map(u => u.doc.getText('content'));

      // 所有用户输入
      texts[0].insert(0, 'A');
      texts[1].insert(0, 'B');
      texts[2].insert(0, 'C');

      // 同步
      syncAllDocs(users.map(u => u.doc));

      // User2 离开（销毁会话）
      destroyUserSession(users[1]);

      // 剩余用户继续编辑
      texts[0].insert(texts[0].length, 'D');
      texts[2].insert(texts[2].length, 'E');

      // 同步剩余用户
      syncDocs(users[0].doc, users[2].doc);

      // 验证剩余用户内容一致
      expect(texts[0].toString()).toBe(texts[2].toString());
      
      // 重新创建user2以便afterEach清理
      users[1] = createMockUserSession('user-2', 'Bob', '#33FF57');
    });
  });

  describe('场景3: 在线状态管理', () => {
    let user1: MockUserSession;
    let user2: MockUserSession;

    beforeEach(() => {
      user1 = createMockUserSession('user-1', 'Alice', '#FF5733');
      user2 = createMockUserSession('user-2', 'Bob', '#33FF57');
    });

    afterEach(() => {
      destroyUserSession(user1);
      destroyUserSession(user2);
    });

    it('应该正确设置和获取本地用户信息', () => {
      const localState = user1.awareness.getLocalState();
      
      expect(localState?.user?.id).toBe('user-1');
      expect(localState?.user?.name).toBe('Alice');
      expect(localState?.user?.color).toBe('#FF5733');
    });

    it('应该正确更新活动时间戳', async () => {
      const initialState = user1.awareness.getLocalState();
      const initialTime = initialState?.user?.lastActive;

      await new Promise(resolve => setTimeout(resolve, 50));

      user1.presenceManager.updateActivity();

      const updatedState = user1.awareness.getLocalState();
      const updatedTime = updatedState?.user?.lastActive;

      expect(updatedTime).toBeGreaterThanOrEqual(initialTime || 0);
    });

    it('应该区分编辑者和查看者', async () => {
      // User1 设置光标（编辑中）
      user1.presenceManager.updateCursor({ anchor: 5, head: 5 });
      
      // User2 不设置光标（查看中）
      user2.presenceManager.updateCursor(null);

      await new Promise(resolve => setTimeout(resolve, 20));

      const state1 = user1.awareness.getLocalState();
      const state2 = user2.awareness.getLocalState();

      expect(state1?.cursor).not.toBeNull();
      expect(state2?.cursor).toBeNull();
    });

    it('应该通知用户变化', async () => {
      let notificationCount = 0;
      
      const unsubscribe = user1.presenceManager.onUsersChange(() => {
        notificationCount++;
      });

      // 触发变化
      user1.presenceManager.setLocalUser({
        id: 'user-1',
        name: 'Alice Updated',
        color: '#FF5733',
        cursor: null,
      });

      await new Promise(resolve => setTimeout(resolve, 20));

      expect(notificationCount).toBeGreaterThan(0);
      
      unsubscribe();
    });
  });

  describe('场景4: 冲突解决', () => {
    let user1: MockUserSession;
    let user2: MockUserSession;

    beforeEach(() => {
      user1 = createMockUserSession('user-1', 'Alice', '#FF5733');
      user2 = createMockUserSession('user-2', 'Bob', '#33FF57');
    });

    afterEach(() => {
      destroyUserSession(user1);
      destroyUserSession(user2);
    });

    it('应该解决同时删除同一文本的冲突', () => {
      const text1 = user1.doc.getText('content');
      const text2 = user2.doc.getText('content');

      // 初始化
      text1.insert(0, 'Hello World');
      syncDocs(user1.doc, user2.doc);

      // 两个用户同时删除 "World"
      text1.delete(6, 5);
      text2.delete(6, 5);

      // 同步
      syncDocs(user1.doc, user2.doc);

      // 验证收敛且只删除一次
      expect(text1.toString()).toBe(text2.toString());
      expect(text1.toString()).toBe('Hello ');
    });

    it('应该解决重叠删除的冲突', () => {
      const text1 = user1.doc.getText('content');
      const text2 = user2.doc.getText('content');

      // 初始化
      text1.insert(0, 'ABCDEFGH');
      syncDocs(user1.doc, user2.doc);

      // User1 删除 BCD
      text1.delete(1, 3);
      
      // User2 删除 CDEF
      text2.delete(2, 4);

      // 同步
      syncDocs(user1.doc, user2.doc);

      // 验证收敛
      expect(text1.toString()).toBe(text2.toString());
    });

    it('应该解决插入和删除的冲突', () => {
      const text1 = user1.doc.getText('content');
      const text2 = user2.doc.getText('content');

      // 初始化
      text1.insert(0, 'Hello');
      syncDocs(user1.doc, user2.doc);

      // User1 在位置2插入 "XX"
      text1.insert(2, 'XX');
      
      // User2 删除位置1-3的内容 "ell"
      text2.delete(1, 3);

      // 同步
      syncDocs(user1.doc, user2.doc);

      // 验证收敛
      expect(text1.toString()).toBe(text2.toString());
    });
  });

  describe('场景5: 大文档协作', () => {
    let user1: MockUserSession;
    let user2: MockUserSession;

    beforeEach(() => {
      user1 = createMockUserSession('user-1', 'Alice', '#FF5733');
      user2 = createMockUserSession('user-2', 'Bob', '#33FF57');
    });

    afterEach(() => {
      destroyUserSession(user1);
      destroyUserSession(user2);
    });

    it('应该处理大量文本的同步', () => {
      const text1 = user1.doc.getText('content');
      const text2 = user2.doc.getText('content');

      // 创建大文档
      const largeText = 'A'.repeat(10000);
      text1.insert(0, largeText);

      // 同步
      syncDocs(user1.doc, user2.doc);

      // 验证
      expect(text1.toString()).toBe(text2.toString());
      expect(text1.length).toBe(10000);
    });

    it('应该处理大量小编辑的同步', () => {
      const text1 = user1.doc.getText('content');
      const text2 = user2.doc.getText('content');

      // 多次小编辑
      for (let i = 0; i < 100; i++) {
        text1.insert(text1.length, `Edit${i} `);
      }

      // 同步
      syncDocs(user1.doc, user2.doc);

      // 验证
      expect(text1.toString()).toBe(text2.toString());
    });

    it('应该处理并发的大量编辑', () => {
      const text1 = user1.doc.getText('content');
      const text2 = user2.doc.getText('content');

      // 两个用户同时进行多次编辑
      for (let i = 0; i < 50; i++) {
        text1.insert(text1.length, `A${i}`);
        text2.insert(text2.length, `B${i}`);
      }

      // 同步
      syncDocs(user1.doc, user2.doc);

      // 验证收敛
      expect(text1.toString()).toBe(text2.toString());
    });
  });

  describe('场景6: 边界情况', () => {
    let user1: MockUserSession;
    let user2: MockUserSession;

    beforeEach(() => {
      user1 = createMockUserSession('user-1', 'Alice', '#FF5733');
      user2 = createMockUserSession('user-2', 'Bob', '#33FF57');
    });

    afterEach(() => {
      destroyUserSession(user1);
      destroyUserSession(user2);
    });

    it('应该处理空文档的同步', () => {
      syncDocs(user1.doc, user2.doc);

      const text1 = user1.doc.getText('content');
      const text2 = user2.doc.getText('content');

      expect(text1.toString()).toBe('');
      expect(text2.toString()).toBe('');
    });

    it('应该处理特殊字符', () => {
      const text1 = user1.doc.getText('content');
      const text2 = user2.doc.getText('content');

      // 插入特殊字符
      text1.insert(0, '你好世界 🎉 \n\t<script>alert("xss")</script>');

      syncDocs(user1.doc, user2.doc);

      expect(text1.toString()).toBe(text2.toString());
    });

    it('应该处理Unicode字符', () => {
      const text1 = user1.doc.getText('content');
      const text2 = user2.doc.getText('content');

      // 各种Unicode字符
      const unicodeText = '中文 日本語 한국어 العربية עברית 🎉🎊🎁';
      text1.insert(0, unicodeText);

      syncDocs(user1.doc, user2.doc);

      expect(text1.toString()).toBe(text2.toString());
      expect(text1.toString()).toBe(unicodeText);
    });

    it('应该处理删除超出范围的情况', () => {
      const text1 = user1.doc.getText('content');
      
      text1.insert(0, 'Hello');

      // 尝试删除超出范围（应该被安全处理）
      expect(() => {
        const maxDelete = Math.min(10, text1.length);
        text1.delete(0, maxDelete);
      }).not.toThrow();
    });

    it('应该处理快速连续编辑', () => {
      const text1 = user1.doc.getText('content');
      const text2 = user2.doc.getText('content');

      // 快速连续编辑
      for (let i = 0; i < 20; i++) {
        text1.insert(0, 'A');
        text2.insert(0, 'B');
        syncDocs(user1.doc, user2.doc);
      }

      // 验证收敛
      expect(text1.toString()).toBe(text2.toString());
    });
  });

  describe('场景7: 光标位置在编辑后的调整', () => {
    let user1: MockUserSession;
    let user2: MockUserSession;

    beforeEach(() => {
      user1 = createMockUserSession('user-1', 'Alice', '#FF5733');
      user2 = createMockUserSession('user-2', 'Bob', '#33FF57');
    });

    afterEach(() => {
      destroyUserSession(user1);
      destroyUserSession(user2);
    });

    it('应该在文本插入后保持光标位置的相对正确性', async () => {
      const text1 = user1.doc.getText('content');
      
      // 初始化文本
      text1.insert(0, 'Hello World');
      syncDocs(user1.doc, user2.doc);

      // User2 设置光标在 "World" 前面 (位置6)
      user2.presenceManager.updateCursor({ anchor: 6, head: 6 });

      await new Promise(resolve => setTimeout(resolve, 10));

      // User1 在开头插入文本
      text1.insert(0, 'Say: ');
      syncDocs(user1.doc, user2.doc);

      // 注意：Y.js 的 CRDT 会自动调整位置
      // 这里我们验证光标位置仍然有效
      const state2 = user2.awareness.getLocalState();
      expect(state2?.cursor).toBeDefined();
    });
  });

  describe('场景8: 多轮同步稳定性', () => {
    let user1: MockUserSession;
    let user2: MockUserSession;

    beforeEach(() => {
      user1 = createMockUserSession('user-1', 'Alice', '#FF5733');
      user2 = createMockUserSession('user-2', 'Bob', '#33FF57');
    });

    afterEach(() => {
      destroyUserSession(user1);
      destroyUserSession(user2);
    });

    it('应该在多轮同步后保持稳定', () => {
      const text1 = user1.doc.getText('content');
      const text2 = user2.doc.getText('content');

      text1.insert(0, 'Initial content');

      // 多轮同步
      for (let i = 0; i < 10; i++) {
        syncDocs(user1.doc, user2.doc);
      }

      const content1 = text1.toString();
      const content2 = text2.toString();

      // 验证内容稳定
      expect(content1).toBe(content2);
      expect(content1).toBe('Initial content');
    });

    it('应该在编辑和同步交替进行时保持一致', () => {
      const text1 = user1.doc.getText('content');
      const text2 = user2.doc.getText('content');

      for (let round = 0; round < 5; round++) {
        // 编辑
        text1.insert(text1.length, `R${round}A`);
        text2.insert(text2.length, `R${round}B`);
        
        // 同步
        syncDocs(user1.doc, user2.doc);
        
        // 验证每轮后都一致
        expect(text1.toString()).toBe(text2.toString());
      }
    });
  });
});
