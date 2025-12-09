/**
 * Property-Based Test: Webhook Payload Completeness
 * 
 * Feature: team-collaborative-knowledge-base, Property 16: Webhook Payload Completeness
 * Validates: Requirements 18.3
 * 
 * Property: For any webhook sent, the JSON payload should contain all required fields
 * (noteId, title, event type, userId, userName, timestamp).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { WebhookManager, type WebhookPayload } from '../webhook-manager';

describe('Property 16: Webhook Payload Completeness', () => {
  let originalFetch: typeof global.fetch;
  let capturedPayloads: any[] = [];

  beforeEach(() => {
    originalFetch = global.fetch;
    capturedPayloads = [];
    vi.useFakeTimers();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.useRealTimers();
  });

  it('should include all required fields in webhook payload', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random webhook payloads
        fc.record({
          event: fc.constantFrom('note.created', 'note.updated', 'note.deleted'),
          noteId: fc.uuid(),
          title: fc.string({ minLength: 1, maxLength: 200 }),
          userId: fc.uuid(),
          userName: fc.string({ minLength: 1, maxLength: 100 }),
          timestamp: fc.integer({ min: Date.parse('2020-01-01T00:00:00.000Z'), max: Date.parse('2030-12-31T23:59:59.999Z') }).map(ms => new Date(ms).toISOString()),
        }),
        async (payload: WebhookPayload) => {
          // Mock fetch to capture the payload
          global.fetch = vi.fn(async (url, options) => {
            const body = options?.body;
            if (body) {
              capturedPayloads.push(JSON.parse(body as string));
            }
            
            return new Response(JSON.stringify({ success: true }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            });
          }) as any;

          const webhookManager = new WebhookManager(3, 100, 1000);
          await webhookManager.sendWebhook('https://example.com/webhook', payload);

          // Get the captured payload
          const capturedPayload = capturedPayloads[capturedPayloads.length - 1];

          // Property: All required fields must be present
          expect(capturedPayload).toBeDefined();
          expect(capturedPayload).toHaveProperty('event');
          expect(capturedPayload).toHaveProperty('noteId');
          expect(capturedPayload).toHaveProperty('title');
          expect(capturedPayload).toHaveProperty('userId');
          expect(capturedPayload).toHaveProperty('userName');
          expect(capturedPayload).toHaveProperty('timestamp');

          // Property: Field values must match the input
          expect(capturedPayload.event).toBe(payload.event);
          expect(capturedPayload.noteId).toBe(payload.noteId);
          expect(capturedPayload.title).toBe(payload.title);
          expect(capturedPayload.userId).toBe(payload.userId);
          expect(capturedPayload.userName).toBe(payload.userName);
          expect(capturedPayload.timestamp).toBe(payload.timestamp);

          // Property: Event type must be one of the valid values
          expect(['note.created', 'note.updated', 'note.deleted']).toContain(capturedPayload.event);

          // Property: IDs should be non-empty strings
          expect(capturedPayload.noteId).toBeTruthy();
          expect(capturedPayload.userId).toBeTruthy();
          expect(typeof capturedPayload.noteId).toBe('string');
          expect(typeof capturedPayload.userId).toBe('string');

          // Property: Title and userName should be non-empty strings
          expect(capturedPayload.title).toBeTruthy();
          expect(capturedPayload.userName).toBeTruthy();
          expect(typeof capturedPayload.title).toBe('string');
          expect(typeof capturedPayload.userName).toBe('string');

          // Property: Timestamp should be a valid ISO 8601 string
          expect(capturedPayload.timestamp).toBeTruthy();
          expect(typeof capturedPayload.timestamp).toBe('string');
          expect(() => new Date(capturedPayload.timestamp)).not.toThrow();
          expect(new Date(capturedPayload.timestamp).toISOString()).toBe(capturedPayload.timestamp);

          // Clear for next iteration
          capturedPayloads = [];
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve payload integrity across retries', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          event: fc.constantFrom('note.created', 'note.updated', 'note.deleted'),
          noteId: fc.uuid(),
          title: fc.string({ minLength: 1, maxLength: 200 }),
          userId: fc.uuid(),
          userName: fc.string({ minLength: 1, maxLength: 100 }),
          timestamp: fc.integer({ min: Date.parse('2020-01-01T00:00:00.000Z'), max: Date.parse('2030-12-31T23:59:59.999Z') }).map(ms => new Date(ms).toISOString()),
        }),
        fc.integer({ min: 1, max: 3 }), // Number of failures before success
        async (payload: WebhookPayload, failuresBeforeSuccess: number) => {
          let attemptCount = 0;
          const attemptPayloads: any[] = [];

          // Mock fetch to fail a certain number of times
          global.fetch = vi.fn(async (url, options) => {
            attemptCount++;
            const body = options?.body;
            if (body) {
              attemptPayloads.push(JSON.parse(body as string));
            }
            
            if (attemptCount < failuresBeforeSuccess) {
              throw new Error('Network error');
            }
            
            return new Response(JSON.stringify({ success: true }), {
              status: 200,
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
          await resultPromise;

          // Property: All retry attempts should send identical payloads
          expect(attemptPayloads.length).toBeGreaterThan(0);
          
          for (const attemptPayload of attemptPayloads) {
            expect(attemptPayload.event).toBe(payload.event);
            expect(attemptPayload.noteId).toBe(payload.noteId);
            expect(attemptPayload.title).toBe(payload.title);
            expect(attemptPayload.userId).toBe(payload.userId);
            expect(attemptPayload.userName).toBe(payload.userName);
            expect(attemptPayload.timestamp).toBe(payload.timestamp);
          }

          // Property: All payloads across retries should be identical
          if (attemptPayloads.length > 1) {
            const firstPayload = JSON.stringify(attemptPayloads[0]);
            for (let i = 1; i < attemptPayloads.length; i++) {
              expect(JSON.stringify(attemptPayloads[i])).toBe(firstPayload);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  }, 10000);

  it('should not include extra fields beyond the required ones', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          event: fc.constantFrom('note.created', 'note.updated', 'note.deleted'),
          noteId: fc.uuid(),
          title: fc.string({ minLength: 1, maxLength: 200 }),
          userId: fc.uuid(),
          userName: fc.string({ minLength: 1, maxLength: 100 }),
          timestamp: fc.integer({ min: Date.parse('2020-01-01T00:00:00.000Z'), max: Date.parse('2030-12-31T23:59:59.999Z') }).map(ms => new Date(ms).toISOString()),
        }),
        async (payload: WebhookPayload) => {
          // Mock fetch to capture the payload
          global.fetch = vi.fn(async (url, options) => {
            const body = options?.body;
            if (body) {
              capturedPayloads.push(JSON.parse(body as string));
            }
            
            return new Response(JSON.stringify({ success: true }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            });
          }) as any;

          const webhookManager = new WebhookManager(3, 100, 1000);
          await webhookManager.sendWebhook('https://example.com/webhook', payload);

          const capturedPayload = capturedPayloads[capturedPayloads.length - 1];

          // Property: Payload should only contain the required fields
          const requiredFields = ['event', 'noteId', 'title', 'userId', 'userName', 'timestamp'];
          const actualFields = Object.keys(capturedPayload);
          
          expect(actualFields.sort()).toEqual(requiredFields.sort());

          // Clear for next iteration
          capturedPayloads = [];
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle special characters in payload fields correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          event: fc.constantFrom('note.created', 'note.updated', 'note.deleted'),
          noteId: fc.uuid(),
          // Include special characters that need JSON escaping
          title: fc.string({ minLength: 1, maxLength: 200 }),
          userId: fc.uuid(),
          userName: fc.string({ minLength: 1, maxLength: 100 }),
          timestamp: fc.integer({ min: Date.parse('2020-01-01T00:00:00.000Z'), max: Date.parse('2030-12-31T23:59:59.999Z') }).map(ms => new Date(ms).toISOString()),
        }),
        async (payload: WebhookPayload) => {
          // Mock fetch to capture the payload
          global.fetch = vi.fn(async (url, options) => {
            const body = options?.body;
            if (body) {
              // Verify it's valid JSON
              expect(() => JSON.parse(body as string)).not.toThrow();
              capturedPayloads.push(JSON.parse(body as string));
            }
            
            return new Response(JSON.stringify({ success: true }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            });
          }) as any;

          const webhookManager = new WebhookManager(3, 100, 1000);
          await webhookManager.sendWebhook('https://example.com/webhook', payload);

          const capturedPayload = capturedPayloads[capturedPayloads.length - 1];

          // Property: Special characters should be properly escaped and preserved
          expect(capturedPayload.title).toBe(payload.title);
          expect(capturedPayload.userName).toBe(payload.userName);

          // Property: The payload should be valid JSON
          expect(() => JSON.stringify(capturedPayload)).not.toThrow();

          // Clear for next iteration
          capturedPayloads = [];
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain payload structure for all event types', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('note.created', 'note.updated', 'note.deleted'),
        fc.uuid(),
        fc.string({ minLength: 1, maxLength: 200 }),
        fc.uuid(),
        fc.string({ minLength: 1, maxLength: 100 }),
        async (event, noteId, title, userId, userName) => {
          const payload: WebhookPayload = {
            event: event as 'note.created' | 'note.updated' | 'note.deleted',
            noteId,
            title,
            userId,
            userName,
            timestamp: new Date().toISOString(),
          };

          // Mock fetch to capture the payload
          global.fetch = vi.fn(async (url, options) => {
            const body = options?.body;
            if (body) {
              capturedPayloads.push(JSON.parse(body as string));
            }
            
            return new Response(JSON.stringify({ success: true }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            });
          }) as any;

          const webhookManager = new WebhookManager(3, 100, 1000);
          await webhookManager.sendWebhook('https://example.com/webhook', payload);

          const capturedPayload = capturedPayloads[capturedPayloads.length - 1];

          // Property: All event types should have the same payload structure
          expect(Object.keys(capturedPayload).sort()).toEqual(
            ['event', 'noteId', 'title', 'userId', 'userName', 'timestamp'].sort()
          );

          // Property: Event type should be preserved correctly
          expect(capturedPayload.event).toBe(event);

          // Clear for next iteration
          capturedPayloads = [];
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should send valid JSON that can be parsed by the receiver', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          event: fc.constantFrom('note.created', 'note.updated', 'note.deleted'),
          noteId: fc.uuid(),
          title: fc.string({ minLength: 1, maxLength: 200 }),
          userId: fc.uuid(),
          userName: fc.string({ minLength: 1, maxLength: 100 }),
          timestamp: fc.integer({ min: Date.parse('2020-01-01T00:00:00.000Z'), max: Date.parse('2030-12-31T23:59:59.999Z') }).map(ms => new Date(ms).toISOString()),
        }),
        async (payload: WebhookPayload) => {
          let receivedBody: string | null = null;

          // Mock fetch to capture raw body
          global.fetch = vi.fn(async (url, options) => {
            receivedBody = options?.body as string;
            
            return new Response(JSON.stringify({ success: true }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            });
          }) as any;

          const webhookManager = new WebhookManager(3, 100, 1000);
          await webhookManager.sendWebhook('https://example.com/webhook', payload);

          // Property: Body should be valid JSON
          expect(receivedBody).toBeTruthy();
          expect(() => JSON.parse(receivedBody!)).not.toThrow();

          // Property: Parsed JSON should match the original payload
          const parsedPayload = JSON.parse(receivedBody!);
          expect(parsedPayload).toEqual(payload);

          // Property: Re-stringifying should produce valid JSON
          expect(() => JSON.stringify(parsedPayload)).not.toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });
});
