/**
 * Error Handling Tests
 * 
 * Tests error handling functionality across the application
 * Validates: Requirements 16.1, 16.2, 16.3, 16.4, 16.5
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  AppError,
  ErrorType,
  getErrorMessage,
  handleError,
  handleSuccess,
  handleInfo,
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

describe('Error Handling Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear console.error mock
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('AppError Class', () => {
    it('should create AppError with message and type', () => {
      const error = new AppError('Test error', ErrorType.VALIDATION);
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Test error');
      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.name).toBe('AppError');
    });

    it('should create AppError with status code', () => {
      const error = new AppError('Not found', ErrorType.NOT_FOUND, 404);
      
      expect(error.statusCode).toBe(404);
    });

    it('should default to UNKNOWN error type', () => {
      const error = new AppError('Unknown error');
      
      expect(error.type).toBe(ErrorType.UNKNOWN);
    });

    it('should support all error types', () => {
      const types = [
        ErrorType.VALIDATION,
        ErrorType.AUTHENTICATION,
        ErrorType.AUTHORIZATION,
        ErrorType.NOT_FOUND,
        ErrorType.SERVER,
        ErrorType.NETWORK,
        ErrorType.UNKNOWN,
      ];

      types.forEach(type => {
        const error = new AppError('Test', type);
        expect(error.type).toBe(type);
      });
    });
  });

  describe('getErrorMessage', () => {
    it('should extract message from AppError', () => {
      const error = new AppError('Custom error', ErrorType.VALIDATION);
      expect(getErrorMessage(error)).toBe('Custom error');
    });

    it('should extract message from standard Error', () => {
      const error = new Error('Standard error');
      expect(getErrorMessage(error)).toBe('Standard error');
    });

    it('should handle string errors', () => {
      expect(getErrorMessage('String error')).toBe('String error');
    });

    it('should handle unknown error types', () => {
      expect(getErrorMessage(null)).toBe('发生了一个未知错误');
      expect(getErrorMessage(undefined)).toBe('发生了一个未知错误');
      expect(getErrorMessage(123)).toBe('发生了一个未知错误');
      expect(getErrorMessage({})).toBe('发生了一个未知错误');
    });
  });

  describe('handleError', () => {
    it('should display error toast with error message', () => {
      const error = new Error('Test error');
      handleError(error);

      expect(toast.error).toHaveBeenCalledWith('Test error');
      expect(console.error).toHaveBeenCalledWith('Error:', error);
    });

    it('should use custom message when provided', () => {
      const error = new Error('Original error');
      handleError(error, 'Custom message');

      expect(toast.error).toHaveBeenCalledWith('Custom message');
    });

    it('should handle AppError with type information', () => {
      const error = new AppError('Validation failed', ErrorType.VALIDATION);
      handleError(error);

      expect(toast.error).toHaveBeenCalledWith('Validation failed');
    });

    it('should handle network errors', () => {
      const error = new AppError('Network error', ErrorType.NETWORK);
      handleError(error);

      expect(toast.error).toHaveBeenCalledWith('Network error');
    });
  });

  describe('handleSuccess', () => {
    it('should display success toast', () => {
      handleSuccess('Operation successful');

      expect(toast.success).toHaveBeenCalledWith('Operation successful');
    });
  });

  describe('handleInfo', () => {
    it('should display info toast', () => {
      handleInfo('Information message');

      expect(toast.info).toHaveBeenCalledWith('Information message');
    });
  });

  describe('withErrorHandling', () => {
    it('should return result on success', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      const result = await withErrorHandling(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalled();
      expect(toast.error).not.toHaveBeenCalled();
    });

    it('should handle errors and return null', async () => {
      const error = new Error('Test error');
      const fn = vi.fn().mockRejectedValue(error);
      const result = await withErrorHandling(fn);

      expect(result).toBeNull();
      expect(toast.error).toHaveBeenCalledWith('Test error');
      expect(console.error).toHaveBeenCalledWith('Error:', error);
    });

    it('should use custom error message', async () => {
      const error = new Error('Original error');
      const fn = vi.fn().mockRejectedValue(error);
      const result = await withErrorHandling(fn, 'Custom error message');

      expect(result).toBeNull();
      expect(toast.error).toHaveBeenCalledWith('Custom error message');
    });

    it('should handle async operations', async () => {
      const fn = async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'delayed result';
      };
      const result = await withErrorHandling(fn);

      expect(result).toBe('delayed result');
    });
  });

  describe('createSafeHandler', () => {
    it('should execute handler successfully', async () => {
      const handler = vi.fn().mockResolvedValue(undefined);
      const safeHandler = createSafeHandler(handler);

      await safeHandler('arg1', 'arg2');

      expect(handler).toHaveBeenCalledWith('arg1', 'arg2');
      expect(toast.error).not.toHaveBeenCalled();
    });

    it('should catch and handle errors', async () => {
      const error = new Error('Handler error');
      const handler = vi.fn().mockRejectedValue(error);
      const safeHandler = createSafeHandler(handler);

      await safeHandler();

      expect(toast.error).toHaveBeenCalledWith('Handler error');
      expect(console.error).toHaveBeenCalledWith('Error:', error);
    });

    it('should use custom error message', async () => {
      const error = new Error('Original error');
      const handler = vi.fn().mockRejectedValue(error);
      const safeHandler = createSafeHandler(handler, 'Custom handler error');

      await safeHandler();

      expect(toast.error).toHaveBeenCalledWith('Custom handler error');
    });

    it('should pass arguments to handler', async () => {
      const handler = vi.fn().mockResolvedValue(undefined);
      const safeHandler = createSafeHandler(handler);

      await safeHandler(1, 'test', { key: 'value' });

      expect(handler).toHaveBeenCalledWith(1, 'test', { key: 'value' });
    });

    it('should handle form submission errors', async () => {
      const handler = async (formData: FormData) => {
        throw new AppError('Validation failed', ErrorType.VALIDATION);
      };
      const safeHandler = createSafeHandler(handler);
      const formData = new FormData();

      await safeHandler(formData);

      expect(toast.error).toHaveBeenCalledWith('Validation failed');
    });
  });

  describe('Network Error Handling', () => {
    it('should handle fetch errors', async () => {
      const fetchError = new TypeError('Failed to fetch');
      const fn = vi.fn().mockRejectedValue(fetchError);
      
      await withErrorHandling(fn, '网络连接失败，请检查您的网络');

      expect(toast.error).toHaveBeenCalledWith('网络连接失败，请检查您的网络');
    });

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('Request timeout');
      const fn = vi.fn().mockRejectedValue(timeoutError);
      
      await withErrorHandling(fn, '请求超时，请重试');

      expect(toast.error).toHaveBeenCalledWith('请求超时，请重试');
    });

    it('should handle 404 errors', async () => {
      const notFoundError = new AppError('Resource not found', ErrorType.NOT_FOUND, 404);
      const fn = vi.fn().mockRejectedValue(notFoundError);
      
      await withErrorHandling(fn);

      expect(toast.error).toHaveBeenCalledWith('Resource not found');
    });

    it('should handle 500 errors', async () => {
      const serverError = new AppError('Internal server error', ErrorType.SERVER, 500);
      const fn = vi.fn().mockRejectedValue(serverError);
      
      await withErrorHandling(fn);

      expect(toast.error).toHaveBeenCalledWith('Internal server error');
    });
  });

  describe('Database Error Handling', () => {
    it('should handle connection errors', async () => {
      const dbError = new Error('Connection refused');
      const fn = vi.fn().mockRejectedValue(dbError);
      
      await withErrorHandling(fn, '数据库连接失败');

      expect(toast.error).toHaveBeenCalledWith('数据库连接失败');
    });

    it('should handle query errors', async () => {
      const queryError = new Error('Invalid query');
      const fn = vi.fn().mockRejectedValue(queryError);
      
      await withErrorHandling(fn, '数据查询失败');

      expect(toast.error).toHaveBeenCalledWith('数据查询失败');
    });

    it('should handle constraint violations', async () => {
      const constraintError = new Error('Unique constraint violation');
      const fn = vi.fn().mockRejectedValue(constraintError);
      
      await withErrorHandling(fn, '数据已存在');

      expect(toast.error).toHaveBeenCalledWith('数据已存在');
    });
  });

  describe('Upload Error Handling', () => {
    it('should handle file size errors', async () => {
      const sizeError = new AppError('File too large', ErrorType.VALIDATION);
      const fn = vi.fn().mockRejectedValue(sizeError);
      
      await withErrorHandling(fn);

      expect(toast.error).toHaveBeenCalledWith('File too large');
    });

    it('should handle file type errors', async () => {
      const typeError = new AppError('Invalid file type', ErrorType.VALIDATION);
      const fn = vi.fn().mockRejectedValue(typeError);
      
      await withErrorHandling(fn);

      expect(toast.error).toHaveBeenCalledWith('Invalid file type');
    });

    it('should handle upload failures with retry option', async () => {
      const uploadError = new Error('Upload failed');
      const fn = vi.fn().mockRejectedValue(uploadError);
      
      await withErrorHandling(fn, '上传失败，请重试');

      expect(toast.error).toHaveBeenCalledWith('上传失败，请重试');
    });
  });

  describe('Permission Error Handling', () => {
    it('should handle authentication errors', async () => {
      const authError = new AppError('Not authenticated', ErrorType.AUTHENTICATION, 401);
      const fn = vi.fn().mockRejectedValue(authError);
      
      await withErrorHandling(fn);

      expect(toast.error).toHaveBeenCalledWith('Not authenticated');
    });

    it('should handle authorization errors', async () => {
      const authzError = new AppError('Not authorized', ErrorType.AUTHORIZATION, 403);
      const fn = vi.fn().mockRejectedValue(authzError);
      
      await withErrorHandling(fn);

      expect(toast.error).toHaveBeenCalledWith('Not authorized');
    });

    it('should provide clear permission error messages', async () => {
      const permError = new AppError('You do not have permission to edit this note', ErrorType.AUTHORIZATION);
      const fn = vi.fn().mockRejectedValue(permError);
      
      await withErrorHandling(fn);

      expect(toast.error).toHaveBeenCalledWith('You do not have permission to edit this note');
    });
  });

  describe('Error Recovery', () => {
    it('should allow retry after error', async () => {
      let callCount = 0;
      const fn = vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          throw new Error('First attempt failed');
        }
        return 'success';
      });

      // First attempt fails
      const result1 = await withErrorHandling(fn);
      expect(result1).toBeNull();
      expect(toast.error).toHaveBeenCalledWith('First attempt failed');

      // Second attempt succeeds
      const result2 = await withErrorHandling(fn);
      expect(result2).toBe('success');
    });

    it('should preserve input content on error', async () => {
      const inputData = { title: 'Test', content: 'Content' };
      const handler = vi.fn().mockRejectedValue(new Error('Save failed'));
      const safeHandler = createSafeHandler(handler);

      await safeHandler(inputData);

      // Verify handler was called with original data
      expect(handler).toHaveBeenCalledWith(inputData);
      expect(toast.error).toHaveBeenCalled();
    });
  });

  describe('Error Logging', () => {
    it('should log errors to console', async () => {
      const error = new Error('Test error');
      const fn = vi.fn().mockRejectedValue(error);
      
      await withErrorHandling(fn);

      expect(console.error).toHaveBeenCalledWith('Error:', error);
    });

    it('should log error details for debugging', () => {
      const error = new AppError('Detailed error', ErrorType.VALIDATION, 400);
      handleError(error);

      expect(console.error).toHaveBeenCalledWith('Error:', error);
    });
  });
});
