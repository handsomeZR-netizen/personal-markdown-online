/**
 * 存储管理器
 * 负责检测存储空间、获取使用情况和清理缓存
 */

import { IndexedDBManager } from './indexeddb-manager';
import { DraftManager } from './draft-manager';
import { SyncQueueManager } from './sync-queue-manager';
import {
  createOfflineError,
  OfflineErrorCode,
  ErrorLogger,
} from './errors';

/**
 * 存储配额信息
 */
export interface StorageQuota {
  usage: number;
  quota: number;
  usagePercentage: number;
  available: number;
  isLowSpace: boolean; // 可用空间小于 50MB
}

/**
 * 存储使用详情
 */
export interface StorageUsageDetails {
  total: StorageQuota;
  notes: {
    count: number;
    estimatedSize: number;
  };
  syncQueue: {
    count: number;
    estimatedSize: number;
  };
  drafts: {
    count: number;
    estimatedSize: number;
  };
}

/**
 * 缓存清理结果
 */
export interface CleanupResult {
  notesDeleted: number;
  draftsDeleted: number;
  spaceFreed: number;
  errors: string[];
}

/**
 * 存储管理器类
 */
export class StorageManager {
  private dbManager: IndexedDBManager;
  private draftManager: DraftManager;
  private syncQueueManager: SyncQueueManager;
  private static instance: StorageManager | null = null;

  private readonly LOW_SPACE_THRESHOLD = 50 * 1024 * 1024; // 50MB

  private constructor() {
    this.dbManager = IndexedDBManager.getInstance();
    this.draftManager = new DraftManager();
    this.syncQueueManager = SyncQueueManager.getInstance();
  }

  /**
   * 获取单例实例
   */
  static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  /**
   * 检测存储空间配额
   */
  async checkStorageQuota(): Promise<StorageQuota> {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        const usage = estimate.usage || 0;
        const quota = estimate.quota || 0;
        const available = quota - usage;
        const usagePercentage = quota > 0 ? (usage / quota) * 100 : 0;
        const isLowSpace = available < this.LOW_SPACE_THRESHOLD;

        return {
          usage,
          quota,
          usagePercentage,
          available,
          isLowSpace,
        };
      }

      // 如果浏览器不支持 Storage API，返回默认值
      return {
        usage: 0,
        quota: 0,
        usagePercentage: 0,
        available: 0,
        isLowSpace: false,
      };
    } catch (error) {
      const offlineError = createOfflineError(
        OfflineErrorCode.STORAGE_ERROR,
        'Failed to check storage quota',
        error
      );
      ErrorLogger.log(offlineError, 'StorageManager.checkStorageQuota');
      throw offlineError;
    }
  }

  /**
   * 获取存储使用情况详情
   */
  async getStorageUsage(): Promise<StorageUsageDetails> {
    try {
      // 确保数据库已初始化
      await this.dbManager.initialize();

      // 获取总体配额信息
      const quota = await this.checkStorageQuota();

      // 获取笔记数量
      const notesCount = await this.dbManager.getNotesCount();

      // 获取同步队列数量
      const syncQueueCount = await this.syncQueueManager.getCount();

      // 获取草稿数量
      const drafts = this.draftManager.getAllDrafts();
      const draftsCount = drafts.length;

      // 估算各部分大小（粗略估计）
      // 平均每个笔记约 10KB，每个同步操作约 5KB，每个草稿约 5KB
      const notesSize = notesCount * 10 * 1024;
      const syncQueueSize = syncQueueCount * 5 * 1024;
      const draftsSize = draftsCount * 5 * 1024;

      return {
        total: quota,
        notes: {
          count: notesCount,
          estimatedSize: notesSize,
        },
        syncQueue: {
          count: syncQueueCount,
          estimatedSize: syncQueueSize,
        },
        drafts: {
          count: draftsCount,
          estimatedSize: draftsSize,
        },
      };
    } catch (error) {
      const offlineError = createOfflineError(
        OfflineErrorCode.STORAGE_ERROR,
        'Failed to get storage usage',
        error
      );
      ErrorLogger.log(offlineError, 'StorageManager.getStorageUsage');
      throw offlineError;
    }
  }

  /**
   * 清理缓存
   * @param options 清理选项
   */
  async cleanupCache(options?: {
    cleanOldNotes?: boolean; // 清理 30 天未访问的笔记
    cleanExpiredDrafts?: boolean; // 清理过期草稿
    daysOld?: number; // 笔记保留天数，默认 30 天
    draftDaysOld?: number; // 草稿保留天数，默认 7 天
  }): Promise<CleanupResult> {
    const {
      cleanOldNotes = true,
      cleanExpiredDrafts = true,
      daysOld = 30,
      draftDaysOld = 7,
    } = options || {};

    const result: CleanupResult = {
      notesDeleted: 0,
      draftsDeleted: 0,
      spaceFreed: 0,
      errors: [],
    };

    try {
      // 确保数据库已初始化
      await this.dbManager.initialize();

      // 获取清理前的存储使用情况
      const beforeUsage = await this.checkStorageQuota();

      // 清理旧笔记（只清理已同步的笔记，保留待同步的）
      if (cleanOldNotes) {
        try {
          const deletedCount = await this.dbManager.cleanupOldData(daysOld);
          result.notesDeleted = deletedCount;
        } catch (error) {
          const errorMsg = `Failed to cleanup old notes: ${error instanceof Error ? error.message : String(error)}`;
          result.errors.push(errorMsg);
          ErrorLogger.log(
            createOfflineError(OfflineErrorCode.STORAGE_ERROR, errorMsg, error),
            'StorageManager.cleanupCache'
          );
        }
      }

      // 清理过期草稿
      if (cleanExpiredDrafts) {
        try {
          const deletedCount = this.draftManager.cleanupExpiredDrafts(draftDaysOld);
          result.draftsDeleted = deletedCount;
        } catch (error) {
          const errorMsg = `Failed to cleanup expired drafts: ${error instanceof Error ? error.message : String(error)}`;
          result.errors.push(errorMsg);
          ErrorLogger.log(
            createOfflineError(OfflineErrorCode.STORAGE_ERROR, errorMsg, error),
            'StorageManager.cleanupCache'
          );
        }
      }

      // 获取清理后的存储使用情况
      const afterUsage = await this.checkStorageQuota();

      // 计算释放的空间
      result.spaceFreed = beforeUsage.usage - afterUsage.usage;

      return result;
    } catch (error) {
      const offlineError = createOfflineError(
        OfflineErrorCode.STORAGE_ERROR,
        'Failed to cleanup cache',
        error
      );
      ErrorLogger.log(offlineError, 'StorageManager.cleanupCache');
      throw offlineError;
    }
  }

  /**
   * 智能清理缓存
   * 根据存储空间自动决定清理策略
   */
  async smartCleanup(): Promise<CleanupResult> {
    try {
      const quota = await this.checkStorageQuota();

      // 如果空间充足，只清理过期草稿
      if (!quota.isLowSpace) {
        return await this.cleanupCache({
          cleanOldNotes: false,
          cleanExpiredDrafts: true,
        });
      }

      // 如果空间不足，执行完整清理
      return await this.cleanupCache({
        cleanOldNotes: true,
        cleanExpiredDrafts: true,
        daysOld: 30,
        draftDaysOld: 7,
      });
    } catch (error) {
      const offlineError = createOfflineError(
        OfflineErrorCode.STORAGE_ERROR,
        'Failed to perform smart cleanup',
        error
      );
      ErrorLogger.log(offlineError, 'StorageManager.smartCleanup');
      throw offlineError;
    }
  }

  /**
   * 检查是否需要清理
   */
  async needsCleanup(): Promise<boolean> {
    try {
      const quota = await this.checkStorageQuota();
      return quota.isLowSpace;
    } catch (error) {
      ErrorLogger.log(
        createOfflineError(
          OfflineErrorCode.STORAGE_ERROR,
          'Failed to check if cleanup is needed',
          error
        ),
        'StorageManager.needsCleanup'
      );
      return false;
    }
  }

  /**
   * 格式化字节大小为可读格式
   */
  static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  /**
   * 获取存储使用情况摘要（用于显示）
   */
  async getStorageSummary(): Promise<{
    total: string;
    used: string;
    available: string;
    percentage: number;
    isLowSpace: boolean;
  }> {
    try {
      const quota = await this.checkStorageQuota();

      return {
        total: StorageManager.formatBytes(quota.quota),
        used: StorageManager.formatBytes(quota.usage),
        available: StorageManager.formatBytes(quota.available),
        percentage: Math.round(quota.usagePercentage),
        isLowSpace: quota.isLowSpace,
      };
    } catch (error) {
      const offlineError = createOfflineError(
        OfflineErrorCode.STORAGE_ERROR,
        'Failed to get storage summary',
        error
      );
      ErrorLogger.log(offlineError, 'StorageManager.getStorageSummary');
      throw offlineError;
    }
  }
}

// 导出单例实例
export const storageManager = StorageManager.getInstance();
