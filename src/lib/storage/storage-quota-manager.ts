/**
 * Storage Quota Manager
 * Calculates and manages storage usage for notes and images
 */

import { supabaseBrowser } from '@/lib/supabase-browser';
import { prisma } from '@/lib/prisma';
import type { SupabaseClient } from '@supabase/supabase-js';

const BUCKET_NAME = 'note-images';
const DEFAULT_QUOTA = 1024 * 1024 * 1024; // 1GB default quota

export interface StorageUsage {
  totalBytes: number;
  notesBytes: number;
  imagesBytes: number;
  quotaBytes: number;
  usagePercentage: number;
}

export interface StorageBreakdown {
  type: 'notes' | 'images';
  bytes: number;
  count: number;
}

export interface LargeItem {
  id: string;
  type: 'note' | 'image';
  name: string;
  size: number;
  createdAt: Date;
  path?: string; // For images
}

/**
 * Storage Quota Manager class
 */
export class StorageQuotaManager {
  private supabase: SupabaseClient;
  private bucketName: string;
  private quotaBytes: number;

  constructor(
    supabase?: SupabaseClient,
    bucketName: string = BUCKET_NAME,
    quotaBytes: number = DEFAULT_QUOTA
  ) {
    this.supabase = supabase || supabaseBrowser;
    this.bucketName = bucketName;
    this.quotaBytes = quotaBytes;
  }

  /**
   * Calculate total size of all notes content for a user
   */
  async calculateNotesSize(userId: string): Promise<number> {
    try {
      // Get all notes owned by the user
      const notes = await prisma.note.findMany({
        where: {
          ownerId: userId,
        },
        select: {
          content: true,
        },
      });

      // Calculate total size in bytes
      let totalBytes = 0;
      for (const note of notes) {
        // Calculate size of content string in bytes (UTF-8)
        totalBytes += new Blob([note.content]).size;
      }

      return totalBytes;
    } catch (error) {
      console.error('Error calculating notes size:', error);
      throw new Error('Failed to calculate notes size');
    }
  }

  /**
   * Calculate total size of all images in storage for a user
   */
  async calculateImagesSize(userId: string): Promise<number> {
    try {
      // Get all notes owned by the user to find their image folders
      const notes = await prisma.note.findMany({
        where: {
          ownerId: userId,
        },
        select: {
          id: true,
        },
      });

      let totalBytes = 0;

      // For each note, list images in its folder
      for (const note of notes) {
        try {
          const { data, error } = await this.supabase.storage
            .from(this.bucketName)
            .list(note.id);

          if (error) {
            console.warn(`Error listing images for note ${note.id}:`, error);
            continue;
          }

          if (data) {
            // Sum up file sizes
            for (const file of data) {
              totalBytes += file.metadata?.size || 0;
            }
          }
        } catch (error) {
          console.warn(`Error processing note ${note.id}:`, error);
          continue;
        }
      }

      return totalBytes;
    } catch (error) {
      console.error('Error calculating images size:', error);
      throw new Error('Failed to calculate images size');
    }
  }

  /**
   * Get complete storage usage for a user
   */
  async getStorageUsage(userId: string): Promise<StorageUsage> {
    try {
      const [notesBytes, imagesBytes] = await Promise.all([
        this.calculateNotesSize(userId),
        this.calculateImagesSize(userId),
      ]);

      const totalBytes = notesBytes + imagesBytes;
      const usagePercentage = (totalBytes / this.quotaBytes) * 100;

      return {
        totalBytes,
        notesBytes,
        imagesBytes,
        quotaBytes: this.quotaBytes,
        usagePercentage: Math.min(usagePercentage, 100),
      };
    } catch (error) {
      console.error('Error getting storage usage:', error);
      throw new Error('Failed to get storage usage');
    }
  }

  /**
   * Get storage breakdown by type
   */
  async getStorageBreakdown(userId: string): Promise<StorageBreakdown[]> {
    try {
      const [notesBytes, imagesBytes] = await Promise.all([
        this.calculateNotesSize(userId),
        this.calculateImagesSize(userId),
      ]);

      const notesCount = await prisma.note.count({
        where: { ownerId: userId },
      });

      // Count images
      const notes = await prisma.note.findMany({
        where: { ownerId: userId },
        select: { id: true },
      });

      let imagesCount = 0;
      for (const note of notes) {
        try {
          const { data } = await this.supabase.storage
            .from(this.bucketName)
            .list(note.id);
          
          if (data) {
            imagesCount += data.length;
          }
        } catch {
          continue;
        }
      }

      return [
        {
          type: 'notes',
          bytes: notesBytes,
          count: notesCount,
        },
        {
          type: 'images',
          bytes: imagesBytes,
          count: imagesCount,
        },
      ];
    } catch (error) {
      console.error('Error getting storage breakdown:', error);
      throw new Error('Failed to get storage breakdown');
    }
  }

  /**
   * Get list of large items (notes and images) for cleanup
   */
  async getLargeItems(
    userId: string,
    limit: number = 20
  ): Promise<LargeItem[]> {
    try {
      const items: LargeItem[] = [];

      // Get large notes
      const notes = await prisma.note.findMany({
        where: {
          ownerId: userId,
        },
        select: {
          id: true,
          title: true,
          content: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'asc', // Oldest first
        },
      });

      for (const note of notes) {
        const size = new Blob([note.content]).size;
        items.push({
          id: note.id,
          type: 'note',
          name: note.title,
          size,
          createdAt: note.createdAt,
        });
      }

      // Get large images
      const userNotes = await prisma.note.findMany({
        where: { ownerId: userId },
        select: { id: true },
      });

      for (const note of userNotes) {
        try {
          const { data } = await this.supabase.storage
            .from(this.bucketName)
            .list(note.id);

          if (data) {
            for (const file of data) {
              const size = file.metadata?.size || 0;
              items.push({
                id: file.id || file.name,
                type: 'image',
                name: file.name,
                size,
                createdAt: new Date(file.created_at || Date.now()),
                path: `${note.id}/${file.name}`,
              });
            }
          }
        } catch {
          continue;
        }
      }

      // Sort by size (largest first) and return top items
      return items
        .sort((a, b) => b.size - a.size)
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting large items:', error);
      throw new Error('Failed to get large items');
    }
  }

  /**
   * Get old items for cleanup
   */
  async getOldItems(
    userId: string,
    daysOld: number = 90,
    limit: number = 20
  ): Promise<LargeItem[]> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const items: LargeItem[] = [];

      // Get old notes
      const notes = await prisma.note.findMany({
        where: {
          ownerId: userId,
          createdAt: {
            lt: cutoffDate,
          },
        },
        select: {
          id: true,
          title: true,
          content: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
        take: limit,
      });

      for (const note of notes) {
        const size = new Blob([note.content]).size;
        items.push({
          id: note.id,
          type: 'note',
          name: note.title,
          size,
          createdAt: note.createdAt,
        });
      }

      return items;
    } catch (error) {
      console.error('Error getting old items:', error);
      throw new Error('Failed to get old items');
    }
  }

  /**
   * Check if storage is near quota
   */
  async isNearQuota(userId: string, threshold: number = 80): Promise<boolean> {
    try {
      const usage = await this.getStorageUsage(userId);
      return usage.usagePercentage >= threshold;
    } catch (error) {
      console.error('Error checking quota:', error);
      return false;
    }
  }

  /**
   * Check if storage is full
   */
  async isQuotaExceeded(userId: string): Promise<boolean> {
    try {
      const usage = await this.getStorageUsage(userId);
      return usage.usagePercentage >= 100;
    } catch (error) {
      console.error('Error checking quota:', error);
      return false;
    }
  }

  /**
   * Format bytes to human-readable string
   */
  static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
    const value = bytes / Math.pow(k, i);

    // Round to 2 decimal places
    const rounded = Math.round(value * 100) / 100;

    return rounded + ' ' + sizes[i];
  }
}

// Export singleton instance
export const storageQuotaManager = new StorageQuotaManager();

// Export helper functions
export async function getStorageUsage(userId: string): Promise<StorageUsage> {
  return storageQuotaManager.getStorageUsage(userId);
}

export async function getStorageBreakdown(
  userId: string
): Promise<StorageBreakdown[]> {
  return storageQuotaManager.getStorageBreakdown(userId);
}

export async function getLargeItems(
  userId: string,
  limit?: number
): Promise<LargeItem[]> {
  return storageQuotaManager.getLargeItems(userId, limit);
}

export async function getOldItems(
  userId: string,
  daysOld?: number,
  limit?: number
): Promise<LargeItem[]> {
  return storageQuotaManager.getOldItems(userId, daysOld, limit);
}

export async function isNearQuota(
  userId: string,
  threshold?: number
): Promise<boolean> {
  return storageQuotaManager.isNearQuota(userId, threshold);
}

export async function isQuotaExceeded(userId: string): Promise<boolean> {
  return storageQuotaManager.isQuotaExceeded(userId);
}

export function formatBytes(bytes: number): string {
  return StorageQuotaManager.formatBytes(bytes);
}
