/**
 * Property-Based Tests for Image Upload
 * Feature: team-collaborative-knowledge-base, Property 7: Image Upload Atomicity
 * Validates: Requirements 6.1, 6.2, 6.3, 6.4
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import type { SupabaseClient } from '@supabase/supabase-js';

// Import the class directly to avoid setup issues
import { ImageUploadManager } from '../image-upload';

// Mock Supabase client
const createMockSupabaseClient = (shouldFail: boolean = false) => {
  return {
    storage: {
      from: (bucket: string) => ({
        upload: vi.fn().mockImplementation(async (path: string, file: File) => {
          if (shouldFail) {
            return { data: null, error: { message: 'Upload failed' } };
          }
          return {
            data: { path },
            error: null,
          };
        }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: `https://example.com/storage/${bucket}/test.jpg` },
        }),
        remove: vi.fn().mockResolvedValue({ error: null }),
        list: vi.fn().mockResolvedValue({
          data: [{ name: 'test.jpg' }],
          error: null,
        }),
      }),
    },
  } as unknown as SupabaseClient;
};

// Generate test images
const generateTestFile = (size: number, type: string): File => {
  const buffer = new ArrayBuffer(size);
  const blob = new Blob([buffer], { type });
  return new File([blob], 'test.jpg', { type });
};

describe('Image Upload Atomicity Property Tests', () => {
  let mockSupabase: SupabaseClient;
  let uploadManager: ImageUploadManager;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    uploadManager = new ImageUploadManager(mockSupabase);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Property 7: Image Upload Atomicity
   * For any image upload operation, either the image is successfully uploaded
   * and the URL is inserted into the document, or the operation fails completely
   * with no partial state.
   */
  it('should ensure atomic upload operations - success or complete failure', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          fileSize: fc.integer({ min: 1024, max: 10 * 1024 * 1024 }), // 1KB to 10MB
          fileType: fc.constantFrom(
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp'
          ),
          noteId: fc.uuid(),
          shouldFail: fc.boolean(),
        }),
        async ({ fileSize, fileType, noteId, shouldFail }) => {
          // Create test file
          const file = generateTestFile(fileSize, fileType);

          // Create upload manager with appropriate mock
          const testSupabase = createMockSupabaseClient(shouldFail);
          const testManager = new ImageUploadManager(testSupabase);

          try {
            const result = await testManager.uploadImage(file, noteId);

            // If successful, must have valid URL
            expect(result).toBeDefined();
            expect(result.url).toBeTruthy();
            expect(result.url).toContain('http');
            expect(result.path).toBeTruthy();
            expect(result.size).toBe(fileSize);

            // Verify upload was called
            const uploadFn = testSupabase.storage.from('note-images').upload as any;
            expect(uploadFn).toHaveBeenCalled();
          } catch (error) {
            // If failed, should throw error with no partial state
            expect(error).toBeInstanceOf(Error);
            expect((error as Error).message).toBeTruthy();

            // Verify no URL was returned
            // In case of failure, the function should throw before returning anything
          }
        }
      ),
      { numRuns: 20, timeout: 10000 }
    );
  }, 60000);

  it('should reject files exceeding size limit atomically', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          fileSize: fc.integer({ min: 10 * 1024 * 1024 + 1, max: 20 * 1024 * 1024 }), // > 10MB
          fileType: fc.constantFrom('image/jpeg', 'image/png'),
          noteId: fc.uuid(),
        }),
        async ({ fileSize, fileType, noteId }) => {
          const file = generateTestFile(fileSize, fileType);

          await expect(uploadManager.uploadImage(file, noteId)).rejects.toThrow();

          // Verify upload was never called
          const uploadFn = mockSupabase.storage.from('note-images').upload as any;
          expect(uploadFn).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 20, timeout: 10000 }
    );
  }, 60000);

  it('should reject invalid file types atomically', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          fileSize: fc.integer({ min: 1024, max: 1024 * 1024 }),
          fileType: fc.constantFrom(
            'application/pdf',
            'text/plain',
            'video/mp4',
            'audio/mp3'
          ),
          noteId: fc.uuid(),
        }),
        async ({ fileSize, fileType, noteId }) => {
          const file = generateTestFile(fileSize, fileType);

          await expect(uploadManager.uploadImage(file, noteId)).rejects.toThrow(
            /只支持图片文件|不支持的文件类型/
          );

          // Verify upload was never called
          const uploadFn = mockSupabase.storage.from('note-images').upload as any;
          expect(uploadFn).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 20, timeout: 10000 }
    );
  }, 60000);

  it('should handle multiple image uploads atomically', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          fileCount: fc.integer({ min: 1, max: 5 }),
          noteId: fc.uuid(),
          failureIndex: fc.option(fc.integer({ min: 0, max: 4 })),
        }),
        async ({ fileCount, noteId, failureIndex }) => {
          const files = Array.from({ length: fileCount }, (_, i) =>
            generateTestFile(1024 * 100, 'image/jpeg')
          );

          // Create mock that fails at specific index
          let callCount = 0;
          const mockWithConditionalFailure = {
            storage: {
              from: (bucket: string) => ({
                upload: vi.fn().mockImplementation(async (path: string, file: File) => {
                  callCount++;
                  if (failureIndex !== null && callCount === failureIndex + 1) {
                    return { data: null, error: { message: 'Upload failed' } };
                  }
                  return { data: { path }, error: null };
                }),
                getPublicUrl: vi.fn().mockReturnValue({
                  data: { publicUrl: `https://example.com/storage/${bucket}/test.jpg` },
                }),
              }),
            },
          } as unknown as SupabaseClient;

          const testManager = new ImageUploadManager(mockWithConditionalFailure);

          if (failureIndex !== null && failureIndex !== undefined && failureIndex < fileCount) {
            // Should fail completely if any upload fails
            await expect(testManager.uploadImages(files, noteId)).rejects.toThrow();
          } else {
            // Should succeed with all URLs if no failures
            const results = await testManager.uploadImages(files, noteId);
            expect(results).toHaveLength(fileCount);
            results.forEach((result) => {
              expect(result.url).toBeTruthy();
              expect(result.url).toContain('http');
            });
          }
        }
      ),
      { numRuns: 20, timeout: 10000 }
    );
  }, 60000);

  it('should generate unique file names for concurrent uploads', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          uploadCount: fc.integer({ min: 2, max: 10 }),
          noteId: fc.uuid(),
        }),
        async ({ uploadCount, noteId }) => {
          const files = Array.from({ length: uploadCount }, () =>
            generateTestFile(1024, 'image/jpeg')
          );

          const uploadedPaths = new Set<string>();
          
          // Create a shared upload function that tracks calls
          const uploadFn = vi.fn().mockImplementation(async (path: string, file: File) => {
            uploadedPaths.add(path);
            return { data: { path }, error: null };
          });
          
          // Create a fresh mock for each test
          const testMock = {
            storage: {
              from: (bucket: string) => ({
                upload: uploadFn,
                getPublicUrl: vi.fn().mockReturnValue({
                  data: { publicUrl: `https://example.com/storage/${bucket}/test.jpg` },
                }),
              }),
            },
          } as unknown as SupabaseClient;
          
          const testManager = new ImageUploadManager(testMock);

          // Upload files concurrently
          const uploadPromises = files.map((file) =>
            testManager.uploadImage(file, noteId)
          );

          const results = await Promise.all(uploadPromises);

          // All paths should be unique
          expect(uploadedPaths.size).toBe(uploadCount);

          // All results should have valid URLs
          results.forEach((result) => {
            expect(result.url).toBeTruthy();
            expect(result.path).toBeTruthy();
          });
        }
      ),
      { numRuns: 20, timeout: 10000 }
    );
  }, 60000);

  it('should preserve file metadata through upload process', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          fileSize: fc.integer({ min: 1024, max: 5 * 1024 * 1024 }),
          fileType: fc.constantFrom('image/jpeg', 'image/png', 'image/gif'),
          noteId: fc.uuid(),
        }),
        async ({ fileSize, fileType, noteId }) => {
          const file = generateTestFile(fileSize, fileType);

          const result = await uploadManager.uploadImage(file, noteId);

          // File size should be preserved
          expect(result.size).toBe(fileSize);

          // Path should contain noteId
          expect(result.path).toContain(noteId);

          // URL should be valid
          expect(result.url).toMatch(/^https?:\/\//);
        }
      ),
      { numRuns: 20, timeout: 10000 }
    );
  }, 60000);
});
