/**
 * Storage Abstraction Layer
 * 
 * Provides a unified interface for file storage operations that works with both
 * local file system and Supabase Storage, allowing seamless switching between
 * database modes without changing application logic.
 */

import { getDatabaseConfig } from '@/lib/db-config';
import { getSupabaseBrowser } from '@/lib/supabase-browser';
import type { SupabaseClient } from '@supabase/supabase-js';

// Dynamically import Node.js modules only when needed (server-side)
// This prevents bundling errors in client-side code
let fs: typeof import('fs') | null = null;
let path: typeof import('path') | null = null;

// Lazy load Node.js modules only on server
async function loadNodeModules() {
  if (typeof window === 'undefined' && !fs && !path) {
    fs = await import('fs');
    path = await import('path');
  }
}

/**
 * Storage operation result
 */
export interface StorageResult {
  url: string;
  path: string;
  size: number;
}

/**
 * Storage adapter interface
 * Provides unified methods for file storage operations
 */
export interface StorageAdapter {
  /**
   * Upload a file to storage
   * @param file - File or Blob to upload
   * @param filePath - Destination path for the file
   * @returns Storage result with URL and metadata
   */
  upload(file: File | Blob, filePath: string): Promise<StorageResult>;

  /**
   * Download a file from storage
   * @param filePath - Path to the file
   * @returns File content as Blob
   */
  download(filePath: string): Promise<Blob>;

  /**
   * Delete a file from storage
   * @param filePath - Path to the file to delete
   */
  delete(filePath: string): Promise<void>;

  /**
   * Get public URL for a file
   * @param filePath - Path to the file
   * @returns Public URL to access the file
   */
  getPublicUrl(filePath: string): string;

  /**
   * List files in a directory
   * @param dirPath - Directory path
   * @returns Array of file paths
   */
  list(dirPath: string): Promise<string[]>;

  /**
   * Check if storage is accessible
   * @returns True if storage is accessible
   */
  checkAccess(): Promise<boolean>;
}

/**
 * Local file system storage adapter
 * Stores files in the local file system
 */
export class LocalStorageAdapter implements StorageAdapter {
  private basePath: string;
  private baseUrl: string;

  constructor(basePath?: string, baseUrl?: string) {
    this.basePath = basePath || process.env.LOCAL_STORAGE_PATH || './uploads';
    this.baseUrl = baseUrl || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    // Ensure base directory exists (only in Node.js environment)
    if (typeof window === 'undefined') {
      // Load modules and create directory asynchronously
      loadNodeModules().then(() => {
        this.ensureDirectoryExists(this.basePath);
      }).catch(err => {
        console.error('Failed to load Node modules:', err);
      });
    }
  }

  /**
   * Ensure directory exists, create if it doesn't
   */
  private ensureDirectoryExists(dirPath: string): void {
    // Check if we're in a Node.js environment (not browser)
    const isNode = typeof process !== 'undefined' && process.versions && process.versions.node;
    if (!isNode || !fs) return; // Skip in browser or if fs not loaded
    
    try {
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    } catch (error) {
      console.error(`Failed to create directory ${dirPath}:`, error);
    }
  }

  /**
   * Get full file system path
   */
  private getFullPath(filePath: string): string {
    if (!path) {
      throw new Error('Path module not available');
    }
    return path.join(this.basePath, filePath);
  }

  async upload(file: File | Blob, filePath: string): Promise<StorageResult> {
    // Check if we're in a Node.js environment (not browser)
    const isNode = typeof process !== 'undefined' && process.versions && process.versions.node;
    
    if (!isNode) {
      throw new Error('Local file system upload is only available on the server');
    }

    // Ensure Node modules are loaded
    await loadNodeModules();
    
    if (!fs || !path) {
      throw new Error('File system modules not available');
    }

    const fullPath = this.getFullPath(filePath);
    const directory = path.dirname(fullPath);

    // Ensure directory exists
    this.ensureDirectoryExists(directory);

    // Convert File/Blob to Buffer
    let buffer: Buffer;
    
    // Check if it's already a Buffer
    if (Buffer.isBuffer(file)) {
      buffer = file;
    } 
    // Check if it has arrayBuffer method (browser Blob/File)
    else if (typeof (file as any).arrayBuffer === 'function') {
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    }
    // Handle Node.js Blob (which has stream() method)
    else if (typeof (file as any).stream === 'function') {
      const stream = (file as any).stream();
      const chunks: Uint8Array[] = [];
      
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      
      buffer = Buffer.concat(chunks.map(c => Buffer.from(c)));
    }
    // Fallback: try to convert directly
    else {
      buffer = Buffer.from(file as any);
    }

    // Write file
    await fs.promises.writeFile(fullPath, buffer);

    return {
      url: this.getPublicUrl(filePath),
      path: filePath,
      size: buffer.length,
    };
  }

  async download(filePath: string): Promise<Blob> {
    // Check if we're in a Node.js environment (not browser)
    const isNode = typeof process !== 'undefined' && process.versions && process.versions.node;
    
    if (!isNode) {
      // In browser, fetch from public URL
      const response = await fetch(this.getPublicUrl(filePath));
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
      }
      return response.blob();
    }

    // Ensure Node modules are loaded
    await loadNodeModules();
    
    if (!fs) {
      throw new Error('File system module not available');
    }

    // On server, read from file system
    const fullPath = this.getFullPath(filePath);
    const buffer = await fs.promises.readFile(fullPath);
    return new Blob([buffer]);
  }

  async delete(filePath: string): Promise<void> {
    // Check if we're in a Node.js environment (not browser)
    const isNode = typeof process !== 'undefined' && process.versions && process.versions.node;
    
    if (!isNode) {
      throw new Error('Local file system delete is only available on the server');
    }

    // Ensure Node modules are loaded
    await loadNodeModules();
    
    if (!fs) {
      throw new Error('File system module not available');
    }

    const fullPath = this.getFullPath(filePath);
    
    try {
      await fs.promises.unlink(fullPath);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw new Error(`Failed to delete file: ${error.message}`);
      }
      // File doesn't exist, consider it deleted
    }
  }

  getPublicUrl(filePath: string): string {
    // Return URL that will be served by Next.js API route or static files
    return `${this.baseUrl}/api/storage/${filePath}`;
  }

  async list(dirPath: string): Promise<string[]> {
    // Check if we're in a Node.js environment (not browser)
    const isNode = typeof process !== 'undefined' && process.versions && process.versions.node;
    
    if (!isNode) {
      throw new Error('Local file system list is only available on the server');
    }

    // Ensure Node modules are loaded
    await loadNodeModules();
    
    if (!fs || !path) {
      throw new Error('File system modules not available');
    }

    const fullPath = this.getFullPath(dirPath);

    try {
      const files = await fs.promises.readdir(fullPath);
      return files.map(file => path!.join(dirPath, file));
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return []; // Directory doesn't exist, return empty array
      }
      throw new Error(`Failed to list files: ${error.message}`);
    }
  }

  async checkAccess(): Promise<boolean> {
    // Check if we're in a Node.js environment (not browser)
    const isNode = typeof process !== 'undefined' && process.versions && process.versions.node;
    
    if (!isNode) {
      return true; // Assume accessible in browser
    }

    // Ensure Node modules are loaded
    await loadNodeModules();
    
    if (!fs) {
      return false;
    }

    try {
      // Check if base directory exists and is writable
      await fs.promises.access(this.basePath, fs.constants.W_OK);
      return true;
    } catch {
      // Try to create the directory
      try {
        this.ensureDirectoryExists(this.basePath);
        return true;
      } catch {
        return false;
      }
    }
  }
}

/**
 * Supabase storage adapter
 * Stores files in Supabase Storage
 */
export class SupabaseStorageAdapter implements StorageAdapter {
  private supabase: SupabaseClient;
  private bucketName: string;

  constructor(supabase?: SupabaseClient, bucketName: string = 'note-images') {
    const client = supabase || getSupabaseBrowser();
    if (!client) {
      throw new Error(
        'Supabase client is not available. ' +
        'Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are configured.'
      );
    }
    this.supabase = client;
    this.bucketName = bucketName;
  }

  async upload(file: File | Blob, filePath: string): Promise<StorageResult> {
    const { data, error } = await this.supabase.storage
      .from(this.bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw new Error(`Supabase upload failed: ${error.message}`);
    }

    const publicUrl = this.getPublicUrl(filePath);
    const size = file instanceof Blob ? file.size : 0;

    return {
      url: publicUrl,
      path: filePath,
      size,
    };
  }

  async download(filePath: string): Promise<Blob> {
    const { data, error } = await this.supabase.storage
      .from(this.bucketName)
      .download(filePath);

    if (error) {
      throw new Error(`Supabase download failed: ${error.message}`);
    }

    return data;
  }

  async delete(filePath: string): Promise<void> {
    const { error } = await this.supabase.storage
      .from(this.bucketName)
      .remove([filePath]);

    if (error) {
      throw new Error(`Supabase delete failed: ${error.message}`);
    }
  }

  getPublicUrl(filePath: string): string {
    const { data: { publicUrl } } = this.supabase.storage
      .from(this.bucketName)
      .getPublicUrl(filePath);

    return publicUrl;
  }

  async list(dirPath: string): Promise<string[]> {
    const { data, error } = await this.supabase.storage
      .from(this.bucketName)
      .list(dirPath);

    if (error) {
      throw new Error(`Supabase list failed: ${error.message}`);
    }

    // Use simple path joining instead of path module
    return data.map(file => `${dirPath}/${file.name}`.replace(/\/+/g, '/'));
  }

  async checkAccess(): Promise<boolean> {
    try {
      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .list('', { limit: 1 });

      return !error;
    } catch {
      return false;
    }
  }
}

/**
 * Factory function to get the appropriate storage adapter
 * based on the current database configuration
 */
export function getStorageAdapter(): StorageAdapter {
  // In browser environment, always use LocalStorageAdapter
  // (actual uploads go through API routes on the server)
  if (typeof window !== 'undefined') {
    return new LocalStorageAdapter();
  }

  try {
    const config = getDatabaseConfig();

    if (config.mode === 'local') {
      return new LocalStorageAdapter();
    } else if (config.isSupabaseAvailable) {
      return new SupabaseStorageAdapter();
    } else {
      // Fallback to local storage if Supabase is not available
      console.warn('Supabase not available, falling back to local storage');
      return new LocalStorageAdapter();
    }
  } catch (error) {
    // If config fails, default to local storage
    console.warn('Failed to get database config, defaulting to local storage:', error);
    return new LocalStorageAdapter();
  }
}

/**
 * Lazy singleton instance - only created when first accessed
 */
let _storageAdapter: StorageAdapter | null = null;

export function getStorageAdapterInstance(): StorageAdapter {
  if (!_storageAdapter) {
    _storageAdapter = getStorageAdapter();
  }
  return _storageAdapter;
}

/**
 * Export getter for backward compatibility
 * @deprecated Use getStorageAdapterInstance() instead
 */
export const storageAdapter = typeof window === 'undefined' 
  ? getStorageAdapter() 
  : (null as unknown as StorageAdapter);
