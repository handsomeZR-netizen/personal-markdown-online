/**
 * Error Handling Property-Based Tests
 * 
 * Property-based tests for error handling functionality
 * Feature: comprehensive-feature-audit, Property 6: 错误处理完整性
 * Validates: Requirements 16.1, 16.2, 16.3, 16.4, 16.5
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fc } from '@fast-check/vitest';
import {
  AppError,
  ErrorType,
  getErrorMessage,
  handleError,
  withErrorHandling,
  createSafeHandler,
} from '@/lib/error-handler';
import { toast } from 'sonner';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}));

describe('Error Handling Property Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Property 6: Error Handling Completeness', () => {
    /**
     * Property: For any error type and message, the error handler should
     * display a clear error message and log the error
     */
    it('should handle all error types consistently', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...Object.values(ErrorType)),
          fc.string({ minLength: 1, maxLength: 200 }),
          fc.option(fc.integer({ min: 100, max: 599 }), { nil: null }),
          (errorType, message, statusCode) => {
            vi.clearAllMocks();
            vi.spyOn(console, 'error').mockImplementation(() => {});
            
            const error = new AppError(message, errorType, statusCode ?? undefined);
            handleError(error);

            // Should always call toast.error
            expect(toast.error).toHaveBeenCalledWith(message);
            
            // Should always log to console
            expect(console.error).toHaveBeenCalledWith('Error:', error);
            
            // Error should maintain its properties
            expect(error.type).toBe(errorType);
            expect(error.message).toBe(message);
            if (statusCode !== null) {
              expect(error.statusCode).toBe(statusCode);
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: For any error value (Error, string, unknown), getErrorMessage
     * should always return a string
     */
    it('should always return a string message for any error type', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.string({ minLength: 1 }), // Ensure non-empty strings
            fc.constant(new Error('test')),
            fc.constant(new AppError('test', ErrorType.VALIDATION)),
            fc.constant(null),
            fc.constant(undefined),
            fc.integer(),
            fc.object(),
          ),
          (error) => {
            const message = getErrorMessage(error);
            
            expect(typeof message).toBe('string');
            // Empty strings from errors will return default message
            if (typeof error === 'string' && error.length === 0) {
              expect(message).toBe('发生了一个未知错误');
            } else {
              expect(message.length).toBeGreaterThan(0);
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: For any async function that throws, withErrorHandling
     * should catch the error and return null
     */
    it('should catch all errors in async functions', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1 }),
          async (errorMessage) => {
            vi.clearAllMocks();
            vi.spyOn(console, 'error').mockImplementation(() => {});
            
            const fn = vi.fn().mockRejectedValue(new Error(errorMessage));
            const result = await withErrorHandling(fn);

            expect(result).toBeNull();
            expect(toast.error).toHaveBeenCalled();
            expect(console.error).toHaveBeenCalled();
            
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    /**
     * Property: For any successful async function, withErrorHandling
     * should return the result unchanged
     */
    it('should return results unchanged for successful operations', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            fc.string(),
            fc.integer(),
            fc.object(),
            fc.array(fc.anything()),
            fc.constant(null),
            fc.constant(undefined),
          ),
          async (value) => {
            vi.clearAllMocks();
            
            const fn = vi.fn().mockResolvedValue(value);
            const result = await withErrorHandling(fn);

            expect(result).toEqual(value);
            expect(toast.error).not.toHaveBeenCalled();
            
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    /**
     * Property: For any handler function with any arguments, createSafeHandler
     * should catch errors without throwing
     */
    it('should create safe handlers that never throw', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.anything(), { maxLength: 5 }),
          fc.string({ minLength: 1 }),
          async (args, errorMessage) => {
            vi.clearAllMocks();
            vi.spyOn(console, 'error').mockImplementation(() => {});
            
            const handler = vi.fn().mockRejectedValue(new Error(errorMessage));
            const safeHandler = createSafeHandler(handler);

            // Should not throw
            await expect(safeHandler(...args)).resolves.toBeUndefined();
            
            // Should have called the handler
            expect(handler).toHaveBeenCalledWith(...args);
            
            // Should have handled the error
            expect(toast.error).toHaveBeenCalled();
            
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    /**
     * Property: For any custom error message, it should override the original
     * error message
     */
    it('should use custom error messages when provided', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1 }),
          fc.string({ minLength: 1 }),
          async (originalMessage, customMessage) => {
            vi.clearAllMocks();
            vi.spyOn(console, 'error').mockImplementation(() => {});
            
            const fn = vi.fn().mockRejectedValue(new Error(originalMessage));
            await withErrorHandling(fn, customMessage);

            expect(toast.error).toHaveBeenCalledWith(customMessage);
            expect(toast.error).not.toHaveBeenCalledWith(originalMessage);
            
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    /**
     * Property: For any AppError with a status code, the status code should
     * be preserved
     */
    it('should preserve status codes in AppError', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 100, max: 599 }),
          fc.string({ minLength: 1 }),
          (statusCode, message) => {
            const error = new AppError(message, ErrorType.SERVER, statusCode);
            
            expect(error.statusCode).toBe(statusCode);
            expect(error.message).toBe(message);
            expect(error.type).toBe(ErrorType.SERVER);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Error handling should be idempotent - handling the same error
     * multiple times should produce consistent results
     */
    it('should handle errors idempotently', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.constantFrom(...Object.values(ErrorType)),
          (message, errorType) => {
            vi.clearAllMocks();
            vi.spyOn(console, 'error').mockImplementation(() => {});
            
            const error = new AppError(message, errorType);
            
            // Handle error multiple times
            handleError(error);
            const firstCallCount = (toast.error as any).mock.calls.length;
            
            vi.clearAllMocks();
            vi.spyOn(console, 'error').mockImplementation(() => {});
            
            handleError(error);
            const secondCallCount = (toast.error as any).mock.calls.length;
            
            // Should produce same behavior
            expect(firstCallCount).toBe(secondCallCount);
            expect(toast.error).toHaveBeenCalledWith(message);
            
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    /**
     * Property: Error messages should handle empty/null errors consistently
     */
    it('should handle empty or null errors consistently', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant(new Error('')),
            fc.constant(new AppError('', ErrorType.UNKNOWN)),
            fc.constant(''),
            fc.constant(null),
            fc.constant(undefined),
          ),
          (error) => {
            const message = getErrorMessage(error);
            
            // Should always return a string
            expect(typeof message).toBe('string');
            
            // For null/undefined, should return default message
            if (error === null || error === undefined) {
              expect(message).toBe('发生了一个未知错误');
            }
            // For empty string, should return empty string
            else if (typeof error === 'string' && error === '') {
              expect(message).toBe('');
            }
            // For Error with empty message, returns empty string
            else if (error instanceof Error && error.message === '') {
              expect(message).toBe('');
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
