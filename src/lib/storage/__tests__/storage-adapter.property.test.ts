/**
 * 属性测试: 存储抽象一致性
 * Property Test: Storage Abstraction Consistency
 * 
 * Feature: local-database-migration, Property 4: 存储抽象一致性
 * Validates: Requirements 4.5
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import {
  LocalStorageAdapter,
  SupabaseStorageAdapter,
  getStorageAdapter,
  type StorageAdapter,
} from '../storage-adapter';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Mock Supabase client for testing
const createMockSupabaseClient = () => {
  const mockFiles = new Map<string, Blob>();
  
  return {
    storage: {
      from: (bucket: string) => ({
        upload: vi.fn(async (filePath: string, file: Blob) => {
          mockFiles.set(filePath, file);
          return { data: { path: filePath }, error: null };
        }),
        download: vi.fn(async (filePath: string) => {
          const file = mockFiles.get(filePath);
          if (!file) {
            return { data: null, error: { message: 'File not found' } };
          }
          return { data: file, error: null };
        }),
        remove: vi.fn(async (paths: string[]) => {
          paths.forEach(p => mockFiles.delete(p));
          return { error: null };
        }),
        getPublicUrl: vi.fn((filePath: string) => ({
          data: { publicUrl: `https://example.supabase.co/storage/v1/object/public/note-images/${filePath}` }
        })),
        list: vi.fn(async (dirPath: string) => {
          const files = Array.from(mockFiles.keys())
            .filter(key => key.startsWith(dirPath))
            .map(key => ({
              name: path.basename(key),
              id: key,
              updated_at: new Date().toISOString(),
              created_at: new Date().toISOString(),
              last_accessed_at: new Date().toISOString(),
              metadata: {},
            }));
          return { data: files, error: null };
        }),
      }),
    },
  } as any;
};

// Generators for property tests
const filePathArbitrary = () => fc.string({ minLength: 1, maxLength: 50 })
  .map(s => s.replace(/[^a-zA-Z0-9-_./]/g, '_'))
  .filter(s => s.length > 0 && !s.startsWith('/'));

const fileBlobArbitrary = () => fc.uint8Array({ minLength: 1, maxLength: 1000 })
  .map(arr => new Blob([arr], { type: 'application/octet-stream' }));

const dirPathArbitrary = () => fc.string({ minLength: 1, maxLength: 30 })
  .map(s => s.replace(/[^a-zA-Z0-9-_/]/g, '_'))
  .filter(s => s.length > 0 && !s.startsWith('/'));

describe('Property 4: Storage Abstraction Consistency', () => {
  let tempDir: string;
  let localAdapter: LocalStorageAdapter;
  let supabaseAdapter: SupabaseStorageAdapter;
  let mockSupabase: any;

  beforeEach(() => {
    // Create temporary directory for local storage tests
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'storage-test-'));
    localAdapter = new LocalStorageAdapter(tempDir, 'http://localhost:3000');
    
    // Create mock Supabase client
    mockSupabase = createMockSupabaseClient();
    supabaseAdapter = new SupabaseStorageAdapter(mockSupabase);
  });

  afterEach(() => {
    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  /**
   * 属性 4: 存储抽象一致性
   * 
   * 对于任何文件存储操作(上传、下载、删除),
   * 本地文件系统和 Supabase Storage 应该通过统一接口提供一致的行为
   * 
   * Property 4: Storage Abstraction Consistency
   * 
   * For any file storage operation (upload, download, delete),
   * local file system and Supabase Storage should provide consistent
   * behavior through a unified interface
   */
  test('storage adapters provide consistent upload behavior', async () => {
    await fc.assert(
      fc.asyncProperty(
        filePathArbitrary(),
        fileBlobArbitrary(),
        
        async (filePath, fileBlob) => {
          // Test local adapter
          const localResult = await localAdapter.upload(fileBlob, filePath);
          
          // Test Supabase adapter
          const supabaseResult = await supabaseAdapter.upload(fileBlob, filePath);
          
          // Both should return valid results
          expect(localResult).toBeDefined();
          expect(supabaseResult).toBeDefined();
          
          // Both should have the same structure
          expect(localResult).toHaveProperty('url');
          expect(localResult).toHaveProperty('path');
          expect(localResult).toHaveProperty('size');
          
          expect(supabaseResult).toHaveProperty('url');
          expect(supabaseResult).toHaveProperty('path');
          expect(supabaseResult).toHaveProperty('size');
          
          // Both should return string URLs
          expect(typeof localResult.url).toBe('string');
          expect(typeof supabaseResult.url).toBe('string');
          expect(localResult.url.length).toBeGreaterThan(0);
          expect(supabaseResult.url.length).toBeGreaterThan(0);
          
          // Both should return the same path
          expect(localResult.path).toBe(filePath);
          expect(supabaseResult.path).toBe(filePath);
          
          // Both should return valid sizes
          expect(localResult.size).toBeGreaterThan(0);
          expect(supabaseResult.size).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 属性 4.1: 上传后下载一致性
   * 
   * 对于任何上传的文件,下载应该返回相同的内容
   * 
   * Property 4.1: Upload-Download Consistency
   * 
   * For any uploaded file, download should return the same content
   */
  test('uploaded files can be downloaded with same content', async () => {
    await fc.assert(
      fc.asyncProperty(
        filePathArbitrary(),
        fileBlobArbitrary(),
        
        async (filePath, fileBlob) => {
          // Upload with local adapter
          await localAdapter.upload(fileBlob, filePath);
          const localDownloaded = await localAdapter.download(filePath);
          
          // Upload with Supabase adapter
          await supabaseAdapter.upload(fileBlob, filePath);
          const supabaseDownloaded = await supabaseAdapter.download(filePath);
          
          // Both should return blobs
          expect(localDownloaded).toBeInstanceOf(Blob);
          expect(supabaseDownloaded).toBeInstanceOf(Blob);
          
          // Both should have the same size as original
          expect(localDownloaded.size).toBe(fileBlob.size);
          expect(supabaseDownloaded.size).toBe(fileBlob.size);
          
          // Content should match original
          const originalBuffer = await fileBlob.arrayBuffer();
          const localBuffer = await localDownloaded.arrayBuffer();
          const supabaseBuffer = await supabaseDownloaded.arrayBuffer();
          
          expect(Buffer.from(localBuffer)).toEqual(Buffer.from(originalBuffer));
          expect(Buffer.from(supabaseBuffer)).toEqual(Buffer.from(originalBuffer));
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 属性 4.2: 删除操作一致性
   * 
   * 对于任何已上传的文件,删除后下载应该失败
   * 
   * Property 4.2: Delete Operation Consistency
   * 
   * For any uploaded file, download should fail after deletion
   */
  test('deleted files cannot be downloaded', async () => {
    await fc.assert(
      fc.asyncProperty(
        filePathArbitrary(),
        fileBlobArbitrary(),
        
        async (filePath, fileBlob) => {
          // Test local adapter
          await localAdapter.upload(fileBlob, filePath);
          await localAdapter.delete(filePath);
          
          await expect(localAdapter.download(filePath)).rejects.toThrow();
          
          // Test Supabase adapter
          await supabaseAdapter.upload(fileBlob, filePath);
          await supabaseAdapter.delete(filePath);
          
          await expect(supabaseAdapter.download(filePath)).rejects.toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 属性 4.3: 公共 URL 生成一致性
   * 
   * 对于任何文件路径,getPublicUrl 应该返回有效的 URL 字符串
   * 
   * Property 4.3: Public URL Generation Consistency
   * 
   * For any file path, getPublicUrl should return a valid URL string
   */
  test('getPublicUrl returns valid URLs', async () => {
    await fc.assert(
      fc.asyncProperty(
        filePathArbitrary(),
        
        async (filePath) => {
          const localUrl = localAdapter.getPublicUrl(filePath);
          const supabaseUrl = supabaseAdapter.getPublicUrl(filePath);
          
          // Both should return strings
          expect(typeof localUrl).toBe('string');
          expect(typeof supabaseUrl).toBe('string');
          
          // Both should be non-empty
          expect(localUrl.length).toBeGreaterThan(0);
          expect(supabaseUrl.length).toBeGreaterThan(0);
          
          // Both should contain the file path
          expect(localUrl).toContain(filePath);
          expect(supabaseUrl).toContain(filePath);
          
          // Both should be valid URL format
          expect(() => new URL(localUrl)).not.toThrow();
          expect(() => new URL(supabaseUrl)).not.toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 属性 4.4: 列表操作一致性
   * 
   * 对于任何目录,list 操作应该返回该目录中的文件
   * 
   * Property 4.4: List Operation Consistency
   * 
   * For any directory, list operation should return files in that directory
   */
  test('list operation returns uploaded files', async () => {
    await fc.assert(
      fc.asyncProperty(
        dirPathArbitrary(),
        fc.array(filePathArbitrary(), { minLength: 1, maxLength: 5 }),
        fileBlobArbitrary(),
        
        async (dirPath, fileNames, fileBlob) => {
          // Create unique file paths in the directory
          const filePaths = fileNames.map(name => `${dirPath}/${name}`);
          
          // Upload files with local adapter
          for (const filePath of filePaths) {
            await localAdapter.upload(fileBlob, filePath);
          }
          
          const localFiles = await localAdapter.list(dirPath);
          
          // Upload files with Supabase adapter
          for (const filePath of filePaths) {
            await supabaseAdapter.upload(fileBlob, filePath);
          }
          
          const supabaseFiles = await supabaseAdapter.list(dirPath);
          
          // Both should return arrays
          expect(Array.isArray(localFiles)).toBe(true);
          expect(Array.isArray(supabaseFiles)).toBe(true);
          
          // Both should return at least the uploaded files
          expect(localFiles.length).toBeGreaterThanOrEqual(filePaths.length);
          expect(supabaseFiles.length).toBeGreaterThanOrEqual(filePaths.length);
          
          // All uploaded files should be in the list
          for (const filePath of filePaths) {
            expect(localFiles.some(f => f.includes(path.basename(filePath)))).toBe(true);
            expect(supabaseFiles.some(f => f.includes(path.basename(filePath)))).toBe(true);
          }
        }
      ),
      { numRuns: 50 } // Reduced runs due to multiple uploads
    );
  });

  /**
   * 属性 4.5: 访问检查一致性
   * 
   * 对于任何适配器,checkAccess 应该返回布尔值
   * 
   * Property 4.5: Access Check Consistency
   * 
   * For any adapter, checkAccess should return a boolean value
   */
  test('checkAccess returns boolean', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constant(null), // No input needed
        
        async () => {
          const localAccess = await localAdapter.checkAccess();
          const supabaseAccess = await supabaseAdapter.checkAccess();
          
          // Both should return booleans
          expect(typeof localAccess).toBe('boolean');
          expect(typeof supabaseAccess).toBe('boolean');
          
          // In test environment, both should be accessible
          expect(localAccess).toBe(true);
          expect(supabaseAccess).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 属性 4.6: 错误处理一致性
   * 
   * 对于不存在的文件,下载和删除操作应该抛出错误
   * 
   * Property 4.6: Error Handling Consistency
   * 
   * For non-existent files, download and delete operations should throw errors
   */
  test('operations on non-existent files throw errors', async () => {
    await fc.assert(
      fc.asyncProperty(
        filePathArbitrary(),
        
        async (filePath) => {
          // Ensure file doesn't exist
          const nonExistentPath = `non-existent-${filePath}`;
          
          // Local adapter should throw on download
          await expect(localAdapter.download(nonExistentPath)).rejects.toThrow();
          
          // Supabase adapter should throw on download
          await expect(supabaseAdapter.download(nonExistentPath)).rejects.toThrow();
          
          // Delete on non-existent file should not throw (idempotent)
          await expect(localAdapter.delete(nonExistentPath)).resolves.not.toThrow();
          await expect(supabaseAdapter.delete(nonExistentPath)).resolves.not.toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 属性 4.7: 工厂函数返回有效适配器
   * 
   * getStorageAdapter 应该始终返回实现 StorageAdapter 接口的对象
   * 
   * Property 4.7: Factory Function Returns Valid Adapter
   * 
   * getStorageAdapter should always return an object implementing StorageAdapter interface
   */
  test('getStorageAdapter returns valid adapter', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constant(null), // No input needed
        
        async () => {
          const adapter = getStorageAdapter();
          
          // Should return an object
          expect(adapter).toBeDefined();
          expect(typeof adapter).toBe('object');
          
          // Should have all required methods
          expect(typeof adapter.upload).toBe('function');
          expect(typeof adapter.download).toBe('function');
          expect(typeof adapter.delete).toBe('function');
          expect(typeof adapter.getPublicUrl).toBe('function');
          expect(typeof adapter.list).toBe('function');
          expect(typeof adapter.checkAccess).toBe('function');
        }
      ),
      { numRuns: 100 }
    );
  });
});
