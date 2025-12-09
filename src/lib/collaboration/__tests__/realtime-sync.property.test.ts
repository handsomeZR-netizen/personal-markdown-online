/**
 * Property-Based Tests for Real-time Collaboration
 * Feature: team-collaborative-knowledge-base, Property 1: Real-time Sync Consistency
 * Validates: Requirements 1.1, 1.2, 1.3
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import * as Y from 'yjs';

/**
 * Represents a text edit operation
 */
interface TextEdit {
  position: number;
  text: string;
  userId: string;
  delete?: number; // Number of characters to delete before inserting
}

/**
 * Apply a series of edits to a Y.Doc
 */
function applyEdits(doc: Y.Doc, edits: TextEdit[]): void {
  const ytext = doc.getText('content');
  
  edits.forEach((edit) => {
    try {
      // Ensure position is within bounds
      const maxPos = ytext.length;
      const safePos = Math.min(edit.position, maxPos);
      
      // Delete if specified
      if (edit.delete && edit.delete > 0) {
        const deleteCount = Math.min(edit.delete, maxPos - safePos);
        if (deleteCount > 0) {
          ytext.delete(safePos, deleteCount);
        }
      }
      
      // Insert text
      if (edit.text) {
        ytext.insert(safePos, edit.text);
      }
    } catch (error) {
      // Ignore errors from invalid operations
      console.warn('Edit operation failed:', error);
    }
  });
}

/**
 * Sync two Y.Docs by exchanging state updates
 */
function syncDocs(doc1: Y.Doc, doc2: Y.Doc): void {
  // Get state vectors
  const stateVector1 = Y.encodeStateVector(doc1);
  const stateVector2 = Y.encodeStateVector(doc2);
  
  // Get missing updates
  const update1 = Y.encodeStateAsUpdate(doc1, stateVector2);
  const update2 = Y.encodeStateAsUpdate(doc2, stateVector1);
  
  // Apply updates
  Y.applyUpdate(doc2, update1);
  Y.applyUpdate(doc1, update2);
}

/**
 * Shuffle an array (Fisher-Yates algorithm)
 */
function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

describe('Property 1: Real-time Sync Consistency', () => {
  let doc1: Y.Doc;
  let doc2: Y.Doc;
  let doc3: Y.Doc;

  beforeEach(() => {
    doc1 = new Y.Doc();
    doc2 = new Y.Doc();
    doc3 = new Y.Doc();
  });

  afterEach(() => {
    doc1.destroy();
    doc2.destroy();
    doc3.destroy();
  });

  it('should converge to same state after applying edits in different orders', () => {
    fc.assert(
      fc.property(
        // Generate array of text edits
        fc.array(
          fc.record({
            position: fc.nat(100),
            text: fc.string({ minLength: 0, maxLength: 20 }),
            userId: fc.constantFrom('user1', 'user2', 'user3'),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (edits) => {
          // Create fresh documents for this test
          const testDoc1 = new Y.Doc();
          const testDoc2 = new Y.Doc();
          
          try {
            // Apply edits in original order to doc1
            applyEdits(testDoc1, edits);
            
            // Apply edits in shuffled order to doc2
            applyEdits(testDoc2, shuffle(edits));
            
            // Sync documents
            syncDocs(testDoc1, testDoc2);
            
            // Documents should converge to same state
            const text1 = testDoc1.getText('content').toString();
            const text2 = testDoc2.getText('content').toString();
            
            expect(text1).toBe(text2);
          } finally {
            testDoc1.destroy();
            testDoc2.destroy();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain consistency across three concurrent clients', () => {
    fc.assert(
      fc.property(
        // Generate edits for three users
        fc.tuple(
          fc.array(
            fc.record({
              position: fc.nat(50),
              text: fc.string({ minLength: 1, maxLength: 10 }),
              userId: fc.constant('user1'),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          fc.array(
            fc.record({
              position: fc.nat(50),
              text: fc.string({ minLength: 1, maxLength: 10 }),
              userId: fc.constant('user2'),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          fc.array(
            fc.record({
              position: fc.nat(50),
              text: fc.string({ minLength: 1, maxLength: 10 }),
              userId: fc.constant('user3'),
            }),
            { minLength: 1, maxLength: 10 }
          )
        ),
        ([edits1, edits2, edits3]) => {
          const testDoc1 = new Y.Doc();
          const testDoc2 = new Y.Doc();
          const testDoc3 = new Y.Doc();
          
          try {
            // Each client applies their own edits
            applyEdits(testDoc1, edits1);
            applyEdits(testDoc2, edits2);
            applyEdits(testDoc3, edits3);
            
            // Sync all documents pairwise
            syncDocs(testDoc1, testDoc2);
            syncDocs(testDoc2, testDoc3);
            syncDocs(testDoc1, testDoc3);
            
            // All documents should have the same content
            const text1 = testDoc1.getText('content').toString();
            const text2 = testDoc2.getText('content').toString();
            const text3 = testDoc3.getText('content').toString();
            
            expect(text1).toBe(text2);
            expect(text2).toBe(text3);
          } finally {
            testDoc1.destroy();
            testDoc2.destroy();
            testDoc3.destroy();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle concurrent insertions at same position', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 10 }),
        fc.string({ minLength: 1, maxLength: 10 }),
        fc.nat(50),
        (text1, text2, position) => {
          const testDoc1 = new Y.Doc();
          const testDoc2 = new Y.Doc();
          
          try {
            // Both clients insert at the same position
            const ytext1 = testDoc1.getText('content');
            const ytext2 = testDoc2.getText('content');
            
            ytext1.insert(Math.min(position, ytext1.length), text1);
            ytext2.insert(Math.min(position, ytext2.length), text2);
            
            // Sync documents
            syncDocs(testDoc1, testDoc2);
            
            // Documents should converge
            const result1 = testDoc1.getText('content').toString();
            const result2 = testDoc2.getText('content').toString();
            
            expect(result1).toBe(result2);
            
            // Result should contain both texts
            expect(result1).toContain(text1);
            expect(result1).toContain(text2);
          } finally {
            testDoc1.destroy();
            testDoc2.destroy();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle mixed insert and delete operations', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            position: fc.nat(100),
            text: fc.string({ minLength: 0, maxLength: 15 }),
            delete: fc.option(fc.nat(10)),
            userId: fc.constantFrom('user1', 'user2'),
          }),
          { minLength: 2, maxLength: 15 }
        ),
        (edits) => {
          const testDoc1 = new Y.Doc();
          const testDoc2 = new Y.Doc();
          
          try {
            // Split edits by user
            const user1Edits = edits.filter(e => e.userId === 'user1');
            const user2Edits = edits.filter(e => e.userId === 'user2');
            
            // Apply user-specific edits
            applyEdits(testDoc1, user1Edits);
            applyEdits(testDoc2, user2Edits);
            
            // Sync documents
            syncDocs(testDoc1, testDoc2);
            
            // Documents should converge
            const text1 = testDoc1.getText('content').toString();
            const text2 = testDoc2.getText('content').toString();
            
            expect(text1).toBe(text2);
          } finally {
            testDoc1.destroy();
            testDoc2.destroy();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve document state after multiple sync rounds', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            position: fc.nat(50),
            text: fc.string({ minLength: 1, maxLength: 10 }),
            userId: fc.constantFrom('user1', 'user2'),
          }),
          { minLength: 3, maxLength: 15 }
        ),
        (edits) => {
          const testDoc1 = new Y.Doc();
          const testDoc2 = new Y.Doc();
          
          try {
            // Apply all edits to doc1
            applyEdits(testDoc1, edits);
            
            // Sync multiple times
            syncDocs(testDoc1, testDoc2);
            const firstSync = testDoc2.getText('content').toString();
            
            syncDocs(testDoc1, testDoc2);
            const secondSync = testDoc2.getText('content').toString();
            
            syncDocs(testDoc1, testDoc2);
            const thirdSync = testDoc2.getText('content').toString();
            
            // Content should remain stable after first sync
            expect(firstSync).toBe(secondSync);
            expect(secondSync).toBe(thirdSync);
          } finally {
            testDoc1.destroy();
            testDoc2.destroy();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle empty document synchronization', () => {
    const testDoc1 = new Y.Doc();
    const testDoc2 = new Y.Doc();
    
    try {
      // Sync empty documents
      syncDocs(testDoc1, testDoc2);
      
      const text1 = testDoc1.getText('content').toString();
      const text2 = testDoc2.getText('content').toString();
      
      expect(text1).toBe('');
      expect(text2).toBe('');
      expect(text1).toBe(text2);
    } finally {
      testDoc1.destroy();
      testDoc2.destroy();
    }
  });

  it('should handle single character edits', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        (text) => {
          const testDoc1 = new Y.Doc();
          const testDoc2 = new Y.Doc();
          
          try {
            const ytext1 = testDoc1.getText('content');
            const ytext2 = testDoc2.getText('content');
            
            // Insert characters one by one in different documents
            Array.from(text).forEach((char, index) => {
              if (index % 2 === 0) {
                ytext1.insert(ytext1.length, char);
              } else {
                ytext2.insert(ytext2.length, char);
              }
            });
            
            // Sync documents
            syncDocs(testDoc1, testDoc2);
            
            const text1 = testDoc1.getText('content').toString();
            const text2 = testDoc2.getText('content').toString();
            
            expect(text1).toBe(text2);
          } finally {
            testDoc1.destroy();
            testDoc2.destroy();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
