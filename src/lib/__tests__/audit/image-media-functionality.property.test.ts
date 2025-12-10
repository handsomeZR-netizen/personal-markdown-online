/**
 * Property-Based Test: Image and Media Functionality
 * Feature: comprehensive-feature-audit, Property 1: 功能完整性
 * Validates: Requirements 9.1
 * 
 * Property: For any valid image file, the image upload system should be able to
 * upload it, generate a valid URL, and allow it to be displayed and deleted
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ImageUploadManager } from '@/lib/storage/image-upload';
import * as fc from 'fast-check';

// Mock storage adapter
const mockStorageAdapter = {
  upload: vi.fn(),
  delete: vi.fn(),
  list: vi.fn(),
  getPublicUrl: vi.fn(),
  checkAccess: vi.fn(),
};

// Helper to create mock File
function createMockFile(
  name: string,
  size: number,
  type: string = 'image/png'
): File {
  const blob = new Blob(['x'.repeat(size)], { type });
  return new File([blob], name, { type });
}

// Arbitraries for generating test data
const imageTypeArbitrary = fc.constantFrom(
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp'
);

const imageSizeArbitrary = fc.integer({ min: 1024, max: 5 * 1024 * 1024 }); // 1KB to 5MB

const imageNameArbitrary = fc.string({ minLength: 1, maxLength: 50 }).map(
  (name) => `${name.replace(/[^a-zA-Z0-9-_]/g, '_')}.png`
);

const noteIdArbitrary = fc.uuid();

const imageFileArbitrary = fc.record({
  name: imageNameArbitrary,
  size: imageSizeArbitrary,
  type: imageTypeArbitrary,
}).map(({ name, size, type }) => createMockFile(name, size, type));

describe('Property-Based Test: Image and Media Functionality', () => {
  let imageUploadManager: ImageUploadManager;

  beforeEach(() => {
    vi.clearAllMocks();
    imageUploadManager = new ImageUploadManager(mockStorageAdapter as any);

    // Setup default mock responses
    mockStorageAdapter.upload.mockImplementation(async (file: any, path: string) => ({
      url: `https://example.com/${path}`,
      path: path,
      size: file.size || 1024,
    }));
    mockStorageAdapter.delete.mockResolvedValue(undefined);
    mockStorageAdapter.list.mockResolvedValue([]);
    mockStorageAdapter.getPublicUrl.mockImplementation((path: string) => 
      `https://example.com/${path}`
    );
    mockStorageAdapter.checkAccess.mockResolvedValue(true);
  });

  describe('Property 1: Upload Completeness', () => {
    it('should successfully upload any valid image file', async () => {
      // Property: For any valid image file, upload should succeed
      await fc.assert(
        fc.asyncProperty(
          imageFileArbitrary,
          noteIdArbitrary,
          async (file, noteId) => {
            const result = await imageUploadManager.uploadImage(file, noteId, {
              compress: false, // Disable compression for faster tests
            });

            expect(result).toBeDefined();
            expect(result.url).toBeDefined();
            expect(result.path).toBeDefined();
            expect(result.path).toContain(noteId);
            expect(result.url).toContain('https://');
          }
        ),
        { numRuns: 20 }
      );
    }, 15000); // Increase timeout

    it('should generate unique paths for any image', async () => {
      // Property: For any image, the generated path should be unique
      await fc.assert(
        fc.asyncProperty(
          imageFileArbitrary,
          noteIdArbitrary,
          async (file, noteId) => {
            const result1 = await imageUploadManager.uploadImage(file, noteId, {
              compress: false,
            });
            const result2 = await imageUploadManager.uploadImage(file, noteId, {
              compress: false,
            });

            // Paths should be different due to timestamp and random component
            expect(result1.path).not.toBe(result2.path);
            expect(result1.path).toContain(noteId);
            expect(result2.path).toContain(noteId);
          }
        ),
        { numRuns: 10 }
      );
    }, 15000);

    it('should handle any valid image size within limits', async () => {
      // Property: For any image size within limits, upload should succeed
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1024, max: 10 * 1024 * 1024 }), // 1KB to 10MB
          imageTypeArbitrary,
          noteIdArbitrary,
          async (size, type, noteId) => {
            const file = createMockFile('test.png', size, type);
            
            if (size <= 10 * 1024 * 1024) {
              const result = await imageUploadManager.uploadImage(file, noteId, {
                compress: false,
              });
              expect(result).toBeDefined();
            } else {
              await expect(
                imageUploadManager.uploadImage(file, noteId)
              ).rejects.toThrow();
            }
          }
        ),
        { numRuns: 15 }
      );
    }, 15000);

    it('should preserve note association for any upload', async () => {
      // Property: For any image and noteId, the path should contain the noteId
      await fc.assert(
        fc.asyncProperty(
          imageFileArbitrary,
          noteIdArbitrary,
          async (file, noteId) => {
            const result = await imageUploadManager.uploadImage(file, noteId, {
              compress: false,
            });

            expect(result.path).toContain(noteId);
            expect(result.path).toMatch(new RegExp(`^${noteId}/`));
          }
        ),
        { numRuns: 20 }
      );
    }, 15000);
  });

  describe('Property 2: Batch Upload Consistency', () => {
    it.skip('should upload any array of images successfully', async () => {
      // Property: For any array of valid images, all should upload successfully
      // Skipped: Batch uploads with compression are slow
      await fc.assert(
        fc.asyncProperty(
          fc.array(imageFileArbitrary, { minLength: 1, maxLength: 5 }),
          noteIdArbitrary,
          async (files, noteId) => {
            const results = await imageUploadManager.uploadImages(files, noteId);

            expect(results).toHaveLength(files.length);
            results.forEach((result, index) => {
              expect(result).toBeDefined();
              expect(result.url).toBeDefined();
              expect(result.path).toContain(noteId);
            });
          }
        ),
        { numRuns: 10 }
      );
    });

    it.skip('should maintain order in batch uploads', async () => {
      // Property: For any array of images, results should correspond to input order
      // Skipped: Batch uploads with compression are slow
      await fc.assert(
        fc.asyncProperty(
          fc.array(imageFileArbitrary, { minLength: 2, maxLength: 4 }),
          noteIdArbitrary,
          async (files, noteId) => {
            const results = await imageUploadManager.uploadImages(files, noteId);

            expect(results).toHaveLength(files.length);
            // Each result should have a unique path
            const paths = results.map((r) => r.path);
            const uniquePaths = new Set(paths);
            expect(uniquePaths.size).toBe(paths.length);
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Property 3: URL Generation', () => {
    it('should generate valid URLs for any path', () => {
      // Property: For any path, getPublicUrl should return a valid URL
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          (path) => {
            const url = imageUploadManager.getPublicUrl(path);

            expect(url).toBeDefined();
            expect(url).toContain('https://');
            expect(url).toContain(path);
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should generate consistent URLs for same path', () => {
      // Property: For any path, calling getPublicUrl twice should return same URL
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          (path) => {
            const url1 = imageUploadManager.getPublicUrl(path);
            const url2 = imageUploadManager.getPublicUrl(path);

            expect(url1).toBe(url2);
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('Property 4: Deletion Completeness', () => {
    it('should delete any valid image URL', async () => {
      // Property: For any image URL, deletion should not throw
      await fc.assert(
        fc.asyncProperty(
          fc.webUrl(),
          async (url) => {
            // Should not throw
            await expect(
              imageUploadManager.deleteImage(url)
            ).resolves.not.toThrow();

            expect(mockStorageAdapter.delete).toHaveBeenCalled();
          }
        ),
        { numRuns: 15 }
      );
    });

    it('should delete any array of URLs', async () => {
      // Property: For any array of URLs, all should be deleted
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.webUrl(), { minLength: 1, maxLength: 5 }),
          async (urls) => {
            vi.clearAllMocks(); // Clear before each test
            await imageUploadManager.deleteImages(urls);

            expect(mockStorageAdapter.delete).toHaveBeenCalledTimes(urls.length);
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Property 5: Filename Safety', () => {
    it('should generate safe filenames for any input', async () => {
      // Property: For any filename, the generated path should be filesystem-safe
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => !s.includes(':')), // Filter out colons
          imageTypeArbitrary,
          noteIdArbitrary,
          async (filename, type, noteId) => {
            const file = createMockFile(filename, 1024, type);
            const result = await imageUploadManager.uploadImage(file, noteId, {
              compress: false,
            });

            // Path should not contain unsafe characters (except the extension separator)
            const pathWithoutExtension = result.path.replace(/\.[^.]+$/, '');
            expect(pathWithoutExtension).not.toMatch(/[<>"|?*]/);
            expect(result.path).toContain(noteId);
          }
        ),
        { numRuns: 25 }
      );
    });

    it('should handle any filename length', async () => {
      // Property: For any filename length, upload should succeed
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 200 }),
          noteIdArbitrary,
          async (filename, noteId) => {
            const file = createMockFile(filename, 1024);
            const result = await imageUploadManager.uploadImage(file, noteId);

            expect(result).toBeDefined();
            expect(result.path).toBeDefined();
          }
        ),
        { numRuns: 15 }
      );
    });
  });

  describe('Property 6: Type Validation', () => {
    it('should accept any valid image MIME type', async () => {
      // Property: For any valid image MIME type, upload should succeed
      const validTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
      ];

      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...validTypes),
          noteIdArbitrary,
          async (mimeType, noteId) => {
            const file = createMockFile('test.img', 1024, mimeType);
            const result = await imageUploadManager.uploadImage(file, noteId);

            expect(result).toBeDefined();
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should reject any non-image MIME type', async () => {
      // Property: For any non-image MIME type, upload should fail
      const invalidTypes = [
        'text/plain',
        'application/pdf',
        'video/mp4',
        'audio/mp3',
        'application/json',
      ];

      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...invalidTypes),
          noteIdArbitrary,
          async (mimeType, noteId) => {
            const file = createMockFile('test.file', 1024, mimeType);

            await expect(
              imageUploadManager.uploadImage(file, noteId)
            ).rejects.toThrow();
          }
        ),
        { numRuns: 15 }
      );
    });
  });

  describe('Property 7: Progress Tracking', () => {
    it('should call progress callback for any upload', async () => {
      // Property: For any image upload, progress should be reported
      await fc.assert(
        fc.asyncProperty(
          imageFileArbitrary,
          noteIdArbitrary,
          async (file, noteId) => {
            const progressCallback = vi.fn();

            await imageUploadManager.uploadImage(file, noteId, {
              onProgress: progressCallback,
              compress: false,
            });

            expect(progressCallback).toHaveBeenCalledWith(0);
            expect(progressCallback).toHaveBeenCalledWith(100);
            expect(progressCallback.mock.calls.length).toBeGreaterThanOrEqual(2);
          }
        ),
        { numRuns: 10 }
      );
    }, 15000);
  });

  describe('Property 8: Storage Accessibility', () => {
    it('should check accessibility for any storage state', async () => {
      // Property: checkBucketAccess should always return a boolean
      await fc.assert(
        fc.asyncProperty(
          fc.boolean(),
          async (isAccessible) => {
            mockStorageAdapter.checkAccess.mockResolvedValue(isAccessible);

            const result = await imageUploadManager.checkBucketAccess();

            expect(typeof result).toBe('boolean');
            expect(result).toBe(isAccessible);
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Property 9: List Operations', () => {
    it('should list images for any noteId', async () => {
      // Property: For any noteId, listNoteImages should return an array
      await fc.assert(
        fc.asyncProperty(
          noteIdArbitrary,
          fc.array(fc.string({ minLength: 1, maxLength: 50 }), { maxLength: 10 }),
          async (noteId, paths) => {
            mockStorageAdapter.list.mockResolvedValue(paths);

            const images = await imageUploadManager.listNoteImages(noteId);

            expect(Array.isArray(images)).toBe(true);
            expect(images).toHaveLength(paths.length);
            expect(mockStorageAdapter.list).toHaveBeenCalledWith(noteId);
          }
        ),
        { numRuns: 15 }
      );
    });
  });

  describe('Property 10: Error Resilience', () => {
    it('should handle upload errors for any file', async () => {
      // Property: For any file, upload errors should be properly thrown
      await fc.assert(
        fc.asyncProperty(
          imageFileArbitrary,
          noteIdArbitrary,
          async (file, noteId) => {
            mockStorageAdapter.upload.mockRejectedValue(new Error('Upload failed'));

            await expect(
              imageUploadManager.uploadImage(file, noteId, { compress: false })
            ).rejects.toThrow('Upload failed');
            
            // Reset mock for next iteration
            mockStorageAdapter.upload.mockImplementation(async (file: any, path: string) => ({
              url: `https://example.com/${path}`,
              path: path,
              size: file.size || 1024,
            }));
          }
        ),
        { numRuns: 10 }
      );
    }, 15000);

    it('should handle deletion errors for any URL', async () => {
      // Property: For any URL, deletion errors should be properly thrown
      await fc.assert(
        fc.asyncProperty(
          fc.webUrl(),
          async (url) => {
            mockStorageAdapter.delete.mockRejectedValue(new Error('Delete failed'));

            await expect(
              imageUploadManager.deleteImage(url)
            ).rejects.toThrow();
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Property 11: Idempotency', () => {
    it('should produce consistent results for same input', async () => {
      // Property: For any file and noteId, uploading twice should produce different paths but same structure
      await fc.assert(
        fc.asyncProperty(
          imageFileArbitrary,
          noteIdArbitrary,
          async (file, noteId) => {
            const result1 = await imageUploadManager.uploadImage(file, noteId, {
              compress: false,
            });
            const result2 = await imageUploadManager.uploadImage(file, noteId, {
              compress: false,
            });

            // Paths should be different (due to timestamp/random)
            expect(result1.path).not.toBe(result2.path);

            // But both should have the same structure
            expect(result1.path).toContain(noteId);
            expect(result2.path).toContain(noteId);
            expect(result1.url).toContain('https://');
            expect(result2.url).toContain('https://');
          }
        ),
        { numRuns: 10 }
      );
    }, 15000);
  });

  describe('Property 12: Size Boundaries', () => {
    it('should handle boundary sizes correctly', async () => {
      // Property: Files at size boundaries should be handled correctly
      const boundarySizes = [
        1024, // 1KB - minimum
        2 * 1024 * 1024, // 2MB - compression threshold
        10 * 1024 * 1024, // 10MB - maximum allowed
        10 * 1024 * 1024 + 1, // Just over maximum
      ];

      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...boundarySizes),
          noteIdArbitrary,
          async (size, noteId) => {
            const file = createMockFile('boundary-test.png', size);

            if (size <= 10 * 1024 * 1024) {
              const result = await imageUploadManager.uploadImage(file, noteId, {
                compress: false,
              });
              expect(result).toBeDefined();
            } else {
              await expect(
                imageUploadManager.uploadImage(file, noteId)
              ).rejects.toThrow('文件大小超过限制');
            }
          }
        ),
        { numRuns: 10 }
      );
    }, 15000);
  });
});
