/**
 * Property-Based Tests for CRDT Convergence
 * Feature: team-collaborative-knowledge-base, Property 2: CRDT Convergence
 * Validates: Requirements 1.3
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import * as Y from 'yjs';

/**
 * Represents a concurrent edit operation
 */
interface ConcurrentEdit {
  clientId: number;
  position: number;
  text: string;
  delete?: number;
}

/**
 * Apply edits to a document from a specific client's perspective
 */
function applyClientEdits(doc: Y.Doc, edits: ConcurrentEdit[], clientId: number): void {
  const ytext = doc.getText('content');
  
  edits
    .filter(edit => edit.clientId === clientId)
    .forEach((edit) => {
      try {
        const maxPos = ytext.length;
        const safePos = Math.min(edit.position, maxPos);
        
        if (edit.delete && edit.delete > 0) {
          const deleteCount = Math.min(edit.delete, maxPos - safePos);
          if (deleteCount > 0) {
            ytext.delete(safePos, deleteCount);
          }
        }
        
        if (edit.text) {
          ytext.insert(safePos, edit.text);
        }
      } catch (error) {
        console.warn('Edit operation failed:', error);
      }
    });
}

/**
 * Sync multiple documents in a mesh network topology
 */
function syncAllDocs(docs: Y.Doc[]): void {
  // Sync each pair of documents
  for (let i = 0; i < docs.length; i++) {
    for (let j = i + 1; j < docs.length; j++) {
      const stateVector1 = Y.encodeStateVector(docs[i]);
      const stateVector2 = Y.encodeStateVector(docs[j]);
      
      const update1 = Y.encodeStateAsUpdate(docs[i], stateVector2);
      const update2 = Y.encodeStateAsUpdate(docs[j], stateVector1);
      
      Y.applyUpdate(docs[j], update1);
      Y.applyUpdate(docs[i], update2);
    }
  }
}

/**
 * Sync documents in a chain (1 -> 2 -> 3 -> ... -> n)
 */
function syncDocsInChain(docs: Y.Doc[]): void {
  for (let i = 0; i < docs.length - 1; i++) {
    const stateVector1 = Y.encodeStateVector(docs[i]);
    const stateVector2 = Y.encodeStateVector(docs[i + 1]);
    
    const update1 = Y.encodeStateAsUpdate(docs[i], stateVector2);
    const update2 = Y.encodeStateAsUpdate(docs[i + 1], stateVector1);
    
    Y.applyUpdate(docs[i + 1], update1);
    Y.applyUpdate(docs[i], update2);
  }
}

/**
 * Verify all documents have converged to the same state
 */
function verifyConvergence(docs: Y.Doc[]): void {
  if (docs.length === 0) return;
  
  const referenceText = docs[0].getText('content').toString();
  
  for (let i = 1; i < docs.length; i++) {
    const text = docs[i].getText('content').toString();
    expect(text).toBe(referenceText);
  }
}

describe('Property 2: CRDT Convergence', () => {
  it('should converge after concurrent edits from multiple clients', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 5 }), // Number of clients
        fc.array(
          fc.record({
            clientId: fc.integer({ min: 0, max: 4 }),
            position: fc.nat(50),
            text: fc.string({ minLength: 1, maxLength: 10 }),
          }),
          { minLength: 2, maxLength: 20 }
        ),
        (numClients, edits) => {
          // Create documents for each client
          const docs = Array.from({ length: numClients }, () => new Y.Doc());
          
          try {
            // Normalize client IDs to be within range
            const normalizedEdits = edits.map(edit => ({
              ...edit,
              clientId: edit.clientId % numClients,
            }));
            
            // Each client applies their own edits
            for (let i = 0; i < numClients; i++) {
              applyClientEdits(docs[i], normalizedEdits, i);
            }
            
            // Sync all documents
            syncAllDocs(docs);
            
            // Verify convergence
            verifyConvergence(docs);
          } finally {
            docs.forEach(doc => doc.destroy());
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should converge after sufficient sync rounds', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            clientId: fc.constantFrom(0, 1, 2),
            position: fc.nat(30),
            text: fc.string({ minLength: 1, maxLength: 8 }),
          }),
          { minLength: 3, maxLength: 15 }
        ),
        (edits) => {
          // Create three documents
          const docs = [new Y.Doc(), new Y.Doc(), new Y.Doc()];
          
          try {
            // Apply edits to each document
            for (let i = 0; i < 3; i++) {
              applyClientEdits(docs[i], edits, i);
            }
            
            // Sync multiple rounds to ensure convergence
            // This simulates eventual consistency in a distributed system
            for (let round = 0; round < 3; round++) {
              syncAllDocs(docs);
            }
            
            // All documents should converge
            verifyConvergence(docs);
          } finally {
            docs.forEach(doc => doc.destroy());
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle network partitions and eventual sync', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            clientId: fc.constantFrom(0, 1, 2, 3),
            position: fc.nat(40),
            text: fc.string({ minLength: 1, maxLength: 8 }),
          }),
          { minLength: 4, maxLength: 16 }
        ),
        (edits) => {
          // Create four documents
          const docs = [new Y.Doc(), new Y.Doc(), new Y.Doc(), new Y.Doc()];
          
          try {
            // Apply edits
            for (let i = 0; i < 4; i++) {
              applyClientEdits(docs[i], edits, i);
            }
            
            // Simulate network partition: sync only within partitions
            // Partition 1: docs[0] and docs[1]
            const sv0 = Y.encodeStateVector(docs[0]);
            const sv1 = Y.encodeStateVector(docs[1]);
            Y.applyUpdate(docs[1], Y.encodeStateAsUpdate(docs[0], sv1));
            Y.applyUpdate(docs[0], Y.encodeStateAsUpdate(docs[1], sv0));
            
            // Partition 2: docs[2] and docs[3]
            const sv2 = Y.encodeStateVector(docs[2]);
            const sv3 = Y.encodeStateVector(docs[3]);
            Y.applyUpdate(docs[3], Y.encodeStateAsUpdate(docs[2], sv3));
            Y.applyUpdate(docs[2], Y.encodeStateAsUpdate(docs[3], sv2));
            
            // Verify convergence within partitions
            expect(docs[0].getText('content').toString()).toBe(docs[1].getText('content').toString());
            expect(docs[2].getText('content').toString()).toBe(docs[3].getText('content').toString());
            
            // Heal partition: sync all documents
            syncAllDocs(docs);
            
            // Verify global convergence
            verifyConvergence(docs);
          } finally {
            docs.forEach(doc => doc.destroy());
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should converge with mixed insert and delete operations', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            clientId: fc.constantFrom(0, 1, 2),
            position: fc.nat(50),
            text: fc.string({ minLength: 0, maxLength: 10 }),
            delete: fc.option(fc.nat(5)),
          }),
          { minLength: 3, maxLength: 15 }
        ),
        (edits) => {
          const docs = [new Y.Doc(), new Y.Doc(), new Y.Doc()];
          
          try {
            // Apply edits
            for (let i = 0; i < 3; i++) {
              applyClientEdits(docs[i], edits, i);
            }
            
            // Sync all documents
            syncAllDocs(docs);
            
            // Verify convergence
            verifyConvergence(docs);
          } finally {
            docs.forEach(doc => doc.destroy());
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain convergence after repeated sync cycles', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            clientId: fc.constantFrom(0, 1),
            position: fc.nat(30),
            text: fc.string({ minLength: 1, maxLength: 8 }),
          }),
          { minLength: 2, maxLength: 10 }
        ),
        (edits) => {
          const docs = [new Y.Doc(), new Y.Doc()];
          
          try {
            // Apply edits
            for (let i = 0; i < 2; i++) {
              applyClientEdits(docs[i], edits, i);
            }
            
            // Sync multiple times
            for (let cycle = 0; cycle < 5; cycle++) {
              syncAllDocs(docs);
            }
            
            // Verify convergence
            const text0 = docs[0].getText('content').toString();
            const text1 = docs[1].getText('content').toString();
            
            expect(text0).toBe(text1);
            
            // Content should remain stable
            syncAllDocs(docs);
            expect(docs[0].getText('content').toString()).toBe(text0);
            expect(docs[1].getText('content').toString()).toBe(text1);
          } finally {
            docs.forEach(doc => doc.destroy());
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should converge with late-joining clients', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            clientId: fc.constantFrom(0, 1),
            position: fc.nat(30),
            text: fc.string({ minLength: 1, maxLength: 8 }),
          }),
          { minLength: 2, maxLength: 10 }
        ),
        fc.array(
          fc.record({
            clientId: fc.constant(2),
            position: fc.nat(30),
            text: fc.string({ minLength: 1, maxLength: 8 }),
          }),
          { minLength: 1, maxLength: 5 }
        ),
        (initialEdits, lateEdits) => {
          const docs = [new Y.Doc(), new Y.Doc(), new Y.Doc()];
          
          try {
            // Initial clients apply edits and sync
            for (let i = 0; i < 2; i++) {
              applyClientEdits(docs[i], initialEdits, i);
            }
            syncAllDocs([docs[0], docs[1]]);
            
            // Late-joining client applies edits
            applyClientEdits(docs[2], lateEdits, 2);
            
            // Sync all including late joiner
            syncAllDocs(docs);
            
            // Verify convergence
            verifyConvergence(docs);
          } finally {
            docs.forEach(doc => doc.destroy());
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle empty edits gracefully', () => {
    const docs = [new Y.Doc(), new Y.Doc()];
    
    try {
      // No edits applied
      syncAllDocs(docs);
      
      // Should converge to empty state
      verifyConvergence(docs);
      expect(docs[0].getText('content').toString()).toBe('');
    } finally {
      docs.forEach(doc => doc.destroy());
    }
  });

  it('should preserve idempotency of sync operations', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            clientId: fc.constantFrom(0, 1),
            position: fc.nat(30),
            text: fc.string({ minLength: 1, maxLength: 8 }),
          }),
          { minLength: 2, maxLength: 10 }
        ),
        (edits) => {
          const docs = [new Y.Doc(), new Y.Doc()];
          
          try {
            // Apply edits
            for (let i = 0; i < 2; i++) {
              applyClientEdits(docs[i], edits, i);
            }
            
            // First sync
            syncAllDocs(docs);
            const text1 = docs[0].getText('content').toString();
            
            // Second sync (should be idempotent)
            syncAllDocs(docs);
            const text2 = docs[0].getText('content').toString();
            
            // Third sync (should still be idempotent)
            syncAllDocs(docs);
            const text3 = docs[0].getText('content').toString();
            
            // All should be the same
            expect(text1).toBe(text2);
            expect(text2).toBe(text3);
          } finally {
            docs.forEach(doc => doc.destroy());
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
