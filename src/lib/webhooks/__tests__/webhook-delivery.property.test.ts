/**
 * Property-Based Test: Webhook Delivery Guarantee
 * 
 * Feature: team-collaborative-knowledge-base, Property 15: Webhook Delivery Guarantee
 * Validates: Requirements 18.2, 18.4
 * 
 * Property: For any note modification event, if a webhook is configured,
 * the system should attempt delivery at least 3 times before marking it as failed.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { WebhookManager, type WebhookPayload } from '../webhook-manager';

describe('Property 15: Webhook Delivery Guarantee', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    vi.useFakeTimers();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.useRealTimers();
  });

  it('should attempt delivery at least 3 times before failing', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random webhook payloads
        fc.record({
          event: fc.constantFrom('note.created', 'note.updated', 'note.deleted'),
          noteId: fc.uuid(),
          title: fc.string({ minLength: 1, maxLength: 100 }),
          userId: fc.uuid(),
          userName: fc.string({ minLength: 1, maxLength: 50 }),
          timestamp: fc.integer({ min: Date.parse('2020-01-01'), max: Date.parse('2030-12-31') }).map(ms => new Date(ms).toISOString()),
        }),
        // Generate failure scenarios
        fc.integer({ min: 1, max: 5 }), // Number of failures before success
        async (payload: WebhookPayload, failuresBeforeSuccess: number) => {
          let attemptCount = 0;
          const maxRetries = 3;

          // Mock fetch to fail a certain number of times
          global.fetch = vi.fn(async () => {
            attemptCount++;
            
            if (attemptCount < failuresBeforeSuccess) {
              // Simulate failure
              throw new Error('Network error');
            }
            
            // Success after specified failures
            return new Response(JSON.stringify({ success: true }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            });
          }) as any;

          const webhookManager = new WebhookManager(maxRetries, 100, 1000);
          const resultPromise = webhookManager.sendWebhook(
            'https://example.com/webhook',
            payload
          );

          // Fast-forward timers to handle retries
          await vi.runAllTimersAsync();
          const result = await resultPromise;

          // Property: Should attempt at least 3 times if it keeps failing
          if (failuresBeforeSuccess > maxRetries) {
            // Should fail after exactly maxRetries attempts
            expect(attemptCount).toBe(maxRetries);
            expect(result.success).toBe(false);
            expect(result.attempts).toBe(maxRetries);
          } else {
            // Should succeed after failuresBeforeSuccess attempts
            expect(attemptCount).toBe(failuresBeforeSuccess);
            expect(result.success).toBe(true);
            expect(result.attempts).toBe(failuresBeforeSuccess);
          }

          // Property: Attempts should never exceed maxRetries
          expect(attemptCount).toBeLessThanOrEqual(maxRetries);
        }
      ),
      { numRuns: 100 }
    );
  }, 10000);

  it('should retry with exponential backoff', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          event: fc.constantFrom('note.created', 'note.updated', 'note.deleted'),
          noteId: fc.uuid(),
          title: fc.string({ minLength: 1, maxLength: 100 }),
          userId: fc.uuid(),
          userName: fc.string({ minLength: 1, maxLength: 50 }),
          timestamp: fc.integer({ min: Date.parse('2020-01-01'), max: Date.parse('2030-12-31') }).map(ms => new Date(ms).toISOString()),
        }),
        async (payload: WebhookPayload) => {
          const attemptTimestamps: number[] = [];
          const retryDelay = 100;

          // Mock fetch to always fail
          global.fetch = vi.fn(async () => {
            attemptTimestamps.push(Date.now());
            throw new Error('Network error');
          }) as any;

          const webhookManager = new WebhookManager(3, retryDelay, 1000);
          const resultPromise = webhookManager.sendWebhook(
            'https://example.com/webhook',
            payload
          );

          // Fast-forward timers
          await vi.runAllTimersAsync();
          await resultPromise;

          // Property: Should have exactly 3 attempts
          expect(attemptTimestamps.length).toBe(3);

          // Property: Delays should increase exponentially
          if (attemptTimestamps.length >= 2) {
            const delay1 = attemptTimestamps[1] - attemptTimestamps[0];
            expect(delay1).toBeGreaterThanOrEqual(retryDelay);
          }

          if (attemptTimestamps.length >= 3) {
            const delay2 = attemptTimestamps[2] - attemptTimestamps[1];
            expect(delay2).toBeGreaterThanOrEqual(retryDelay * 2);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle timeout correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          event: fc.constantFrom('note.created', 'note.updated', 'note.deleted'),
          noteId: fc.uuid(),
          title: fc.string({ minLength: 1, maxLength: 100 }),
          userId: fc.uuid(),
          userName: fc.string({ minLength: 1, maxLength: 50 }),
          timestamp: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString()),
        }),
        async (payload: WebhookPayload) => {
          let attemptCount = 0;
          const timeout = 1000;

          // Mock fetch to hang indefinitely
          global.fetch = vi.fn(async (url, options) => {
            attemptCount++;
            
            // Simulate a hanging request that gets aborted
            return new Promise((_, reject) => {
              if (options?.signal) {
                options.signal.addEventListener('abort', () => {
                  reject(new Error('Request aborted'));
                });
              }
            });
          }) as any;

          const webhookManager = new WebhookManager(3, 100, timeout);
          const resultPromise = webhookManager.sendWebhook(
            'https://example.com/webhook',
            payload
          );

          // Fast-forward timers to trigger timeouts
          await vi.runAllTimersAsync();
          const result = await resultPromise;

          // Property: Should fail after 3 attempts due to timeout
          expect(attemptCount).toBe(3);
          expect(result.success).toBe(false);
          expect(result.attempts).toBe(3);
        }
      ),
      { numRuns: 50 } // Fewer runs for timeout tests
    );
  }, 10000);

  it('should succeed on first attempt when webhook responds correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          event: fc.constantFrom('note.created', 'note.updated', 'note.deleted'),
          noteId: fc.uuid(),
          title: fc.string({ minLength: 1, maxLength: 100 }),
          userId: fc.uuid(),
          userName: fc.string({ minLength: 1, maxLength: 50 }),
          timestamp: fc.integer({ min: Date.parse('2020-01-01'), max: Date.parse('2030-12-31') }).map(ms => new Date(ms).toISOString()),
        }),
        async (payload: WebhookPayload) => {
          let attemptCount = 0;

          // Mock fetch to succeed immediately
          global.fetch = vi.fn(async () => {
            attemptCount++;
            return new Response(JSON.stringify({ success: true }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            });
          }) as any;

          const webhookManager = new WebhookManager(3, 100, 1000);
          const result = await webhookManager.sendWebhook(
            'https://example.com/webhook',
            payload
          );

          // Property: Should succeed on first attempt
          expect(attemptCount).toBe(1);
          expect(result.success).toBe(true);
          expect(result.attempts).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle various HTTP error codes with retries', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          event: fc.constantFrom('note.created', 'note.updated', 'note.deleted'),
          noteId: fc.uuid(),
          title: fc.string({ minLength: 1, maxLength: 100 }),
          userId: fc.uuid(),
          userName: fc.string({ minLength: 1, maxLength: 50 }),
          timestamp: fc.integer({ min: Date.parse('2020-01-01'), max: Date.parse('2030-12-31') }).map(ms => new Date(ms).toISOString()),
        }),
        fc.constantFrom(400, 401, 403, 404, 500, 502, 503, 504),
        async (payload: WebhookPayload, statusCode: number) => {
          let attemptCount = 0;

          // Mock fetch to return error status
          global.fetch = vi.fn(async () => {
            attemptCount++;
            return new Response(JSON.stringify({ error: 'Error' }), {
              status: statusCode,
              headers: { 'Content-Type': 'application/json' },
            });
          }) as any;

          const webhookManager = new WebhookManager(3, 100, 1000);
          const resultPromise = webhookManager.sendWebhook(
            'https://example.com/webhook',
            payload
          );

          // Fast-forward timers
          await vi.runAllTimersAsync();
          const result = await resultPromise;

          // Property: Should retry 3 times for any error status
          expect(attemptCount).toBe(3);
          expect(result.success).toBe(false);
          expect(result.attempts).toBe(3);
          expect(result.error).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  }, 10000);
});
