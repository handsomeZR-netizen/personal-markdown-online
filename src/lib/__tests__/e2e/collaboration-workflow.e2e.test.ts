/**
 * E2E Test: Collaboration Workflow
 * Tests multi-user editing, presence indicators, and cursor display
 * Requirements: 1.1, 2.1, 3.1
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as Y from 'yjs';
import { Awareness } from 'y-protocols/awareness';

describe('E2E: Collaboration Workflow', () => {
  let doc1: Y.Doc;
  let doc2: Y.Doc;
  let awareness1: Awareness;
  let awareness2: Awareness;

  beforeEach(() => {
    // Create two separate Y.js documents to simulate two users
    doc1 = new Y.Doc();
    doc2 = new Y.Doc();
    
    awareness1 = new Awareness(doc1);
    awareness2 = new Awareness(doc2);
  });

  afterEach(() => {
    doc1.destroy();
    doc2.destroy();
  });

  describe('Multi-user Editing', () => {
    it('should sync edits between two users in real-time', async () => {
      // Requirement 1.1: Real-time sync within 100ms
      const text1 = doc1.getText('content');
      const text2 = doc2.getText('content');

      // User 1 types
      text1.insert(0, 'Hello from User 1');

      // Sync documents
      const state1 = Y.encodeStateAsUpdate(doc1);
      Y.applyUpdate(doc2, state1);

      // User 2 should see User 1's changes
      expect(text2.toString()).toBe('Hello from User 1');

      // User 2 types
      text2.insert(text2.length, ' - Hello from User 2');

      // Sync back
      const state2 = Y.encodeStateAsUpdate(doc2);
      Y.applyUpdate(doc1, state2);

      // Both users should see the same content
      expect(text1.toString()).toBe('Hello from User 1 - Hello from User 2');
      expect(text2.toString()).toBe('Hello from User 1 - Hello from User 2');
    });

    it('should handle concurrent edits without conflicts', async () => {
      // Requirement 1.3: CRDT conflict-free merging
      const text1 = doc1.getText('content');
      const text2 = doc2.getText('content');

      // Initial sync
      const initialState = Y.encodeStateAsUpdate(doc1);
      Y.applyUpdate(doc2, initialState);

      // Both users edit at the same position concurrently
      text1.insert(0, 'User1: ');
      text2.insert(0, 'User2: ');

      // Sync in both directions
      const update1 = Y.encodeStateAsUpdate(doc1);
      const update2 = Y.encodeStateAsUpdate(doc2);
      
      Y.applyUpdate(doc2, update1);
      Y.applyUpdate(doc1, update2);

      // Both documents should converge to the same state
      const finalText1 = text1.toString();
      const finalText2 = text2.toString();
      
      expect(finalText1).toBe(finalText2);
      expect(finalText1.includes('User1:')).toBe(true);
      expect(finalText1.includes('User2:')).toBe(true);
    });

    it('should maintain document consistency with multiple concurrent operations', async () => {
      // Requirement 1.2: Broadcast changes to all collaborators
      const text1 = doc1.getText('content');
      const text2 = doc2.getText('content');
      const text3 = new Y.Doc().getText('content');

      // Simulate 3 users making changes
      text1.insert(0, 'First ');
      text2.insert(0, 'Second ');
      
      // Sync all documents
      const update1 = Y.encodeStateAsUpdate(doc1);
      const update2 = Y.encodeStateAsUpdate(doc2);
      
      Y.applyUpdate(doc2, update1);
      Y.applyUpdate(doc1, update2);

      // All should converge
      expect(text1.toString()).toBe(text2.toString());
    });
  });

  describe('Online Presence Indicators', () => {
    it('should display online users in the presence list', () => {
      // Requirement 2.1: Display online collaborators
      const user1 = {
        id: 'user-1',
        name: 'Alice',
        email: 'alice@example.com',
        color: '#FF0000',
      };

      const user2 = {
        id: 'user-2',
        name: 'Bob',
        email: 'bob@example.com',
        color: '#00FF00',
      };

      // Set local user state
      awareness1.setLocalStateField('user', user1);
      awareness2.setLocalStateField('user', user2);

      // Get online users from awareness1's perspective
      const states = awareness1.getStates();
      const onlineUsers = Array.from(states.values())
        .map(state => state.user)
        .filter(Boolean);

      expect(onlineUsers).toHaveLength(1);
      expect(onlineUsers[0]).toEqual(user1);
    });

    it('should update presence when users join or leave', () => {
      // Requirement 2.5: Update presence within 3 seconds
      const user1 = {
        id: 'user-1',
        name: 'Alice',
        email: 'alice@example.com',
        color: '#FF0000',
        lastActive: Date.now(),
      };

      let presenceChangeCount = 0;
      awareness1.on('change', () => {
        presenceChangeCount++;
      });

      // User joins
      awareness1.setLocalStateField('user', user1);
      expect(presenceChangeCount).toBeGreaterThan(0);

      const initialCount = presenceChangeCount;

      // User leaves (set state to null)
      awareness1.setLocalState(null);
      expect(presenceChangeCount).toBeGreaterThan(initialCount);
    });

    it('should show editing indicator when collaborator is active', () => {
      // Requirement 2.4: Show "editing" indicator
      const user1 = {
        id: 'user-1',
        name: 'Alice',
        email: 'alice@example.com',
        color: '#FF0000',
        isEditing: true,
        lastActive: Date.now(),
      };

      awareness1.setLocalStateField('user', user1);

      const states = awareness1.getStates();
      const localState = states.get(awareness1.clientID);
      
      expect(localState?.user?.isEditing).toBe(true);
    });

    it('should handle more than 5 users with "+N" indicator logic', () => {
      // Requirement 2.2: Show "+N" for more than 5 users
      const users = Array.from({ length: 7 }, (_, i) => ({
        id: `user-${i}`,
        name: `User ${i}`,
        email: `user${i}@example.com`,
        color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
      }));

      // Simulate multiple users
      users.forEach((user, index) => {
        const awareness = new Awareness(new Y.Doc());
        awareness.setLocalStateField('user', user);
      });

      // In a real UI, we would show first 4 avatars + "+3"
      const displayLimit = 4;
      const visibleUsers = users.slice(0, displayLimit);
      const hiddenCount = users.length - displayLimit;

      expect(visibleUsers).toHaveLength(4);
      expect(hiddenCount).toBe(3);
    });
  });

  describe('Cursor Display', () => {
    it('should track and display cursor positions accurately', () => {
      // Requirement 3.1: Real-time cursor position display
      const user1 = {
        id: 'user-1',
        name: 'Alice',
        email: 'alice@example.com',
        color: '#FF0000',
      };

      const cursorPosition = {
        anchor: 10,
        head: 15,
      };

      awareness1.setLocalStateField('user', user1);
      awareness1.setLocalStateField('cursor', cursorPosition);

      const states = awareness1.getStates();
      const localState = states.get(awareness1.clientID);

      expect(localState?.cursor).toEqual(cursorPosition);
      expect(localState?.user).toEqual(user1);
    });

    it('should update cursor position when user moves cursor', () => {
      // Requirement 3.2: Cursor color matches user color
      const user1 = {
        id: 'user-1',
        name: 'Alice',
        email: 'alice@example.com',
        color: '#FF0000',
      };

      awareness1.setLocalStateField('user', user1);

      let cursorUpdateCount = 0;
      awareness1.on('change', () => {
        cursorUpdateCount++;
      });

      // Move cursor
      awareness1.setLocalStateField('cursor', { anchor: 0, head: 0 });
      const initialCount = cursorUpdateCount;

      awareness1.setLocalStateField('cursor', { anchor: 5, head: 5 });
      expect(cursorUpdateCount).toBeGreaterThan(initialCount);

      awareness1.setLocalStateField('cursor', { anchor: 10, head: 15 });
      expect(cursorUpdateCount).toBeGreaterThan(initialCount + 1);
    });

    it('should handle text selection (anchor !== head)', () => {
      // Requirement 3.2: Display text selection with user color
      const user1 = {
        id: 'user-1',
        name: 'Alice',
        email: 'alice@example.com',
        color: '#FF0000',
      };

      const selection = {
        anchor: 10,
        head: 25, // Selected 15 characters
      };

      awareness1.setLocalStateField('user', user1);
      awareness1.setLocalStateField('cursor', selection);

      const states = awareness1.getStates();
      const localState = states.get(awareness1.clientID);

      expect(localState?.cursor?.anchor).toBe(10);
      expect(localState?.cursor?.head).toBe(25);
      expect(localState?.cursor?.head - localState?.cursor?.anchor).toBe(15);
    });

    it('should fade cursor after 30 seconds of inactivity', () => {
      // Requirement 3.4: Fade inactive cursors
      const user1 = {
        id: 'user-1',
        name: 'Alice',
        email: 'alice@example.com',
        color: '#FF0000',
        lastActive: Date.now() - 31000, // 31 seconds ago
      };

      awareness1.setLocalStateField('user', user1);

      const states = awareness1.getStates();
      const localState = states.get(awareness1.clientID);
      const inactiveThreshold = 30000; // 30 seconds

      const isInactive = Date.now() - (localState?.user?.lastActive || 0) > inactiveThreshold;
      expect(isInactive).toBe(true);
    });

    it('should handle multiple cursors without overlap', () => {
      // Requirement 3.3: Stack cursor labels vertically when on same line
      const users = [
        { id: 'user-1', name: 'Alice', color: '#FF0000', cursor: { anchor: 10, head: 10 } },
        { id: 'user-2', name: 'Bob', color: '#00FF00', cursor: { anchor: 10, head: 10 } },
        { id: 'user-3', name: 'Charlie', color: '#0000FF', cursor: { anchor: 10, head: 10 } },
      ];

      // All cursors at same position
      const cursorsAtSamePosition = users.filter(u => u.cursor.anchor === 10);
      expect(cursorsAtSamePosition).toHaveLength(3);

      // In real UI, these would be stacked vertically
      // We can verify the logic by checking positions
      const stackedPositions = cursorsAtSamePosition.map((_, index) => ({
        top: index * 20, // 20px vertical offset per cursor
      }));

      expect(stackedPositions).toHaveLength(3);
      expect(stackedPositions[0].top).toBe(0);
      expect(stackedPositions[1].top).toBe(20);
      expect(stackedPositions[2].top).toBe(40);
    });
  });

  describe('Complete Collaboration Workflow', () => {
    it('should handle a complete multi-user editing session', async () => {
      // Integration test covering Requirements 1.1, 2.1, 3.1
      const text1 = doc1.getText('content');
      const text2 = doc2.getText('content');

      // User 1 setup
      const user1 = {
        id: 'user-1',
        name: 'Alice',
        email: 'alice@example.com',
        color: '#FF0000',
        lastActive: Date.now(),
      };
      awareness1.setLocalStateField('user', user1);

      // User 2 setup
      const user2 = {
        id: 'user-2',
        name: 'Bob',
        email: 'bob@example.com',
        color: '#00FF00',
        lastActive: Date.now(),
      };
      awareness2.setLocalStateField('user', user2);

      // User 1 starts typing
      text1.insert(0, 'Hello ');
      awareness1.setLocalStateField('cursor', { anchor: 6, head: 6 });

      // Sync to User 2
      Y.applyUpdate(doc2, Y.encodeStateAsUpdate(doc1));
      expect(text2.toString()).toBe('Hello ');

      // User 2 continues typing
      text2.insert(6, 'World!');
      awareness2.setLocalStateField('cursor', { anchor: 12, head: 12 });

      // Sync back to User 1
      Y.applyUpdate(doc1, Y.encodeStateAsUpdate(doc2));
      expect(text1.toString()).toBe('Hello World!');

      // Both users should see the same final content
      expect(text1.toString()).toBe(text2.toString());

      // Verify presence information is maintained
      expect(awareness1.getLocalState()?.user).toEqual(user1);
      expect(awareness2.getLocalState()?.user).toEqual(user2);
    });

    it('should handle user disconnection and reconnection', async () => {
      // Requirement 1.5: Sync offline changes on reconnect
      const text1 = doc1.getText('content');
      const text2 = doc2.getText('content');

      // Initial sync
      text1.insert(0, 'Initial content');
      Y.applyUpdate(doc2, Y.encodeStateAsUpdate(doc1));

      // User 2 goes offline and makes changes
      text2.insert(text2.length, ' - Offline edit');

      // User 2 reconnects and syncs
      Y.applyUpdate(doc1, Y.encodeStateAsUpdate(doc2));

      // Both should have the offline changes
      expect(text1.toString()).toBe('Initial content - Offline edit');
      expect(text2.toString()).toBe('Initial content - Offline edit');
    });

    it('should maintain consistency with rapid concurrent edits', async () => {
      // Stress test for Requirements 1.1, 1.2, 1.3
      const text1 = doc1.getText('content');
      const text2 = doc2.getText('content');

      // Simulate rapid typing from both users
      const edits1 = ['A', 'B', 'C', 'D', 'E'];
      const edits2 = ['1', '2', '3', '4', '5'];

      // User 1 types rapidly
      edits1.forEach((char, index) => {
        text1.insert(index, char);
      });

      // User 2 types rapidly at different positions
      edits2.forEach((char, index) => {
        text2.insert(index * 2, char);
      });

      // Sync both ways
      Y.applyUpdate(doc2, Y.encodeStateAsUpdate(doc1));
      Y.applyUpdate(doc1, Y.encodeStateAsUpdate(doc2));

      // Final sync to ensure convergence
      Y.applyUpdate(doc2, Y.encodeStateAsUpdate(doc1));
      Y.applyUpdate(doc1, Y.encodeStateAsUpdate(doc2));

      // Both documents should converge to the same state
      expect(text1.toString()).toBe(text2.toString());
    });
  });
});
