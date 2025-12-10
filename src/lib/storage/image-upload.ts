/**
 * Image Upload Manager
 * Handles image uploads using the storage abstraction layer
 * 
 * Performance optimizations:
 * - Automatic image compression for large files
 * - Client-side validation
 * - Batch upload support
 * - Progress tracking
 */

import { getStorageAdapter, type StorageAdapter } from './storage-adapter';
import { compressImage, shouldCompressImage } from './image-optimizer';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const COMPRESSION_THRESHOLD = 2 * 1024 * 1024; // 2MB - compress files larger than this
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
];

export interface ImageUploadResult {
  url: string;
  path: string;
  size: number;
}

export interface ImageUploadError {
  message: string;
  code?: string;
}

/**
 * Image Upload Manager class
 */
export class ImageUploadManager {
  private storageAdapter: StorageAdapter;

  constructor(storageAdapter?: StorageAdapter) {
    this.storageAdapter = storageAdapter || getStorageAdapter();
  }

  /**
   * Validate image file
   */
  private validateImage(file: File): void {
    // Check file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      throw new Error(
        `不支持的文件类型: ${file.type}。仅支持: ${ALLOWED_MIME_TYPES.join(', ')}`
      );
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(
        `文件大小超过限制。最大允许: ${MAX_FILE_SIZE / 1024 / 1024}MB`
      );
    }

    // Check if file is actually an image
    if (!file.type.startsWith('image/')) {
      throw new Error('只支持图片文件');
    }
  }

  /**
   * Generate unique file name with noteId prefix
   */
  private generateFileName(file: File, noteId: string): string {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    return `${noteId}/${timestamp}-${randomStr}.${fileExt}`;
  }

  /**
   * Upload a single image with automatic compression
   */
  async uploadImage(
    file: File,
    noteId: string,
    options?: {
      compress?: boolean;
      onProgress?: (progress: number) => void;
    }
  ): Promise<ImageUploadResult> {
    try {
      // Validate the image
      this.validateImage(file);

      let fileToUpload: File | Blob = file;
      let originalSize = file.size;

      // Compress image if it's too large (unless explicitly disabled)
      if (options?.compress !== false && shouldCompressImage(file)) {
        console.log(`Compressing image: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
        
        try {
          const compressedBlob = await compressImage(file, {
            maxWidth: 1920,
            maxHeight: 1080,
            quality: 0.85,
            format: file.type.includes('png') ? 'png' : 'jpeg',
          });
          
          fileToUpload = compressedBlob;
          console.log(
            `Compression complete: ${(originalSize / 1024 / 1024).toFixed(2)}MB -> ${(compressedBlob.size / 1024 / 1024).toFixed(2)}MB ` +
            `(${Math.round((1 - compressedBlob.size / originalSize) * 100)}% reduction)`
          );
        } catch (compressionError) {
          console.warn('Image compression failed, uploading original:', compressionError);
          // Continue with original file if compression fails
        }
      }

      // Generate unique file name
      const fileName = this.generateFileName(file, noteId);

      // Report initial progress
      options?.onProgress?.(0);

      // Upload using storage adapter
      const result = await this.storageAdapter.upload(fileToUpload, fileName);

      // Report completion
      options?.onProgress?.(100);

      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('上传图片时发生未知错误');
    }
  }

  /**
   * Upload multiple images
   */
  async uploadImages(
    files: File[],
    noteId: string
  ): Promise<ImageUploadResult[]> {
    const uploadPromises = files.map((file) =>
      this.uploadImage(file, noteId)
    );
    return Promise.all(uploadPromises);
  }

  /**
   * Delete an image by URL
   */
  async deleteImage(url: string): Promise<void> {
    try {
      // Extract file path from URL
      const urlParts = url.split('/');
      
      // Try to find the path after 'storage' or 'api/storage'
      let pathIndex = urlParts.indexOf('storage');
      if (pathIndex === -1) {
        pathIndex = urlParts.indexOf('public');
      }
      
      if (pathIndex !== -1) {
        // Skip to the actual file path (after bucket name or storage endpoint)
        const path = urlParts.slice(pathIndex + 2).join('/');
        await this.storageAdapter.delete(path);
      } else {
        // If we can't parse the URL, try using it as-is
        await this.storageAdapter.delete(url);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('删除图片时发生未知错误');
    }
  }

  /**
   * Delete multiple images by URLs
   */
  async deleteImages(urls: string[]): Promise<void> {
    const deletePromises = urls.map((url) => this.deleteImage(url));
    await Promise.all(deletePromises);
  }

  /**
   * Get public URL for a file path
   */
  getPublicUrl(path: string): string {
    return this.storageAdapter.getPublicUrl(path);
  }

  /**
   * List all images for a specific note
   */
  async listNoteImages(noteId: string): Promise<string[]> {
    try {
      const paths = await this.storageAdapter.list(noteId);
      return paths.map((path) => this.getPublicUrl(path));
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('获取图片列表时发生未知错误');
    }
  }

  /**
   * Check if storage is accessible
   */
  async checkBucketAccess(): Promise<boolean> {
    try {
      return await this.storageAdapter.checkAccess();
    } catch {
      return false;
    }
  }
}

// Lazy singleton instance (for server-side use only)
let _imageUploadManager: ImageUploadManager | null = null;

function getImageUploadManager(): ImageUploadManager {
  if (!_imageUploadManager) {
    _imageUploadManager = new ImageUploadManager();
  }
  return _imageUploadManager;
}

// Export getter for backward compatibility
export const imageUploadManager = typeof window === 'undefined' 
  ? { 
      get uploadImage() { return getImageUploadManager().uploadImage.bind(getImageUploadManager()); },
      get uploadImages() { return getImageUploadManager().uploadImages.bind(getImageUploadManager()); },
      get deleteImage() { return getImageUploadManager().deleteImage.bind(getImageUploadManager()); },
      get deleteImages() { return getImageUploadManager().deleteImages.bind(getImageUploadManager()); },
      get getPublicUrl() { return getImageUploadManager().getPublicUrl.bind(getImageUploadManager()); },
      get listNoteImages() { return getImageUploadManager().listNoteImages.bind(getImageUploadManager()); },
      get checkBucketAccess() { return getImageUploadManager().checkBucketAccess.bind(getImageUploadManager()); },
    } as ImageUploadManager
  : (null as unknown as ImageUploadManager);

// Export helper functions
export async function uploadImage(
  file: File,
  noteId: string
): Promise<ImageUploadResult> {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    // Use API route for client-side uploads
    const formData = new FormData();
    formData.append('file', file);
    formData.append('noteId', noteId);

    const response = await fetch('/api/images/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '上传图片失败');
    }

    const result = await response.json();
    return result.data;
  }

  // Server-side: use the manager directly
  return getImageUploadManager().uploadImage(file, noteId);
}

export async function uploadImages(
  files: File[],
  noteId: string
): Promise<ImageUploadResult[]> {
  return getImageUploadManager().uploadImages(files, noteId);
}

export async function deleteImage(url: string): Promise<void> {
  return getImageUploadManager().deleteImage(url);
}

export async function deleteImages(urls: string[]): Promise<void> {
  return getImageUploadManager().deleteImages(urls);
}

export function getPublicUrl(path: string): string {
  return getImageUploadManager().getPublicUrl(path);
}
