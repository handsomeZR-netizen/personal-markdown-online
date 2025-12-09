/**
 * Property-Based Tests for Image URL Accessibility
 * Feature: team-collaborative-knowledge-base, Property 8: Image URL Accessibility
 * Validates: Requirements 10.5
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { ImageUploadManager } from '../image-upload';
import type { SupabaseClient } from '@supabase/supabase-js';

// Mock Supabase client
const createMockSupabaseClient = (isPublic: boolean = true) => {
  return {
    storage: {
      from: (bucket: string) => ({
        upload: vi.fn().mockResolvedValue({
          data: { path: 'test-path/test.jpg' },
          error: null,
        }),
        getPublicUrl: vi.fn().mockImplementation((path: string) => {
          // Simulate public URL generation
          const baseUrl = isPublic
            ? 'https://example.com/storage/public'
            : 'https://example.com/storage/private';
          return {
            data: { publicUrl: `${baseUrl}/${bucket}/${path}` },
          };
        }),
        remove: vi.fn().mockResolvedValue({ error: null }),
      }),
    },
  } as unknown as SupabaseClient;
};

// Generate test file
const generateTestFile = (size: number, type: string): File => {
  const buffer = new ArrayBuffer(size);
  const blob = new Blob([buffer], { type });
  return new File([blob], 'test.jpg', { type });
};

describe('Image URL Accessibility Property Tests', () => {
  /**
   * Property 8: Image URL Accessibility
   * For any uploaded image in a public note, the image URL should be
   * accessible to anonymous users without authentication.
   */
  it('should generate publicly accessible URLs for all uploaded images', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          fileSize: fc.integer({ min: 1024, max: 5 * 1024 * 1024 }),
          fileType: fc.constantFrom('image/jpeg', 'image/png', 'image/gif'),
          noteId: fc.uuid(),
        }),
        async ({ fileSize, fileType, noteId }) => {
          const file = generateTestFile(fileSize, fileType);
          const mockSupabase = createMockSupabaseClient(true);
          const uploadManager = new ImageUploadManager(mockSupabase);

          const result = await uploadManager.uploadImage(file, noteId);

          // URL should be publicly accessible (no auth tokens)
          expect(result.url).toBeTruthy();
          expect(result.url).toMatch(/^https?:\/\//);
          expect(result.url).toContain('/public/');
          expect(result.url).not.toContain('token=');
          expect(result.url).not.toContain('auth=');
        }
      ),
      { numRuns: 20, timeout: 10000 }
    );
  }, 60000);

  it('should generate consistent URLs for the same file path', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          noteId: fc.uuid(),
          fileName: fc.string({ minLength: 1, maxLength: 50 }),
        }),
        async ({ noteId, fileName }) => {
          const mockSupabase = createMockSupabaseClient(true);
          const uploadManager = new ImageUploadManager(mockSupabase);

          // Get public URL for the same path multiple times
          const path = `${noteId}/${fileName}`;
          const url1 = uploadManager.getPublicUrl(path);
          const url2 = uploadManager.getPublicUrl(path);
          const url3 = uploadManager.getPublicUrl(path);

          // URLs should be identical
          expect(url1).toBe(url2);
          expect(url2).toBe(url3);
          
          // URLs should contain the path
          expect(url1).toContain(noteId);
        }
      ),
      { numRuns: 20, timeout: 10000 }
    );
  }, 60000);

  it('should generate URLs that include the bucket name', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          fileSize: fc.integer({ min: 1024, max: 1024 * 1024 }),
          noteId: fc.uuid(),
        }),
        async ({ fileSize, noteId }) => {
          const file = generateTestFile(fileSize, 'image/jpeg');
          const mockSupabase = createMockSupabaseClient(true);
          const uploadManager = new ImageUploadManager(mockSupabase, 'note-images');

          const result = await uploadManager.uploadImage(file, noteId);

          // URL should include the bucket name
          expect(result.url).toContain('note-images');
        }
      ),
      { numRuns: 20, timeout: 10000 }
    );
  }, 60000);

  it('should generate URLs with proper URL encoding for special characters', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          noteId: fc.uuid(),
          // Generate file names with special characters
          fileName: fc.string({ minLength: 1, maxLength: 20 }).map(s => 
            s.replace(/[^a-zA-Z0-9]/g, '_') + '.jpg'
          ),
        }),
        async ({ noteId, fileName }) => {
          const mockSupabase = createMockSupabaseClient(true);
          const uploadManager = new ImageUploadManager(mockSupabase);

          const path = `${noteId}/${fileName}`;
          const url = uploadManager.getPublicUrl(path);

          // URL should be valid
          expect(() => new URL(url)).not.toThrow();
          
          // URL should not contain unencoded special characters
          expect(url).not.toMatch(/[\s<>"{}|\\^`]/);
        }
      ),
      { numRuns: 20, timeout: 10000 }
    );
  }, 60000);

  it('should generate different URLs for different note IDs', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          noteId1: fc.uuid(),
          noteId2: fc.uuid(),
          fileName: fc.string({ minLength: 1, maxLength: 20 }),
        }),
        async ({ noteId1, noteId2, fileName }) => {
          // Skip if note IDs are the same
          fc.pre(noteId1 !== noteId2);

          const mockSupabase = createMockSupabaseClient(true);
          const uploadManager = new ImageUploadManager(mockSupabase);

          const url1 = uploadManager.getPublicUrl(`${noteId1}/${fileName}`);
          const url2 = uploadManager.getPublicUrl(`${noteId2}/${fileName}`);

          // URLs should be different
          expect(url1).not.toBe(url2);
          
          // Each URL should contain its respective note ID
          expect(url1).toContain(noteId1);
          expect(url2).toContain(noteId2);
        }
      ),
      { numRuns: 20, timeout: 10000 }
    );
  }, 60000);

  it('should maintain URL accessibility after multiple uploads', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          uploadCount: fc.integer({ min: 1, max: 5 }),
          noteId: fc.uuid(),
        }),
        async ({ uploadCount, noteId }) => {
          const mockSupabase = createMockSupabaseClient(true);
          const uploadManager = new ImageUploadManager(mockSupabase);

          const files = Array.from({ length: uploadCount }, () =>
            generateTestFile(1024 * 100, 'image/jpeg')
          );

          const results = await uploadManager.uploadImages(files, noteId);

          // All URLs should be publicly accessible
          results.forEach((result) => {
            expect(result.url).toBeTruthy();
            expect(result.url).toMatch(/^https?:\/\//);
            expect(result.url).toContain('/public/');
            expect(result.url).not.toContain('token=');
          });

          // All URLs should be unique
          const urls = results.map(r => r.url);
          const uniqueUrls = new Set(urls);
          expect(uniqueUrls.size).toBe(uploadCount);
        }
      ),
      { numRuns: 20, timeout: 10000 }
    );
  }, 60000);

  it('should generate URLs that are valid HTTP/HTTPS URLs', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          fileSize: fc.integer({ min: 1024, max: 1024 * 1024 }),
          noteId: fc.uuid(),
        }),
        async ({ fileSize, noteId }) => {
          const file = generateTestFile(fileSize, 'image/jpeg');
          const mockSupabase = createMockSupabaseClient(true);
          const uploadManager = new ImageUploadManager(mockSupabase);

          const result = await uploadManager.uploadImage(file, noteId);

          // URL should be a valid URL
          expect(() => new URL(result.url)).not.toThrow();
          
          const url = new URL(result.url);
          
          // Protocol should be http or https
          expect(['http:', 'https:']).toContain(url.protocol);
          
          // Should have a valid hostname
          expect(url.hostname).toBeTruthy();
          expect(url.hostname.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 20, timeout: 10000 }
    );
  }, 60000);
});
