/**
 * AI Functionality Property-Based Tests
 * 
 * Feature: comprehensive-feature-audit, Property 1: 功能完整性
 * Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5
 * 
 * Property: For any AI operation (tag suggestion, summarization, Q&A),
 * the system should handle various input types and return valid results
 * or appropriate error messages.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { suggestTags, summarizeNote } from '@/lib/actions/ai';
import { auth } from '@/auth';

// Mock auth
vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

// Mock DeepSeek API
vi.mock('@/lib/ai/deepseek', () => ({
  simpleChat: vi.fn(),
  callDeepSeekWithRetry: vi.fn(),
  DeepSeekError: class DeepSeekError extends Error {
    constructor(message: string, public statusCode?: number, public response?: any) {
      super(message);
      this.name = 'DeepSeekError';
    }
  },
}));

const mockSession = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

describe('AI Functionality Property Tests', () => {
  beforeEach(() => {
    vi.mocked(auth).mockResolvedValue(mockSession as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Property 1: Tag Suggestion Consistency (Requirement 6.2)', () => {
    it('should always return valid tag format for any content', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 500 }),
          fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
          async (content, title) => {
            const { simpleChat } = await import('@/lib/ai/deepseek');
            
            // Mock successful response with valid tags
            vi.mocked(simpleChat).mockResolvedValue('技术,编程,测试,开发,工具');

            const result = await suggestTags(content, title);

            // Property: Result should always be in valid format
            expect(result).toHaveProperty('success');
            
            if (result.success) {
              // Tags should be an array
              expect(Array.isArray(result.data)).toBe(true);
              
              // Each tag should be a non-empty string
              result.data.forEach(tag => {
                expect(typeof tag).toBe('string');
                expect(tag.length).toBeGreaterThan(0);
                expect(tag.length).toBeLessThanOrEqual(20);
              });
              
              // Should not exceed 5 tags
              expect(result.data.length).toBeLessThanOrEqual(5);
            } else {
              // Error should have a message
              expect(typeof result.error).toBe('string');
              expect(result.error.length).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle API errors gracefully for any content', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 500 }),
          async (content) => {
            const { simpleChat, DeepSeekError } = await import('@/lib/ai/deepseek');
            
            // Mock API error
            vi.mocked(simpleChat).mockRejectedValue(
              new DeepSeekError('API error', 500)
            );

            const result = await suggestTags(content);

            // Property: Should always return error result, never throw
            expect(result.success).toBe(false);
            if (!result.success) {
              expect(typeof result.error).toBe('string');
              expect(result.error.length).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Property 2: Summarization Consistency (Requirement 6.1)', () => {
    it('should always return valid summary format for any long content', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 100, maxLength: 2000 }),
          async (content) => {
            const { simpleChat } = await import('@/lib/ai/deepseek');
            
            // Mock successful response
            vi.mocked(simpleChat).mockResolvedValue('这是一个简洁的摘要。');

            const result = await summarizeNote(content);

            // Property: Result should always be in valid format
            expect(result).toHaveProperty('success');
            
            if (result.success) {
              // Summary should be a non-empty string
              expect(typeof result.data).toBe('string');
              expect(result.data.length).toBeGreaterThan(0);
            } else {
              // Error should have a message
              expect(typeof result.error).toBe('string');
              expect(result.error.length).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle empty AI responses gracefully', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 100, maxLength: 2000 }),
          async (content) => {
            const { simpleChat } = await import('@/lib/ai/deepseek');
            
            // Mock empty response
            vi.mocked(simpleChat).mockResolvedValue('   ');

            const result = await summarizeNote(content);

            // Property: Empty responses should be treated as errors
            expect(result.success).toBe(false);
            if (!result.success) {
              expect(result.error).toContain('未能生成有效的摘要');
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Property 3: Input Validation (Requirements 6.1, 6.2)', () => {
    it('should handle invalid/empty content appropriately', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            fc.constant(''),
            fc.constant('   '),
            fc.string({ maxLength: 5 })
          ),
          async (invalidContent) => {
            const { simpleChat } = await import('@/lib/ai/deepseek');
            vi.mocked(simpleChat).mockResolvedValue('tag1,tag2');

            const result = await suggestTags(invalidContent);

            // Property: Should either succeed or fail gracefully, never throw
            expect(result).toHaveProperty('success');
            expect(typeof result.success).toBe('boolean');
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Property 4: Tag Deduplication (Requirement 6.2)', () => {
    it('should deduplicate tags when AI returns duplicates', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 500 }),
          async (content) => {
            const { simpleChat } = await import('@/lib/ai/deepseek');
            
            // Mock response with duplicate tags
            vi.mocked(simpleChat).mockResolvedValue('技术,编程,技术,开发,编程,测试');

            const result = await suggestTags(content);

            if (result.success) {
              // Property: No duplicate tags should exist
              const uniqueTags = new Set(result.data);
              expect(uniqueTags.size).toBe(result.data.length);
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Property 5: Tag Length Constraints (Requirement 6.2)', () => {
    it('should enforce maximum tag length', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 500 }),
          async (content) => {
            const { simpleChat } = await import('@/lib/ai/deepseek');
            
            // Mock response with very long tags
            vi.mocked(simpleChat).mockResolvedValue(
              'verylongtagthatexceedsmaximumlength,anotherlongtagthatistoolong,short'
            );

            const result = await suggestTags(content);

            if (result.success) {
              // Property: All tags should respect length limit
              result.data.forEach(tag => {
                expect(tag.length).toBeLessThanOrEqual(20);
              });
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Property 6: Error Message Clarity (Requirements 6.1, 6.2, 6.5)', () => {
    it('should provide clear error messages for different error types', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(
            { code: 401, message: 'Unauthorized' },
            { code: 429, message: 'Rate limit exceeded' },
            { code: 500, message: 'Internal server error' },
            { code: 503, message: 'Service unavailable' }
          ),
          async (errorConfig) => {
            const { simpleChat, DeepSeekError } = await import('@/lib/ai/deepseek');
            
            vi.mocked(simpleChat).mockRejectedValue(
              new DeepSeekError(errorConfig.message, errorConfig.code)
            );

            const result = await suggestTags('test content');

            // Property: Error messages should be informative
            expect(result.success).toBe(false);
            if (!result.success) {
              expect(result.error).toBeTruthy();
              expect(typeof result.error).toBe('string');
              expect(result.error.length).toBeGreaterThan(0);
              // Should contain some indication of the error
              expect(result.error).toMatch(/错误|失败|问题/);
            }
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('Property 7: Response Format Consistency (Requirements 6.1, 6.2)', () => {
    it('should handle various tag separator formats', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 500 }),
          fc.oneof(
            fc.constant('tag1,tag2,tag3'),
            fc.constant('tag1, tag2, tag3'),
            fc.constant('tag1,  tag2,  tag3'),
            fc.constant('tag1 , tag2 , tag3')
          ),
          async (content, tagResponse) => {
            const { simpleChat } = await import('@/lib/ai/deepseek');
            vi.mocked(simpleChat).mockResolvedValue(tagResponse);

            const result = await suggestTags(content);

            if (result.success) {
              // Property: Should parse tags correctly regardless of spacing
              expect(result.data.length).toBeGreaterThan(0);
              result.data.forEach(tag => {
                // Tags should be trimmed
                expect(tag).toBe(tag.trim());
                expect(tag.length).toBeGreaterThan(0);
              });
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Property 8: Idempotency (Requirements 6.1, 6.2)', () => {
    it('should return consistent results for same input', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 200 }),
          async (content) => {
            const { simpleChat } = await import('@/lib/ai/deepseek');
            const mockResponse = '技术,编程,测试';
            vi.mocked(simpleChat).mockResolvedValue(mockResponse);

            // Call twice with same input
            const result1 = await suggestTags(content);
            
            vi.mocked(simpleChat).mockResolvedValue(mockResponse);
            const result2 = await suggestTags(content);

            // Property: Same input should produce same result structure
            expect(result1.success).toBe(result2.success);
            
            if (result1.success && result2.success) {
              expect(result1.data).toEqual(result2.data);
            }
          }
        ),
        { numRuns: 30 }
      );
    });
  });
});
