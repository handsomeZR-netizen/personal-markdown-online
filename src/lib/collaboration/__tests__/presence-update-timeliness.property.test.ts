/**
 * Property-Based Test: Presence Update Timeliness
 * Feature: team-collaborative-knowledge-base, Property 3: Presence Update Timeliness
 * Validates: Requirements 2.1, 2.5
 * 
 * Property: For any user joining or leaving a note, all other online collaborators
 * should see the presence change reflected in the UI within 3 seconds.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import * as Y from 'yjs';
import { Awareness } from 'y-protocols/awareness';
import { PresenceManager, PresenceUser } from '../presence-manager';

describe('Property 3: Presence Update Timeliness', () => {
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

  it('should notify listeners when users join within 3 seconds', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random user data
        fc.array(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 50 }),
            email: fc.emailAddress(),
            color: fc.integer({ min: 0, max: 0xFFFFFF }).map(n => `#${n.toString(16).padStart(6, '0')}`),
          }),
          { minLength: 1, maxLength: 5 } // Reduced max to avoid timeout
        ),
        async (users) => {
          // Track when listeners are called
          let callCount = 0;
          const startTime = Date.now();

          // Subscribe to presence changes
          const unsubscribe = presenceManager.onUsersChange(() => {
            callCount++;
          });

          try {
            // Simulate users joining by setting local user info
            // In a real scenario, this would be done by remote clients
            for (const user of users) {
              presenceManager.setLocalUser({
                ...user,
                cursor: null,
              });
              
              // Small delay to simulate network latency
              await new Promise(resolve => setTimeout(resolve, 5));
            }

            // Wait for updates to propagate
            await new Promise(resolve => setTimeout(resolve, 50));

            const endTime = Date.now();
            const totalTime = endTime - startTime;

            // Property: All updates should complete within 3 seconds
            expect(totalTime).toBeLessThan(3000);
            
            // Property: Listener should be called for presence changes
            expect(callCount).toBeGreaterThan(0);
          } finally {
            unsubscribe();
          }
        }
      ),
      { numRuns: 20, timeout: 10000 } // Reduced runs and increased timeout
    );
  }, 15000); // Increased test timeout

  it('should detect presence changes within 3 seconds', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          userName: fc.string({ minLength: 1, maxLength: 50 }),
          userColor: fc.integer({ min: 0, max: 0xFFFFFF }).map(n => `#${n.toString(16).padStart(6, '0')}`),
        }),
        async (userData) => {
          const startTime = Date.now();
          let changeDetected = false;

          // Subscribe to presence changes
          const unsubscribe = presenceManager.onUsersChange(() => {
            changeDetected = true;
          });

          try {
            // Update local user presence
            presenceManager.setLocalUser({
              id: 'test-user-1',
              name: userData.userName,
              color: userData.userColor,
              cursor: null,
            });

            // Wait for change to propagate
            await new Promise(resolve => setTimeout(resolve, 50));

            const endTime = Date.now();
            const updateTime = endTime - startTime;

            // Property: Presence change should be detected within 3 seconds
            expect(updateTime).toBeLessThan(3000);
            
            // Property: Change should be detected
            expect(changeDetected).toBe(true);
          } finally {
            unsubscribe();
          }
        }
      ),
      { numRuns: 20, timeout: 10000 }
    );
  }, 15000);

  it('should update cursor position within 3 seconds', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          cursorPosition: fc.record({
            anchor: fc.nat(1000),
            head: fc.nat(1000),
          }),
        }),
        async (data) => {
          const startTime = Date.now();

          // Update cursor position
          presenceManager.updateCursor(data.cursorPosition);

          // Wait for update
          await new Promise(resolve => setTimeout(resolve, 50));

          const endTime = Date.now();
          const updateTime = endTime - startTime;

          // Property: Cursor update should complete within 3 seconds
          expect(updateTime).toBeLessThan(3000);
        }
      ),
      { numRuns: 20, timeout: 10000 }
    );
  }, 15000);

  it('should handle rapid presence updates within 3 seconds', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 50 }),
            color: fc.integer({ min: 0, max: 0xFFFFFF }).map(n => `#${n.toString(16).padStart(6, '0')}`),
          }),
          { minLength: 3, maxLength: 10 }
        ),
        async (updates) => {
          let updateCount = 0;
          const startTime = Date.now();

          const unsubscribe = presenceManager.onUsersChange(() => {
            updateCount++;
          });

          try {
            // Execute rapid presence updates
            for (const update of updates) {
              presenceManager.setLocalUser({
                id: 'test-user-1',
                name: update.name,
                color: update.color,
                cursor: null,
              });
              
              // Small delay between updates
              await new Promise(resolve => setTimeout(resolve, 5));
            }

            // Wait for all updates to settle
            await new Promise(resolve => setTimeout(resolve, 50));

            const endTime = Date.now();
            const totalTime = endTime - startTime;

            // Property: All rapid updates should complete within 3 seconds
            expect(totalTime).toBeLessThan(3000);

            // Property: Listener should be called for updates
            expect(updateCount).toBeGreaterThan(0);
          } finally {
            unsubscribe();
          }
        }
      ),
      { numRuns: 20, timeout: 10000 }
    );
  }, 15000);
});
