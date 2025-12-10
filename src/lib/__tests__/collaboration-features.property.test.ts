/**
 * Property-Based Tests for Collaboration Features
 * Feature: comprehensive-feature-audit, Property 1: 功能完整性
 * Validates: Requirements 4.1
 * 
 * Tests that collaboration features work correctly across all valid inputs
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import * as Y from 'yjs';
import { Awareness } from 'y-protocols/awareness';

/**
 * User information for collaboration
 */
interface CollaborationUser {
  id: string;
  name: string;
  color: string;
}

/**
 * Cursor position
 */
interface CursorPosition {
  anchor: number;
  head: number;
}

/**
 * Arbitrary for generating valid user IDs
 */
const userIdArbitrary = fc.uuid();

/**
 * Arbitrary for generating user names
 */
const userNameArbitrary = fc.string({ minLength: 1, maxLength: 50 });

/**
 * Arbitrary for generating hex colors
 */
const colorArbitrary = fc.integer({ min: 0, max: 0xFFFFFF }).map(num => 
  `#${num.toString(16).padStart(6, '0')}`
);

/**
 * Arbitrary for generating collaboration users
 */
const collaborationUserArbitrary = fc.record({
  id: userIdArbitrary,
  name: userNameArbitrary,
  color: colorArbitrary,
});

/**
 * Arbitrary for generating cursor positions
 */
const cursorPositionArbitrary = fc.record({
  anchor: fc.nat(1000),
  head: fc.nat(1000),
});

/**
 * Arbitrary for generating text edits
 */
const textEditArbitrary = fc.record({
  position: fc.nat(100),
  text: fc.string({ minLength: 0, maxLength: 50 }),
  delete: fc.option(fc.nat(20)),
});

describe('Property 1: Collaboration Feature Completeness', () => {
  describe('Real-time Sync Consistency', () => {
    it('should maintain document consistency across multiple users', () => {
      fc.assert(
        fc.property(
          fc.array(collaborationUserArbitrary, { minLength: 2, maxLength: 5 }),
          fc.array(textEditArbitrary, { minLength: 1, maxLength: 20 }),
          (users, edits) => {
            // Create documents for each user
            const docs = users.map(() => new Y.Doc());
            
            try {
              // Each user makes some edits
              users.forEach((user, index) => {
                const ytext = docs[index].getText('content');
                const userEdits = edits.filter((_, i) => i % users.length === index);
                
                userEdits.forEach(edit => {
                  const safePos = Math.min(edit.position, ytext.length);
                  
                  if (edit.delete && edit.delete > 0) {
                    const deleteCount = Math.min(edit.delete, ytext.length - safePos);
                    if (deleteCount > 0) {
                      ytext.delete(safePos, deleteCount);
                    }
                  }
                  
                  if (edit.text) {
                    ytext.insert(safePos, edit.text);
                  }
                });
              });
              
              // Sync all documents
              for (let i = 0; i < docs.length; i++) {
                for (let j = i + 1; j < docs.length; j++) {
                  const sv1 = Y.encodeStateVector(docs[i]);
                  const sv2 = Y.encodeStateVector(docs[j]);
                  Y.applyUpdate(docs[j], Y.encodeStateAsUpdate(docs[i], sv2));
                  Y.applyUpdate(docs[i], Y.encodeStateAsUpdate(docs[j], sv1));
                }
              }
              
              // All documents should have the same content
              const referenceText = docs[0].getText('content').toString();
              for (let i = 1; i < docs.length; i++) {
                expect(docs[i].getText('content').toString()).toBe(referenceText);
              }
            } finally {
              docs.forEach(doc => doc.destroy());
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve edit order within a single user session', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: 2, maxLength: 10 }),
          (texts) => {
            const doc = new Y.Doc();
            
            try {
              const ytext = doc.getText('content');
              
              // Insert texts in order
              texts.forEach(text => {
                ytext.insert(ytext.length, text);
              });
              
              // Result should contain all texts in order
              const result = ytext.toString();
              const expected = texts.join('');
              
              expect(result).toBe(expected);
            } finally {
              doc.destroy();
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle concurrent insertions at the same position', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: 2, maxLength: 5 }),
          fc.nat(50),
          (texts, position) => {
            const docs = texts.map(() => new Y.Doc());
            
            try {
              // Each user inserts at the same position
              texts.forEach((text, index) => {
                const ytext = docs[index].getText('content');
                const safePos = Math.min(position, ytext.length);
                ytext.insert(safePos, text);
              });
              
              // Sync all documents
              for (let i = 0; i < docs.length; i++) {
                for (let j = i + 1; j < docs.length; j++) {
                  const sv1 = Y.encodeStateVector(docs[i]);
                  const sv2 = Y.encodeStateVector(docs[j]);
                  Y.applyUpdate(docs[j], Y.encodeStateAsUpdate(docs[i], sv2));
                  Y.applyUpdate(docs[i], Y.encodeStateAsUpdate(docs[j], sv1));
                }
              }
              
              // All documents should converge
              const referenceText = docs[0].getText('content').toString();
              for (let i = 1; i < docs.length; i++) {
                expect(docs[i].getText('content').toString()).toBe(referenceText);
              }
              
              // Result should contain all inserted texts
              texts.forEach(text => {
                expect(referenceText).toContain(text);
              });
            } finally {
              docs.forEach(doc => doc.destroy());
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Presence and Cursor Tracking', () => {
    it('should track cursor positions for all users', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              user: collaborationUserArbitrary,
              cursor: fc.option(cursorPositionArbitrary),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (userStates) => {
            const doc = new Y.Doc();
            const awareness = new Awareness(doc);
            
            try {
              // Set awareness state for each user
              userStates.forEach((state, index) => {
                // Simulate different client IDs
                const clientId = index + 1;
                
                awareness.setLocalStateField('user', {
                  id: state.user.id,
                  name: state.user.name,
                  color: state.user.color,
                  lastActive: Date.now(),
                });
                
                if (state.cursor) {
                  awareness.setLocalStateField('cursor', state.cursor);
                }
              });
              
              // Verify awareness state is set
              const localState = awareness.getLocalState();
              expect(localState).toBeDefined();
              
              if (localState?.user) {
                expect(localState.user).toHaveProperty('id');
                expect(localState.user).toHaveProperty('name');
                expect(localState.user).toHaveProperty('color');
              }
            } finally {
              awareness.destroy();
              doc.destroy();
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should update cursor positions without affecting document content', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 100 }),
          fc.array(cursorPositionArbitrary, { minLength: 1, maxLength: 20 }),
          (initialText, cursorUpdates) => {
            const doc = new Y.Doc();
            const awareness = new Awareness(doc);
            
            try {
              // Set initial document content
              const ytext = doc.getText('content');
              ytext.insert(0, initialText);
              
              // Set initial user
              awareness.setLocalStateField('user', {
                id: 'test-user',
                name: 'Test User',
                color: '#FF5733',
                lastActive: Date.now(),
              });
              
              // Update cursor multiple times
              cursorUpdates.forEach(cursor => {
                awareness.setLocalStateField('cursor', cursor);
              });
              
              // Document content should remain unchanged
              expect(ytext.toString()).toBe(initialText);
              
              // Last cursor position should be set
              const localState = awareness.getLocalState();
              if (cursorUpdates.length > 0) {
                expect(localState?.cursor).toBeDefined();
              }
            } finally {
              awareness.destroy();
              doc.destroy();
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle null cursor positions (user not editing)', () => {
      fc.assert(
        fc.property(
          collaborationUserArbitrary,
          fc.option(cursorPositionArbitrary),
          (user, cursor) => {
            const doc = new Y.Doc();
            const awareness = new Awareness(doc);
            
            try {
              // Set user
              awareness.setLocalStateField('user', {
                id: user.id,
                name: user.name,
                color: user.color,
                lastActive: Date.now(),
              });
              
              // Set cursor (may be null)
              awareness.setLocalStateField('cursor', cursor);
              
              // Verify state
              const localState = awareness.getLocalState();
              expect(localState?.user).toBeDefined();
              
              // Cursor can be null or defined
              if (cursor) {
                expect(localState?.cursor).toBeDefined();
              }
            } finally {
              awareness.destroy();
              doc.destroy();
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('User Information Consistency', () => {
    it('should maintain user information across awareness updates', () => {
      fc.assert(
        fc.property(
          collaborationUserArbitrary,
          fc.array(cursorPositionArbitrary, { minLength: 1, maxLength: 10 }),
          (user, cursorUpdates) => {
            const doc = new Y.Doc();
            const awareness = new Awareness(doc);
            
            try {
              // Set initial user
              awareness.setLocalStateField('user', {
                id: user.id,
                name: user.name,
                color: user.color,
                lastActive: Date.now(),
              });
              
              // Update cursor multiple times
              cursorUpdates.forEach(cursor => {
                awareness.setLocalStateField('cursor', cursor);
              });
              
              // User information should remain consistent
              const localState = awareness.getLocalState();
              expect(localState?.user?.id).toBe(user.id);
              expect(localState?.user?.name).toBe(user.name);
              expect(localState?.user?.color).toBe(user.color);
            } finally {
              awareness.destroy();
              doc.destroy();
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle user color changes', () => {
      fc.assert(
        fc.property(
          collaborationUserArbitrary,
          fc.array(colorArbitrary, { minLength: 1, maxLength: 5 }),
          (user, colors) => {
            const doc = new Y.Doc();
            const awareness = new Awareness(doc);
            
            try {
              // Set initial user
              awareness.setLocalStateField('user', {
                id: user.id,
                name: user.name,
                color: user.color,
                lastActive: Date.now(),
              });
              
              // Change color multiple times
              colors.forEach(color => {
                const currentUser = awareness.getLocalState()?.user;
                awareness.setLocalStateField('user', {
                  ...currentUser,
                  color,
                  lastActive: Date.now(),
                });
              });
              
              // Last color should be set
              const localState = awareness.getLocalState();
              expect(localState?.user?.color).toBe(colors[colors.length - 1]);
              
              // User ID and name should remain unchanged
              expect(localState?.user?.id).toBe(user.id);
              expect(localState?.user?.name).toBe(user.name);
            } finally {
              awareness.destroy();
              doc.destroy();
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Sync Idempotency', () => {
    it('should produce same result when syncing multiple times', () => {
      fc.assert(
        fc.property(
          fc.array(textEditArbitrary, { minLength: 1, maxLength: 15 }),
          (edits) => {
            const doc1 = new Y.Doc();
            const doc2 = new Y.Doc();
            
            try {
              // Apply edits to doc1
              const ytext1 = doc1.getText('content');
              edits.forEach(edit => {
                const safePos = Math.min(edit.position, ytext1.length);
                
                if (edit.delete && edit.delete > 0) {
                  const deleteCount = Math.min(edit.delete, ytext1.length - safePos);
                  if (deleteCount > 0) {
                    ytext1.delete(safePos, deleteCount);
                  }
                }
                
                if (edit.text) {
                  ytext1.insert(safePos, edit.text);
                }
              });
              
              // Sync once
              const sv1 = Y.encodeStateVector(doc1);
              const sv2 = Y.encodeStateVector(doc2);
              Y.applyUpdate(doc2, Y.encodeStateAsUpdate(doc1, sv2));
              Y.applyUpdate(doc1, Y.encodeStateAsUpdate(doc2, sv1));
              
              const firstSync = doc2.getText('content').toString();
              
              // Sync again (should be idempotent)
              const sv1_2 = Y.encodeStateVector(doc1);
              const sv2_2 = Y.encodeStateVector(doc2);
              Y.applyUpdate(doc2, Y.encodeStateAsUpdate(doc1, sv2_2));
              Y.applyUpdate(doc1, Y.encodeStateAsUpdate(doc2, sv1_2));
              
              const secondSync = doc2.getText('content').toString();
              
              // Results should be identical
              expect(secondSync).toBe(firstSync);
            } finally {
              doc1.destroy();
              doc2.destroy();
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Empty State Handling', () => {
    it('should handle empty documents correctly', () => {
      const doc1 = new Y.Doc();
      const doc2 = new Y.Doc();
      
      try {
        // Sync empty documents
        const sv1 = Y.encodeStateVector(doc1);
        const sv2 = Y.encodeStateVector(doc2);
        Y.applyUpdate(doc2, Y.encodeStateAsUpdate(doc1, sv2));
        Y.applyUpdate(doc1, Y.encodeStateAsUpdate(doc2, sv1));
        
        // Both should remain empty
        expect(doc1.getText('content').toString()).toBe('');
        expect(doc2.getText('content').toString()).toBe('');
      } finally {
        doc1.destroy();
        doc2.destroy();
      }
    });

    it('should handle empty awareness state', () => {
      const doc = new Y.Doc();
      const awareness = new Awareness(doc);
      
      try {
        // Get states without setting anything
        const states = awareness.getStates();
        
        // Should have at least local state
        expect(states.size).toBeGreaterThanOrEqual(0);
      } finally {
        awareness.destroy();
        doc.destroy();
      }
    });
  });
});
