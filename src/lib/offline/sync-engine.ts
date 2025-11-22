/**
 * 同步引擎
 * 负责执行同步操作，包括单个操作同步、批量同步和重试机制
 */

import {
  SyncOperation,
  SyncResult,
  SyncProgress,
  LocalNote,
  ConflictStrategy,
} from '@/types/offline';
import { SyncQueueManager } from './sync-queue-manager';
import { IndexedDBManager } from './indexeddb-manager';
import { createOfflineError, OfflineErrorCode, ErrorLogger } from './errors';
import { ConflictResolver, RemoteNote } from './conflict-resolver';

/**
 * 同步引擎配置
 */
interface SyncEngineConfig {
  maxRetries: number; // 最大重试次数
  retryDelay: number; // 重试延迟（毫秒）
  batchSize: number; // 批量同步大小
  batchThreshold: number; // 使用批量同步的阈值
}

/**
 * 默认配置
 */
const DEFAULT_CONFIG: SyncEngineConfig = {
  maxRetries: 3,
  retryDelay: 30000, // 30 秒
  batchSize: 20,
  batchThreshold: 10,
};

/**
 * 进度回调函数类型
 */
type ProgressCallback = (progress: SyncProgress) => void;

/**
 * 冲突回调函数类型
 */
type ConflictCallback = (
  local: LocalNote,
  remote: RemoteNote,
  operation: SyncOperation
) => Promise<ConflictStrategy | null>;

/**
 * 同步引擎类
 */
export class SyncEngine {
  private queueManager: SyncQueueManager;
  private dbManager: IndexedDBManager;
  private conflictResolver: ConflictResolver;
  private config: SyncEngineConfig;
  private isSyncing: boolean = false;
  private shouldStop: boolean = false;
  private progressCallbacks: Set<ProgressCallback> = new Set();
  private conflictCallback: ConflictCallback | null = null;
  private retryTimeouts: Map<string, NodeJS.Timeout> = new Map();

  private static instance: SyncEngine | null = null;

  private constructor(config: Partial<SyncEngineConfig> = {}) {
    this.queueManager = SyncQueueManager.getInstance();
    this.dbManager = IndexedDBManager.getInstance();
    this.conflictResolver = ConflictResolver.getInstance();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 获取单例实例
   */
  static getInstance(config?: Partial<SyncEngineConfig>): SyncEngine {
    if (!SyncEngine.instance) {
      SyncEngine.instance = new SyncEngine(config);
    }
    return SyncEngine.instance;
  }

  /**
   * 开始同步
   */
  async startSync(): Promise<SyncResult> {
    if (this.isSyncing) {
      throw createOfflineError(
        OfflineErrorCode.SYNC_IN_PROGRESS,
        'Sync is already in progress'
      );
    }

    this.isSyncing = true;
    this.shouldStop = false;

    try {
      // 获取所有待同步操作
      const pendingOps = await this.queueManager.getQueue('pending');

      if (pendingOps.length === 0) {
        return {
          total: 0,
          success: 0,
          failed: 0,
          errors: [],
        };
      }

      // 按时间戳排序
      const sortedOps = pendingOps.sort((a, b) => a.timestamp - b.timestamp);

      // 决定使用批量同步还是单个同步
      if (sortedOps.length >= this.config.batchThreshold) {
        return await this.batchSync(sortedOps);
      } else {
        return await this.syncMultipleOperations(sortedOps);
      }
    } catch (error) {
      const offlineError = createOfflineError(
        OfflineErrorCode.SYNC_FAILED,
        'Sync failed',
        error
      );
      ErrorLogger.log(offlineError, 'SyncEngine.startSync');
      throw offlineError;
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * 停止同步
   */
  stopSync(): void {
    this.shouldStop = true;
    
    // 清除所有重试定时器
    this.retryTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.retryTimeouts.clear();
  }

  /**
   * 同步单个操作
   */
  async syncOperation(operation: SyncOperation): Promise<boolean> {
    try {
      // 更新状态为 syncing
      await this.queueManager.updateStatus(operation.id, 'syncing');

      // 根据操作类型调用对应的 API
      let success = false;
      let realNoteId: string | undefined;

      switch (operation.type) {
        case 'create':
          realNoteId = await this.syncCreateOperation(operation);
          success = !!realNoteId;
          break;
        case 'update':
          success = await this.syncUpdateOperation(operation);
          break;
        case 'delete':
          success = await this.syncDeleteOperation(operation);
          break;
        default:
          throw new Error(`Unknown operation type: ${operation.type}`);
      }

      if (success) {
        // 同步成功，从队列中移除
        await this.queueManager.dequeue(operation.id);

        // 如果是创建操作，更新 IndexedDB 中的笔记 ID
        if (operation.type === 'create' && realNoteId && operation.tempId) {
          await this.updateNoteIdMapping(operation.tempId, realNoteId);
        }

        return true;
      } else {
        // 同步失败，更新状态
        await this.handleSyncFailure(operation, 'Sync operation failed');
        return false;
      }
    } catch (error) {
      // 同步失败，更新状态并记录错误
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      await this.handleSyncFailure(operation, errorMessage);
      const offlineError = createOfflineError(
        OfflineErrorCode.SYNC_FAILED,
        errorMessage,
        error
      );
      ErrorLogger.log(offlineError, 'SyncEngine.syncOperation');
      return false;
    }
  }

  /**
   * 批量同步
   */
  async batchSync(operations: SyncOperation[]): Promise<SyncResult> {
    const result: SyncResult = {
      total: operations.length,
      success: 0,
      failed: 0,
      errors: [],
    };

    // 分批处理
    const batches: SyncOperation[][] = [];
    for (let i = 0; i < operations.length; i += this.config.batchSize) {
      batches.push(operations.slice(i, i + this.config.batchSize));
    }

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      if (this.shouldStop) {
        break;
      }

      const batch = batches[batchIndex];

      try {
        // 调用批量同步 API
        const batchResult = await this.syncBatch(batch);

        // 处理批量同步结果
        for (let i = 0; i < batch.length; i++) {
          const operation = batch[i];
          const opResult = batchResult[i];

          if (opResult.success) {
            result.success++;
            await this.queueManager.dequeue(operation.id);

            // 如果是创建操作，更新 ID 映射
            if (
              operation.type === 'create' &&
              opResult.noteId &&
              operation.tempId
            ) {
              await this.updateNoteIdMapping(operation.tempId, opResult.noteId);
            }
          } else {
            result.failed++;
            result.errors.push({
              operationId: operation.id,
              error: opResult.error || 'Unknown error',
            });
            await this.handleSyncFailure(
              operation,
              opResult.error || 'Batch sync failed'
            );
          }

          // 更新进度
          this.notifyProgress({
            current: result.success + result.failed,
            total: result.total,
            percentage:
              ((result.success + result.failed) / result.total) * 100,
            currentOperation: operation,
          });
        }
      } catch (error) {
        // 批量同步失败，回退到单个同步
        const offlineError = createOfflineError(
          OfflineErrorCode.SYNC_FAILED,
          'Batch sync failed',
          error
        );
        ErrorLogger.log(offlineError, 'SyncEngine.batchSync');

        for (const operation of batch) {
          const success = await this.syncOperation(operation);
          if (success) {
            result.success++;
          } else {
            result.failed++;
            result.errors.push({
              operationId: operation.id,
              error: 'Batch sync failed, individual sync also failed',
            });
          }

          // 更新进度
          this.notifyProgress({
            current: result.success + result.failed,
            total: result.total,
            percentage:
              ((result.success + result.failed) / result.total) * 100,
            currentOperation: operation,
          });
        }
      }
    }

    return result;
  }

  /**
   * 监听同步进度
   */
  onProgress(callback: ProgressCallback): () => void {
    this.progressCallbacks.add(callback);

    // 返回取消监听的函数
    return () => {
      this.progressCallbacks.delete(callback);
    };
  }

  /**
   * 设置冲突回调
   * 当检测到冲突时，会调用此回调让用户选择解决策略
   */
  onConflict(callback: ConflictCallback): void {
    this.conflictCallback = callback;
  }

  /**
   * 获取同步状态
   */
  isSyncInProgress(): boolean {
    return this.isSyncing;
  }

  // ==================== Private Methods ====================

  /**
   * 同步多个操作（非批量）
   */
  private async syncMultipleOperations(
    operations: SyncOperation[]
  ): Promise<SyncResult> {
    const result: SyncResult = {
      total: operations.length,
      success: 0,
      failed: 0,
      errors: [],
    };

    for (let i = 0; i < operations.length; i++) {
      if (this.shouldStop) {
        break;
      }

      const operation = operations[i];
      const success = await this.syncOperation(operation);

      if (success) {
        result.success++;
      } else {
        result.failed++;
        result.errors.push({
          operationId: operation.id,
          error: 'Sync operation failed',
        });
      }

      // 更新进度
      this.notifyProgress({
        current: i + 1,
        total: result.total,
        percentage: ((i + 1) / result.total) * 100,
        currentOperation: operation,
      });
    }

    return result;
  }

  /**
   * 同步创建操作
   */
  private async syncCreateOperation(
    operation: SyncOperation
  ): Promise<string | undefined> {
    const formData = new FormData();
    formData.append('title', operation.data.title || '');
    formData.append('content', operation.data.content || '');
    formData.append('tagIds', JSON.stringify(operation.data.tags || []));
    if (operation.data.categoryId) {
      formData.append('categoryId', operation.data.categoryId);
    }

    // 调用服务器 API 创建笔记
    const response = await fetch('/api/notes', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to create note: ${response.statusText}`);
    }

    const result = await response.json();
    return result.id || undefined;
  }

  /**
   * 同步更新操作
   */
  private async syncUpdateOperation(operation: SyncOperation): Promise<boolean> {
    // 检查冲突
    const conflictDetected = await this.checkForConflict(operation);
    
    if (conflictDetected) {
      // 冲突已处理，返回 false 表示此操作未完成同步
      // 冲突解决后会创建新的同步操作
      return false;
    }

    const formData = new FormData();
    if (operation.data.title) formData.append('title', operation.data.title);
    if (operation.data.content)
      formData.append('content', operation.data.content);
    if (operation.data.tags)
      formData.append('tagIds', JSON.stringify(operation.data.tags));
    if (operation.data.categoryId !== undefined) {
      formData.append('categoryId', operation.data.categoryId || '');
    }

    // 调用服务器 API 更新笔记
    const response = await fetch(`/api/notes/${operation.noteId}`, {
      method: 'PUT',
      body: formData,
    });

    return response.ok;
  }

  /**
   * 同步删除操作
   */
  private async syncDeleteOperation(operation: SyncOperation): Promise<boolean> {
    // 调用服务器 API 删除笔记
    const response = await fetch(`/api/notes/${operation.noteId}`, {
      method: 'DELETE',
    });

    return response.ok;
  }

  /**
   * 调用批量同步 API
   */
  private async syncBatch(
    operations: SyncOperation[]
  ): Promise<Array<{ success: boolean; noteId?: string; error?: string }>> {
    const response = await fetch('/api/notes/batch-sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ operations }),
    });

    if (!response.ok) {
      // 处理超时情况 (408)
      if (response.status === 408) {
        const result = await response.json();
        console.warn('批量同步超时，返回部分结果:', result.summary);
        return result.results || [];
      }
      
      throw new Error(`Batch sync failed: ${response.statusText}`);
    }

    const result = await response.json();
    
    // 记录同步摘要
    if (result.summary) {
      console.log('批量同步完成:', result.summary);
    }
    
    return result.results || [];
  }

  /**
   * 处理同步失败
   */
  private async handleSyncFailure(
    operation: SyncOperation,
    errorMessage: string
  ): Promise<void> {
    // 更新操作状态为 failed
    await this.queueManager.updateStatus(operation.id, 'failed', errorMessage);

    // 检查是否需要重试
    if (operation.retryCount < this.config.maxRetries) {
      // 安排重试
      this.scheduleRetry(operation);
    }
  }

  /**
   * 安排重试
   */
  private scheduleRetry(operation: SyncOperation): void {
    // 清除现有的重试定时器
    const existingTimeout = this.retryTimeouts.get(operation.id);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // 设置新的重试定时器
    const timeout = setTimeout(async () => {
      try {
        // 重置状态为 pending
        await this.queueManager.resetToPending(operation.id);

        // 移除定时器引用
        this.retryTimeouts.delete(operation.id);
      } catch (error) {
        const offlineError = createOfflineError(
          OfflineErrorCode.SYNC_FAILED,
          'Failed to schedule retry',
          error
        );
        ErrorLogger.log(offlineError, 'SyncEngine.scheduleRetry');
      }
    }, this.config.retryDelay);

    this.retryTimeouts.set(operation.id, timeout);
  }

  /**
   * 更新笔记 ID 映射（临时 ID -> 真实 ID）
   */
  private async updateNoteIdMapping(
    tempId: string,
    realId: string
  ): Promise<void> {
    try {
      // 从 IndexedDB 获取笔记
      const note = await this.dbManager.getNoteByTempId(tempId);

      if (note) {
        // 删除旧的笔记（使用临时 ID）
        await this.dbManager.deleteNote(note.id);

        // 保存新的笔记（使用真实 ID）
        const updatedNote: LocalNote = {
          ...note,
          id: realId,
          tempId: undefined,
          syncStatus: 'synced',
        };

        await this.dbManager.saveNote(updatedNote);
      }
    } catch (error) {
      const offlineError = createOfflineError(
        OfflineErrorCode.DATABASE_ERROR,
        'Failed to update note ID mapping',
        error
      );
      ErrorLogger.log(offlineError, 'SyncEngine.updateNoteIdMapping');
    }
  }

  /**
   * 通知进度更新
   */
  private notifyProgress(progress: SyncProgress): void {
    this.progressCallbacks.forEach((callback) => {
      try {
        callback(progress);
      } catch (error) {
        const offlineError = createOfflineError(
          OfflineErrorCode.SYNC_FAILED,
          'Failed to notify progress',
          error
        );
        ErrorLogger.log(offlineError, 'SyncEngine.notifyProgress');
      }
    });
  }

  /**
   * 检查冲突
   * 在同步更新操作前，检查服务器版本是否与本地版本冲突
   */
  private async checkForConflict(operation: SyncOperation): Promise<boolean> {
    try {
      // 只检查更新操作的冲突
      if (operation.type !== 'update') {
        return false;
      }

      // 获取本地笔记
      const localNote = await this.dbManager.getNote(operation.noteId);
      if (!localNote) {
        return false;
      }

      // 获取服务器版本
      const response = await fetch(`/api/notes/${operation.noteId}`, {
        method: 'GET',
      });

      if (!response.ok) {
        // 如果获取失败，不视为冲突，继续同步
        return false;
      }

      const remoteNote: RemoteNote = await response.json();

      // 检测冲突
      const hasConflict = this.conflictResolver.detectConflict(
        localNote,
        remoteNote
      );

      if (hasConflict) {
        // 如果有冲突且设置了冲突回调，调用回调
        if (this.conflictCallback) {
          const strategy = await this.conflictCallback(
            localNote,
            remoteNote,
            operation
          );

          if (strategy) {
            // 用户选择了解决策略，执行冲突解决
            await this.handleConflictResolution(
              localNote,
              remoteNote,
              operation,
              strategy
            );
          }
        } else {
          // 没有设置冲突回调，记录错误
          const error = createOfflineError(
            OfflineErrorCode.CONFLICT_DETECTED,
            'Conflict detected but no conflict callback set'
          );
          ErrorLogger.log(error, 'SyncEngine.checkForConflict');
        }

        return true;
      }

      return false;
    } catch (error) {
      const offlineError = createOfflineError(
        OfflineErrorCode.CONFLICT_DETECTED,
        'Failed to check for conflict',
        error
      );
      ErrorLogger.log(offlineError, 'SyncEngine.checkForConflict');
      // 检查失败时不阻止同步
      return false;
    }
  }

  /**
   * 处理冲突解决
   */
  private async handleConflictResolution(
    local: LocalNote,
    remote: RemoteNote,
    operation: SyncOperation,
    strategy: ConflictStrategy
  ): Promise<void> {
    try {
      // 解决冲突
      const resolvedNote = await this.conflictResolver.resolveConflict(
        local,
        remote,
        strategy
      );

      // 更新 IndexedDB 中的笔记
      await this.dbManager.saveNote(resolvedNote);

      // 从队列中移除当前操作
      await this.queueManager.dequeue(operation.id);

      // 根据策略决定后续操作
      if (strategy === 'use-local') {
        // 保留本地版本，创建新的同步操作
        await this.queueManager.enqueue({
          id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'update',
          noteId: resolvedNote.id,
          data: {
            title: resolvedNote.title,
            content: resolvedNote.content,
            summary: resolvedNote.summary,
            tags: resolvedNote.tags,
            categoryId: resolvedNote.categoryId,
          },
          timestamp: Date.now(),
          retryCount: 0,
          status: 'pending',
        });
      } else if (strategy === 'use-remote') {
        // 使用服务器版本，不需要再同步
        // 笔记已经更新为服务器版本，状态为 synced
      } else if (strategy === 'manual-merge') {
        // 手动合并，创建新的同步操作
        await this.queueManager.enqueue({
          id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'update',
          noteId: resolvedNote.id,
          data: {
            title: resolvedNote.title,
            content: resolvedNote.content,
            summary: resolvedNote.summary,
            tags: resolvedNote.tags,
            categoryId: resolvedNote.categoryId,
          },
          timestamp: Date.now(),
          retryCount: 0,
          status: 'pending',
        });
      }
    } catch (error) {
      const offlineError = createOfflineError(
        OfflineErrorCode.CONFLICT_DETECTED,
        'Failed to handle conflict resolution',
        error
      );
      ErrorLogger.log(offlineError, 'SyncEngine.handleConflictResolution');
      throw offlineError;
    }
  }
}

// 导出单例实例
export const syncEngine = SyncEngine.getInstance();
