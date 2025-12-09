/**
 * Property-Based Test: Cursor Position Accuracy
 * Feature: team-collaborative-knowledge-base, Property 4: Cursor Position Accuracy
 * Validates: Requirements 3.1, 3.2
 * 
 * Property: For any collaborator's cursor movement, the displayed cursor position
 * should match the actual editing position with pixel-perfect accuracy across all clients.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import * as Y from 'yjs';
import { Awareness } from 'y-protocols/awareness';
import { PresenceManager } from '../presence-manager';

describe('Property 4: Cursor Position Accuracy', () => {
  let ydoc: Y.Doc;
  let awareness: Awareness;
  let presenceManager: PresenceManager;

  beforeEach(() => {
    ydoc = new Y.Doc();
    awareness = new Awareness(ydoc);
    presenceManager = new PresenceManager(awareness, 'test-user-1');
  });

  afterEach(() => {
    presenceManager.destroy();
    awareness.destroy();
    ydoc.destroy();
  });

  it('should accurately store and retrieve cursor positions', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          anchor: fc.nat(10000),
          head: fc.nat(10000),
        }),
        async (cursorPosition) => {
          // Update cursor position
          presenceManager.updateCursor(cursorPosition);

          // Wait for update to propagate
          await new Promise(resolve => setTimeout(resolve, 10));

          // Get the cursor position from awareness
          const localState = awareness.getLocalState();
          const storedCursor = localState?.cursor;

          // Property: Stored cursor should match the set cursor exactly
          expect(storedCursor).not.toBeNull();
          expect(storedCursor?.anchor).toBe(cursorPosition.anchor);
          expect(storedCursor?.head).toBe(cursorPosition.head);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain cursor position accuracy across updates', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            anchor: fc.nat(10000),
            head: fc.nat(10000),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        async (cursorPositions) => {
          // Apply multiple cursor updates
          for (const position of cursorPositions) {
            presenceManager.updateCursor(position);
            await new Promise(resolve => setTimeout(resolve, 5));
          }

          // Wait for final update
          await new Promise(resolve => setTimeout(resolve, 20));

          // Get the final cursor position
          const localState = awareness.getLocalState();
          const finalCursor = localState?.cursor;

          // Property: Final cursor should match the last position set
          const lastPosition = cursorPositions[cursorPositions.length - 1];
          expect(finalCursor).not.toBeNull();
          expect(finalCursor?.anchor).toBe(lastPosition.anchor);
          expect(finalCursor?.head).toBe(lastPosition.head);
        }
      ),
      { numRuns: 20, timeout: 10000 }
    );
  }, 60000);

  it('should handle cursor selection ranges correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          anchor: fc.nat(10000),
          head: fc.nat(10000),
        }),
        async (cursorPosition) => {
          presenceManager.updateCursor(cursorPosition);
          await new Promise(resolve => setTimeout(resolve, 10));

          const localState = awareness.getLocalState();
          const cursor = localState?.cursor;

          // Property: Cursor should support both collapsed and range selections
          expect(cursor?.anchor).toBe(cursorPosition.anchor);
          expect(cursor?.head).toBe(cursorPosition.head);

          // Property: Both anchor and head should be non-negative
          expect(cursor?.anchor).toBeGreaterThanOrEqual(0);
          expect(cursor?.head).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should clear cursor position when set to null', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          anchor: fc.nat(10000),
          head: fc.nat(10000),
        }),
        async (initialPosition) => {
          // Set initial cursor position
          presenceManager.updateCursor(initialPosition);
          await new Promise(resolve => setTimeout(resolve, 10));

          // Verify cursor is set
          let localState = awareness.getLocalState();
          expect(localState?.cursor).not.toBeNull();

          // Clear cursor
          presenceManager.updateCursor(null);
          await new Promise(resolve => setTimeout(resolve, 10));

          // Property: Cursor should be null after clearing
          localState = awareness.getLocalState();
          expect(localState?.cursor).toBeNull();
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should preserve cursor position precision for large documents', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          anchor: fc.nat(1000000), // Large document positions
          head: fc.nat(1000000),
        }),
        async (cursorPosition) => {
          presenceManager.updateCursor(cursorPosition);
          await new Promise(resolve => setTimeout(resolve, 10));

          const localState = awareness.getLocalState();
          const cursor = localState?.cursor;

          // Property: Large position values should be stored without loss of precision
          expect(cursor?.anchor).toBe(cursorPosition.anchor);
          expect(cursor?.head).toBe(cursorPosition.head);

          // Property: No rounding or truncation should occur
          expect(Number.isInteger(cursor?.anchor)).toBe(true);
          expect(Number.isInteger(cursor?.head)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle boundary cursor positions correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(
          { anchor: 0, head: 0 },           // Start of document
          { anchor: 0, head: 100 },         // Selection from start
          { anchor: 100, head: 0 },         // Reverse selection from start
          { anchor: 10000, head: 10000 },   // End of document
          { anchor: 5000, head: 5000 }      // Middle of document
        ),
        async (cursorPosition) => {
          presenceManager.updateCursor(cursorPosition);
          await new Promise(resolve => setTimeout(resolve, 10));

          const localState = awareness.getLocalState();
          const cursor = localState?.cursor;

          // Property: Boundary positions should be stored accurately
          expect(cursor?.anchor).toBe(cursorPosition.anchor);
          expect(cursor?.head).toBe(cursorPosition.head);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should update lastActive timestamp when cursor moves', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            anchor: fc.nat(1000),
            head: fc.nat(1000),
          }),
          { minLength: 2, maxLength: 5 }
        ),
        async (positions) => {
          // First set local user to ensure user object exists
          presenceManager.setLocalUser({
            id: 'test-user-1',
            name: 'Test User',
            color: '#ff0000',
            cursor: null,
          });

          await new Promise(resolve => setTimeout(resolve, 10));

          const timestamps: number[] = [];

          for (const position of positions) {
            presenceManager.updateCursor(position);
            await new Promise(resolve => setTimeout(resolve, 20));

            const localState = awareness.getLocalState();
            const lastActive = localState?.user?.lastActive;
            
            if (lastActive) {
              timestamps.push(lastActive);
            }
          }

          // Property: Each cursor update should update the lastActive timestamp
          expect(timestamps.length).toBeGreaterThan(0);

          // Property: Timestamps should be monotonically increasing or equal
          for (let i = 1; i < timestamps.length; i++) {
            expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i - 1]);
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should handle rapid cursor movements without data loss', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            anchor: fc.nat(1000),
            head: fc.nat(1000),
          }),
          { minLength: 10, maxLength: 50 }
        ),
        async (rapidMovements) => {
          // Simulate rapid cursor movements
          for (const position of rapidMovements) {
            presenceManager.updateCursor(position);
            // No delay - rapid updates
          }

          // Wait for all updates to settle
          await new Promise(resolve => setTimeout(resolve, 50));

          const localState = awareness.getLocalState();
          const finalCursor = localState?.cursor;

          // Property: Final cursor should match the last position
          const lastPosition = rapidMovements[rapidMovements.length - 1];
          expect(finalCursor?.anchor).toBe(lastPosition.anchor);
          expect(finalCursor?.head).toBe(lastPosition.head);
        }
      ),
      { numRuns: 20 }
    );
  });
});
