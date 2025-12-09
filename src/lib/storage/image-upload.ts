/**
 * Image Upload Manager for Supabase Storage
 * Handles image uploads to the note-images bucket
 * 
 * Performance optimizations:
 * - Automatic image compression for large files
 * - Client-side validation
 * - Batch upload support
 * - Progress tracking
 */

import { supabaseBrowser } from '@/lib/supabase-browser';
import type { SupabaseClient } from '@supabase/supabase-js';
import { compressImage, shouldCompressImage } from './image-optimizer';

const BUCKET_NAME = 'note-images';
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
  private supabase: SupabaseClient;
  private bucketName: string;

  constructor(supabase?: SupabaseClient, bucketName: string = BUCKET_NAME) {
    this.supabase = supabase || supabaseBrowser;
    this.bucketName = bucketName;
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

      // Upload to Supabase Storage
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(fileName, fileToUpload, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        throw new Error(`上传失败: ${error.message}`);
      }

      // Report completion
      options?.onProgress?.(100);

      // Get public URL
      const { data: { publicUrl } } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(fileName);

      return {
        url: publicUrl,
        path: fileName,
        size: fileToUpload instanceof Blob ? fileToUpload.size : file.size,
      };
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
      const pathIndex = urlParts.indexOf('public') + 2; // Skip 'public' and bucket name
      const path = urlParts.slice(pathIndex).join('/');

      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .remove([path]);

      if (error) {
        throw new Error(`删除失败: ${error.message}`);
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
    const { data: { publicUrl } } = this.supabase.storage
      .from(this.bucketName)
      .getPublicUrl(path);
    
    return publicUrl;
  }

  /**
   * List all images for a specific note
   */
  async listNoteImages(noteId: string): Promise<string[]> {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .list(noteId);

      if (error) {
        throw new Error(`获取图片列表失败: ${error.message}`);
      }

      return data.map((file) => this.getPublicUrl(`${noteId}/${file.name}`));
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('获取图片列表时发生未知错误');
    }
  }

  /**
   * Check if bucket exists and is accessible
   */
  async checkBucketAccess(): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .list('', { limit: 1 });

      return !error;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const imageUploadManager = new ImageUploadManager();

// Export helper functions
export async function uploadImage(
  file: File,
  noteId: string
): Promise<ImageUploadResult> {
  return imageUploadManager.uploadImage(file, noteId);
}

export async function uploadImages(
  files: File[],
  noteId: string
): Promise<ImageUploadResult[]> {
  return imageUploadManager.uploadImages(files, noteId);
}

export async function deleteImage(url: string): Promise<void> {
  return imageUploadManager.deleteImage(url);
}

export async function deleteImages(urls: string[]): Promise<void> {
  return imageUploadManager.deleteImages(urls);
}

export async function getPublicUrl(path: string): string {
  return imageUploadManager.getPublicUrl(path);
}
