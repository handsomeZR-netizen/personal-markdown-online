/**
 * 同步队列管理器
 * 负责管理待同步操作的队列，包括增删改查和持久化
 */

import { SyncOperation, SyncStatus } from '@/types/offline';
import { IndexedDBManager } from './indexeddb-manager';
import {
  createOfflineError,
  OfflineErrorCode,
  ErrorLogger,
} from './errors';

/**
 * 同步队列管理器类
 */
export class SyncQueueManager {
  private dbManager: IndexedDBManager;
  private static instance: SyncQueueManager | null = null;

  private constructor() {
    this.dbManager = IndexedDBManager.getInstance();
  }

  /**
   * 获取单例实例
   */
  static getInstance(): SyncQueueManager {
    if (!SyncQueueManager.instance) {
      SyncQueueManager.instance = new SyncQueueManager();
    }
    return SyncQueueManager.instance;
  }

  /**
   * 生成唯一的操作 ID
   */
  private generateOperationId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 添加操作到队列
   * @param operation 同步操作（可以不包含 id，会自动生成）
   */
  async enqueue(operation: Omit<SyncOperation, 'id'> | SyncOperation): Promise<string> {
    try {
      // 确保数据库已初始化
      await this.dbManager.initialize();

      // 如果没有 id，生成一个
      const operationWithId: SyncOperation = {
        ...operation,
        id: 'id' in operation && operation.id ? operation.id : this.generateOperationId(),
        timestamp: operation.timestamp || Date.now(),
        retryCount: operation.retryCount || 0,
        status: operation.status || 'pending',
      };

      // 保存到 IndexedDB
      await this.dbManager.addToSyncQueue(operationWithId);

      return operationWithId.id;
    } catch (error) {
      const offlineError = createOfflineError(
        OfflineErrorCode.DATABASE_ERROR,
        'Failed to enqueue operation',
        error
      );
      ErrorLogger.log(offlineError, 'SyncQueueManager.enqueue');
      throw offlineError;
    }
  }

  /**
   * 获取所有待同步操作
   * @param statusFilter 可选的状态过滤器
   */
  async getQueue(statusFilter?: SyncStatus): Promise<SyncOperation[]> {
    try {
      // 确保数据库已初始化
      await this.dbManager.initialize();

      // 从 IndexedDB 获取所有操作
      const allOperations = await this.dbManager.getSyncQueue();

      // 如果有状态过滤器，进行过滤
      if (statusFilter) {
        return allOperations.filter(op => op.status === statusFilter);
      }

      return allOperations;
    } catch (error) {
      const offlineError = createOfflineError(
        OfflineErrorCode.DATABASE_ERROR,
        'Failed to get sync queue',
        error
      );
      ErrorLogger.log(offlineError, 'SyncQueueManager.getQueue');
      throw offlineError;
    }
  }

  /**
   * 移除已完成的操作
   * @param operationId 操作 ID
   */
  async dequeue(operationId: string): Promise<void> {
    try {
      // 确保数据库已初始化
      await this.dbManager.initialize();

      // 从 IndexedDB 中删除
      await this.dbManager.removeFromSyncQueue(operationId);
    } catch (error) {
      const offlineError = createOfflineError(
        OfflineErrorCode.DATABASE_ERROR,
        'Failed to dequeue operation',
        error
      );
      ErrorLogger.log(offlineError, 'SyncQueueManager.dequeue');
      throw offlineError;
    }
  }

  /**
   * 更新操作状态
   * @param operationId 操作 ID
   * @param status 新状态
   * @param error 可选的错误信息
   */
  async updateStatus(
    operationId: string,
    status: SyncStatus,
    error?: string
  ): Promise<void> {
    try {
      // 确保数据库已初始化
      await this.dbManager.initialize();

      // 获取现有操作
      const operations = await this.dbManager.getSyncQueue();
      const operation = operations.find(op => op.id === operationId);

      if (!operation) {
        throw createOfflineError(
          OfflineErrorCode.DATA_NOT_FOUND,
          `Operation with id ${operationId} not found`
        );
      }

      // 更新操作
      const updatedOperation: SyncOperation = {
        ...operation,
        status,
        error: error || operation.error,
        retryCount: status === 'failed' ? operation.retryCount + 1 : operation.retryCount,
      };

      // 保存更新
      await this.dbManager.updateSyncOperation(updatedOperation);
    } catch (error) {
      const offlineError = createOfflineError(
        OfflineErrorCode.DATABASE_ERROR,
        'Failed to update operation status',
        error
      );
      ErrorLogger.log(offlineError, 'SyncQueueManager.updateStatus');
      throw offlineError;
    }
  }

  /**
   * 清空队列
   * @param statusFilter 可选的状态过滤器，只清除特定状态的操作
   */
  async clear(statusFilter?: SyncStatus): Promise<void> {
    try {
      // 确保数据库已初始化
      await this.dbManager.initialize();

      if (statusFilter) {
        // 只清除特定状态的操作
        const operations = await this.dbManager.getSyncQueue();
        const operationsToDelete = operations.filter(op => op.status === statusFilter);

        for (const operation of operationsToDelete) {
          await this.dbManager.removeFromSyncQueue(operation.id);
        }
      } else {
        // 清空整个队列
        await this.dbManager.clearSyncQueue();
      }
    } catch (error) {
      const offlineError = createOfflineError(
        OfflineErrorCode.DATABASE_ERROR,
        'Failed to clear sync queue',
        error
      );
      ErrorLogger.log(offlineError, 'SyncQueueManager.clear');
      throw offlineError;
    }
  }

  /**
   * 获取待同步操作数量
   * @param statusFilter 可选的状态过滤器
   */
  async getCount(statusFilter?: SyncStatus): Promise<number> {
    try {
      const operations = await this.getQueue(statusFilter);
      return operations.length;
    } catch (error) {
      const offlineError = createOfflineError(
        OfflineErrorCode.DATABASE_ERROR,
        'Failed to get queue count',
        error
      );
      ErrorLogger.log(offlineError, 'SyncQueueManager.getCount');
      throw offlineError;
    }
  }

  /**
   * 获取特定笔记的待同步操作
   * @param noteId 笔记 ID
   */
  async getOperationsByNoteId(noteId: string): Promise<SyncOperation[]> {
    try {
      const allOperations = await this.getQueue();
      return allOperations.filter(op => op.noteId === noteId);
    } catch (error) {
      const offlineError = createOfflineError(
        OfflineErrorCode.DATABASE_ERROR,
        'Failed to get operations by note ID',
        error
      );
      ErrorLogger.log(offlineError, 'SyncQueueManager.getOperationsByNoteId');
      throw offlineError;
    }
  }

  /**
   * 检查是否有待同步的操作
   */
  async hasPendingOperations(): Promise<boolean> {
    try {
      const count = await this.getCount('pending');
      return count > 0;
    } catch (error) {
      const offlineError = createOfflineError(
        OfflineErrorCode.DATABASE_ERROR,
        'Failed to check pending operations',
        error
      );
      ErrorLogger.log(offlineError, 'SyncQueueManager.hasPendingOperations');
      throw offlineError;
    }
  }

  /**
   * 获取失败的操作（用于重试）
   * @param maxRetries 最大重试次数
   */
  async getFailedOperations(maxRetries: number = 3): Promise<SyncOperation[]> {
    try {
      const failedOps = await this.getQueue('failed');
      return failedOps.filter(op => op.retryCount < maxRetries);
    } catch (error) {
      const offlineError = createOfflineError(
        OfflineErrorCode.DATABASE_ERROR,
        'Failed to get failed operations',
        error
      );
      ErrorLogger.log(offlineError, 'SyncQueueManager.getFailedOperations');
      throw offlineError;
    }
  }

  /**
   * 重置操作状态为 pending（用于重试）
   * @param operationId 操作 ID
   */
  async resetToPending(operationId: string): Promise<void> {
    try {
      await this.updateStatus(operationId, 'pending');
    } catch (error) {
      const offlineError = createOfflineError(
        OfflineErrorCode.DATABASE_ERROR,
        'Failed to reset operation to pending',
        error
      );
      ErrorLogger.log(offlineError, 'SyncQueueManager.resetToPending');
      throw offlineError;
    }
  }
}

// 导出单例实例
export const syncQueueManager = SyncQueueManager.getInstance();
