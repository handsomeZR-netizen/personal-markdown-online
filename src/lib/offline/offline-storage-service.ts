/**
 * 离线存储服务
 * Offline Storage Service
 * 
 * 统一的离线存储接口，自动判断在线/离线状态并选择合适的存储方式
 * Requirements: 1.1, 1.2, 2.1, 2.2
 */

import { LocalNote, SaveResult, SyncStatusInfo } from '@/types/offline';
import { IndexedDBManager } from './indexeddb-manager';
import { SyncQueueManager } from './sync-queue-manager';
import { getNetworkStatusManager } from './network-status-manager';
import { OfflineSettingsManager } from './settings-manager';
import { createOfflineError, OfflineErrorCode, ErrorLogger } from './errors';

/**
 * 生成临时 ID
 * 格式：temp_${timestamp}_${random}
 */
export function generateTempId(): string {
  return `temp_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * 将服务器笔记转换为本地笔记格式
 */
function convertToLocalNote(
  note: {
    id: string;
    title: string;
    content: string;
    summary?: string | null;
    tags: Array<{ id: string; name: string }>;
    categoryId?: string | null;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
  },
  syncStatus: LocalNote['syncStatus'] = 'synced'
): LocalNote {
  return {
    id: note.id,
    title: note.title,
    content: note.content,
    summary: note.summary || undefined,
    tags: note.tags.map(t => t.name),
    categoryId: note.categoryId || undefined,
    userId: note.userId,
    createdAt: note.createdAt.getTime(),
    updatedAt: note.updatedAt.getTime(),
    lastAccessedAt: Date.now(),
    syncStatus,
  };
}

/**
 * 离线存储服务类
 */
export class OfflineStorageService {
  private dbManager: IndexedDBManager;
  private syncQueueManager: SyncQueueManager;
  private networkManager: ReturnType<typeof getNetworkStatusManager>;
  private static instance: OfflineStorageService | null = null;

  private constructor() {
    this.dbManager = IndexedDBManager.getInstance();
    this.syncQueueManager = SyncQueueManager.getInstance();
    this.networkManager = getNetworkStatusManager();
  }

  /**
   * 获取单例实例
   */
  static getInstance(): OfflineStorageService {
    if (!OfflineStorageService.instance) {
      OfflineStorageService.instance = new OfflineStorageService();
    }
    return OfflineStorageService.instance;
  }

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    try {
      await this.dbManager.initialize();
    } catch (error) {
      const offlineError = createOfflineError(
        OfflineErrorCode.DATABASE_ERROR,
        'Failed to initialize offline storage service',
        error
      );
      ErrorLogger.log(offlineError, 'OfflineStorageService.initialize');
      throw offlineError;
    }
  }

  /**
   * 保存笔记（自动判断在线/离线）
   * @param note 笔记数据
   * @param userId 用户 ID
   * @returns 保存结果
   */
  async saveNote(
    note: {
      id?: string;
      title: string;
      content: string;
      summary?: string;
      tags?: string[];
      categoryId?: string;
    },
    userId: string
  ): Promise<SaveResult> {
    try {
      await this.initialize();

      // Check if offline mode is enabled
      const settings = OfflineSettingsManager.getSettings();
      if (!settings.offlineModeEnabled) {
        throw createOfflineError(
          OfflineErrorCode.OFFLINE_MODE_DISABLED,
          'Offline mode is disabled in settings'
        );
      }

      const isOnline = this.networkManager.isOnline();
      const isNewNote = !note.id;
      const noteId = note.id || generateTempId();
      const now = Date.now();

      // 创建本地笔记对象
      const localNote: LocalNote = {
        id: noteId,
        title: note.title,
        content: note.content,
        summary: note.summary,
        tags: note.tags || [],
        categoryId: note.categoryId,
        userId,
        createdAt: now,
        updatedAt: now,
        lastAccessedAt: now,
        syncStatus: isOnline ? 'pending' : 'pending',
        tempId: isNewNote && !isOnline ? noteId : undefined,
      };

      // 保存到 IndexedDB
      await this.dbManager.saveNote(localNote);

      // 添加到同步队列
      await this.syncQueueManager.enqueue({
        type: isNewNote ? 'create' : 'update',
        noteId: noteId,
        tempId: isNewNote && !isOnline ? noteId : undefined,
        data: localNote,
        timestamp: now,
        retryCount: 0,
        status: 'pending',
      });

      return {
        success: true,
        noteId: noteId,
        isOffline: !isOnline,
        needsSync: true,
      };
    } catch (error) {
      const offlineError = createOfflineError(
        OfflineErrorCode.DATABASE_ERROR,
        'Failed to save note',
        error
      );
      ErrorLogger.log(offlineError, 'OfflineStorageService.saveNote');
      throw offlineError;
    }
  }

  /**
   * 获取笔记（优先从本地获取）
   * @param id 笔记 ID
   * @returns 笔记数据或 null
   */
  async getNote(id: string): Promise<LocalNote | null> {
    try {
      await this.initialize();

      // 从 IndexedDB 获取
      const note = await this.dbManager.getNote(id);

      if (note) {
        return note;
      }

      // 如果本地没有且在线，可以从服务器获取
      // 这里暂时返回 null，实际实现中可以调用 API
      return null;
    } catch (error) {
      const offlineError = createOfflineError(
        OfflineErrorCode.DATABASE_ERROR,
        'Failed to get note',
        error
      );
      ErrorLogger.log(offlineError, 'OfflineStorageService.getNote');
      throw offlineError;
    }
  }

  /**
   * 获取所有笔记（合并本地和远程数据）
   * @param userId 用户 ID
   * @returns 笔记列表
   */
  async getAllNotes(userId: string): Promise<LocalNote[]> {
    try {
      await this.initialize();

      // 从 IndexedDB 获取所有笔记
      const notes = await this.dbManager.getAllNotes(userId);

      return notes;
    } catch (error) {
      const offlineError = createOfflineError(
        OfflineErrorCode.DATABASE_ERROR,
        'Failed to get all notes',
        error
      );
      ErrorLogger.log(offlineError, 'OfflineStorageService.getAllNotes');
      throw offlineError;
    }
  }

  /**
   * 删除笔记（支持离线删除）
   * @param id 笔记 ID
   * @param userId 用户 ID
   */
  async deleteNote(id: string, userId: string): Promise<void> {
    try {
      await this.initialize();

      const isOnline = this.networkManager.isOnline();

      // 从 IndexedDB 删除
      await this.dbManager.deleteNote(id);

      // 添加删除操作到同步队列
      await this.syncQueueManager.enqueue({
        type: 'delete',
        noteId: id,
        data: { id, userId } as Partial<LocalNote>,
        timestamp: Date.now(),
        retryCount: 0,
        status: 'pending',
      });
    } catch (error) {
      const offlineError = createOfflineError(
        OfflineErrorCode.DATABASE_ERROR,
        'Failed to delete note',
        error
      );
      ErrorLogger.log(offlineError, 'OfflineStorageService.deleteNote');
      throw offlineError;
    }
  }

  /**
   * 更新笔记
   * @param id 笔记 ID
   * @param updates 更新的字段
   * @param userId 用户 ID
   */
  async updateNote(
    id: string,
    updates: Partial<{
      title: string;
      content: string;
      summary?: string;
      tags?: string[];
      categoryId?: string;
    }>,
    userId: string
  ): Promise<SaveResult> {
    try {
      await this.initialize();

      // 获取现有笔记
      const existingNote = await this.dbManager.getNote(id);

      if (!existingNote) {
        throw createOfflineError(
          OfflineErrorCode.DATA_NOT_FOUND,
          `Note with id ${id} not found`
        );
      }

      const isOnline = this.networkManager.isOnline();
      const now = Date.now();

      // 合并更新
      const updatedNote: LocalNote = {
        ...existingNote,
        ...updates,
        updatedAt: now,
        lastAccessedAt: now,
        syncStatus: 'pending',
      };

      // 保存到 IndexedDB
      await this.dbManager.saveNote(updatedNote);

      // 添加到同步队列
      await this.syncQueueManager.enqueue({
        type: 'update',
        noteId: id,
        data: updatedNote,
        timestamp: now,
        retryCount: 0,
        status: 'pending',
      });

      return {
        success: true,
        noteId: id,
        isOffline: !isOnline,
        needsSync: true,
      };
    } catch (error) {
      const offlineError = createOfflineError(
        OfflineErrorCode.DATABASE_ERROR,
        'Failed to update note',
        error
      );
      ErrorLogger.log(offlineError, 'OfflineStorageService.updateNote');
      throw offlineError;
    }
  }

  /**
   * 获取同步状态
   */
  async getSyncStatus(): Promise<SyncStatusInfo> {
    try {
      await this.initialize();

      const pendingCount = await this.syncQueueManager.getCount('pending');
      const lastSyncTime = await this.dbManager.getMetadata<number>('lastSyncTime');

      return {
        pendingOperations: pendingCount,
        lastSyncTime: lastSyncTime || undefined,
        syncInProgress: false, // 这个需要从同步引擎获取
      };
    } catch (error) {
      const offlineError = createOfflineError(
        OfflineErrorCode.DATABASE_ERROR,
        'Failed to get sync status',
        error
      );
      ErrorLogger.log(offlineError, 'OfflineStorageService.getSyncStatus');
      throw offlineError;
    }
  }

  /**
   * 根据临时 ID 查找笔记
   */
  async getNoteByTempId(tempId: string): Promise<LocalNote | null> {
    try {
      await this.initialize();
      return await this.dbManager.getNoteByTempId(tempId);
    } catch (error) {
      const offlineError = createOfflineError(
        OfflineErrorCode.DATABASE_ERROR,
        'Failed to get note by temp ID',
        error
      );
      ErrorLogger.log(offlineError, 'OfflineStorageService.getNoteByTempId');
      throw offlineError;
    }
  }

  /**
   * 检查笔记是否存在
   */
  async hasNote(id: string): Promise<boolean> {
    try {
      await this.initialize();
      const note = await this.dbManager.getNote(id);
      return note !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * 清理过期数据
   */
  async cleanupOldData(daysOld: number = 30): Promise<number> {
    try {
      await this.initialize();
      return await this.dbManager.cleanupOldData(daysOld);
    } catch (error) {
      const offlineError = createOfflineError(
        OfflineErrorCode.DATABASE_ERROR,
        'Failed to cleanup old data',
        error
      );
      ErrorLogger.log(offlineError, 'OfflineStorageService.cleanupOldData');
      throw offlineError;
    }
  }
}

// 导出单例实例
export const offlineStorageService = OfflineStorageService.getInstance();
