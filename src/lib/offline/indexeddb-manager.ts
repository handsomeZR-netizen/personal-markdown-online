/**
 * IndexedDB 管理器
 * 负责管理本地数据库的初始化、CRUD 操作和数据清理
 */

import {
  LocalNote,
  SyncOperation,
  MetadataStore,
  IndexedDBConfig,
} from '@/types/offline';
import {
  OfflineError,
  OfflineErrorCode,
  createOfflineError,
  ErrorLogger,
} from './errors';

/**
 * IndexedDB 数据库配置
 */
const DB_CONFIG: IndexedDBConfig = {
  name: 'NoteAppDB',
  version: 1,
  stores: {
    notes: 'notes',
    syncQueue: 'syncQueue',
    metadata: 'metadata',
  },
};

/**
 * 查询结果缓存接口
 */
interface QueryCache<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

/**
 * IndexedDB 管理器类
 */
export class IndexedDBManager {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;
  
  // 查询结果缓存
  private queryCache: Map<string, QueryCache<unknown>> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存过期时间
  private readonly MAX_CACHE_SIZE = 50; // 最大缓存条目数

  /**
   * 获取单例实例
   */
  private static instance: IndexedDBManager | null = null;

  static getInstance(): IndexedDBManager {
    if (!IndexedDBManager.instance) {
      IndexedDBManager.instance = new IndexedDBManager();
    }
    return IndexedDBManager.instance;
  }

  /**
   * 检查浏览器是否支持 IndexedDB
   */
  static isSupported(): boolean {
    return typeof window !== 'undefined' && 'indexedDB' in window;
  }

  /**
   * 初始化数据库
   */
  async initialize(): Promise<void> {
    // 如果已经初始化，返回现有的 Promise
    if (this.initPromise) {
      return this.initPromise;
    }

    // 如果数据库已经打开，直接返回
    if (this.db) {
      return Promise.resolve();
    }

    // 检查浏览器支持
    if (!IndexedDBManager.isSupported()) {
      const error = createOfflineError(
        OfflineErrorCode.INDEXEDDB_NOT_SUPPORTED,
        'IndexedDB is not supported in this browser'
      );
      ErrorLogger.log(error, 'IndexedDBManager.initialize');
      throw error;
    }

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_CONFIG.name, DB_CONFIG.version);

      request.onerror = () => {
        const error = createOfflineError(
          OfflineErrorCode.DATABASE_ERROR,
          'Failed to open IndexedDB',
          request.error
        );
        ErrorLogger.log(error, 'IndexedDBManager.initialize');
        this.initPromise = null;
        reject(error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        this.createObjectStores(db);
      };
    });

    return this.initPromise;
  }

  /**
   * 创建 Object Stores 和索引
   */
  private createObjectStores(db: IDBDatabase): void {
    // 创建 notes store
    if (!db.objectStoreNames.contains(DB_CONFIG.stores.notes)) {
      const notesStore = db.createObjectStore(DB_CONFIG.stores.notes, {
        keyPath: 'id',
      });

      // 创建索引
      notesStore.createIndex('userId', 'userId', { unique: false });
      notesStore.createIndex('updatedAt', 'updatedAt', { unique: false });
      notesStore.createIndex('syncStatus', 'syncStatus', { unique: false });
      notesStore.createIndex('lastAccessedAt', 'lastAccessedAt', {
        unique: false,
      });
      notesStore.createIndex('tempId', 'tempId', { unique: false });
    }

    // 创建 syncQueue store
    if (!db.objectStoreNames.contains(DB_CONFIG.stores.syncQueue)) {
      const syncQueueStore = db.createObjectStore(DB_CONFIG.stores.syncQueue, {
        keyPath: 'id',
      });

      // 创建索引
      syncQueueStore.createIndex('timestamp', 'timestamp', { unique: false });
      syncQueueStore.createIndex('status', 'status', { unique: false });
      syncQueueStore.createIndex('noteId', 'noteId', { unique: false });
    }

    // 创建 metadata store
    if (!db.objectStoreNames.contains(DB_CONFIG.stores.metadata)) {
      db.createObjectStore(DB_CONFIG.stores.metadata, {
        keyPath: 'key',
      });
    }
  }

  /**
   * 确保数据库已初始化
   */
  private async ensureInitialized(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.initialize();
    }
    if (!this.db) {
      throw createOfflineError(
        OfflineErrorCode.DATABASE_ERROR,
        'Database not initialized'
      );
    }
    return this.db;
  }

  /**
   * 获取事务
   */
  private getTransaction(
    storeNames: string | string[],
    mode: IDBTransactionMode = 'readonly'
  ): IDBTransaction {
    if (!this.db) {
      throw createOfflineError(
        OfflineErrorCode.DATABASE_ERROR,
        'Database not initialized'
      );
    }
    return this.db.transaction(storeNames, mode);
  }

  /**
   * 执行数据库操作的通用方法
   */
  private async executeOperation<T>(
    storeName: string,
    mode: IDBTransactionMode,
    operation: (store: IDBObjectStore) => IDBRequest<T>
  ): Promise<T> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.getTransaction(storeName, mode);
        const store = transaction.objectStore(storeName);
        const request = operation(store);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => {
          const error = createOfflineError(
            OfflineErrorCode.DATABASE_ERROR,
            `Operation failed on ${storeName}`,
            request.error
          );
          ErrorLogger.log(error, 'IndexedDBManager.executeOperation');
          reject(error);
        };
      } catch (error) {
        const offlineError = createOfflineError(
          OfflineErrorCode.DATABASE_ERROR,
          'Failed to execute operation',
          error
        );
        ErrorLogger.log(offlineError, 'IndexedDBManager.executeOperation');
        reject(offlineError);
      }
    });
  }

  /**
   * 关闭数据库连接
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initPromise = null;
      this.clearCache();
    }
  }

  /**
   * 清除查询缓存
   */
  private clearCache(): void {
    this.queryCache.clear();
  }

  /**
   * 使缓存失效
   */
  invalidateCache(pattern?: string): void {
    if (!pattern) {
      this.clearCache();
      return;
    }

    // 删除匹配模式的缓存
    for (const key of this.queryCache.keys()) {
      if (key.includes(pattern)) {
        this.queryCache.delete(key);
      }
    }
  }

  /**
   * 从缓存获取数据
   */
  private getCachedData<T>(cacheKey: string): T | null {
    const cached = this.queryCache.get(cacheKey) as QueryCache<T> | undefined;
    
    if (!cached) {
      return null;
    }

    // 检查是否过期
    if (Date.now() > cached.expiresAt) {
      this.queryCache.delete(cacheKey);
      return null;
    }

    return cached.data;
  }

  /**
   * 设置缓存数据
   */
  private setCachedData<T>(cacheKey: string, data: T): void {
    // 如果缓存已满，删除最旧的条目
    if (this.queryCache.size >= this.MAX_CACHE_SIZE) {
      const firstKey = this.queryCache.keys().next().value;
      if (firstKey) {
        this.queryCache.delete(firstKey);
      }
    }

    const now = Date.now();
    this.queryCache.set(cacheKey, {
      data,
      timestamp: now,
      expiresAt: now + this.CACHE_TTL,
    });
  }

  /**
   * 删除数据库
   */
  static async deleteDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(DB_CONFIG.name);

      request.onsuccess = () => resolve();
      request.onerror = () => {
        const error = createOfflineError(
          OfflineErrorCode.DATABASE_ERROR,
          'Failed to delete database',
          request.error
        );
        ErrorLogger.log(error, 'IndexedDBManager.deleteDatabase');
        reject(error);
      };
    });
  }

  // ==================== Notes CRUD Operations ====================

  /**
   * 保存笔记到 IndexedDB
   */
  async saveNote(note: LocalNote): Promise<void> {
    try {
      // 更新最后访问时间
      const noteToSave = {
        ...note,
        lastAccessedAt: Date.now(),
      };

      await this.executeOperation(
        DB_CONFIG.stores.notes,
        'readwrite',
        (store) => store.put(noteToSave)
      );

      // 使缓存失效
      this.invalidateCache('notes_');
    } catch (error) {
      const offlineError = createOfflineError(
        OfflineErrorCode.DATABASE_ERROR,
        'Failed to save note',
        error
      );
      ErrorLogger.log(offlineError, 'IndexedDBManager.saveNote');
      throw offlineError;
    }
  }

  /**
   * 获取单个笔记
   */
  async getNote(id: string): Promise<LocalNote | null> {
    try {
      const note = await this.executeOperation<LocalNote | undefined>(
        DB_CONFIG.stores.notes,
        'readwrite',
        (store) => store.get(id)
      );

      if (note) {
        // 更新最后访问时间
        note.lastAccessedAt = Date.now();
        await this.executeOperation(
          DB_CONFIG.stores.notes,
          'readwrite',
          (store) => store.put(note)
        );
        return note;
      }

      return null;
    } catch (error) {
      const offlineError = createOfflineError(
        OfflineErrorCode.DATABASE_ERROR,
        'Failed to get note',
        error
      );
      ErrorLogger.log(offlineError, 'IndexedDBManager.getNote');
      throw offlineError;
    }
  }

  /**
   * 获取所有笔记（带缓存）
   */
  async getAllNotes(userId?: string, useCache: boolean = true): Promise<LocalNote[]> {
    const cacheKey = `notes_all_${userId || 'all'}`;

    // 尝试从缓存获取
    if (useCache) {
      const cached = this.getCachedData<LocalNote[]>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.getTransaction(DB_CONFIG.stores.notes);
        const store = transaction.objectStore(DB_CONFIG.stores.notes);
        const notes: LocalNote[] = [];

        let request: IDBRequest;

        if (userId) {
          // 使用 userId 索引优化查询
          const index = store.index('userId');
          request = index.openCursor(IDBKeyRange.only(userId));
        } else {
          // 使用 updatedAt 索引进行排序查询，避免后续排序
          const index = store.index('updatedAt');
          request = index.openCursor(null, 'prev'); // 降序遍历
        }

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest<IDBCursorWithValue>)
            .result;
          if (cursor) {
            notes.push(cursor.value);
            cursor.continue();
          } else {
            // 如果使用了 userId 过滤，需要排序
            if (userId) {
              notes.sort((a, b) => b.updatedAt - a.updatedAt);
            }
            
            // 缓存结果
            this.setCachedData(cacheKey, notes);
            resolve(notes);
          }
        };

        request.onerror = () => {
          const error = createOfflineError(
            OfflineErrorCode.DATABASE_ERROR,
            'Failed to get all notes',
            request.error
          );
          ErrorLogger.log(error, 'IndexedDBManager.getAllNotes');
          reject(error);
        };
      } catch (error) {
        const offlineError = createOfflineError(
          OfflineErrorCode.DATABASE_ERROR,
          'Failed to get all notes',
          error
        );
        ErrorLogger.log(offlineError, 'IndexedDBManager.getAllNotes');
        reject(offlineError);
      }
    });
  }

  /**
   * 分页获取笔记（优化大量数据查询）
   */
  async getNotesPaginated(
    userId: string | undefined,
    limit: number = 20,
    offset: number = 0
  ): Promise<{ notes: LocalNote[]; total: number; hasMore: boolean }> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.getTransaction(DB_CONFIG.stores.notes);
        const store = transaction.objectStore(DB_CONFIG.stores.notes);
        const notes: LocalNote[] = [];
        let skipped = 0;
        let total = 0;

        let cursorRequest: IDBRequest;
        let countRequest: IDBRequest;

        if (userId) {
          const index = store.index('userId');
          cursorRequest = index.openCursor(IDBKeyRange.only(userId));
          countRequest = index.count(IDBKeyRange.only(userId));
        } else {
          const index = store.index('updatedAt');
          cursorRequest = index.openCursor(null, 'prev');
          countRequest = store.count();
        }

        // 获取总数
        countRequest.onsuccess = () => {
          total = countRequest.result;
        };

        // 使用游标进行分页
        cursorRequest.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest<IDBCursorWithValue>)
            .result;
          
          if (cursor) {
            // 跳过前面的记录
            if (skipped < offset) {
              skipped++;
              cursor.continue();
              return;
            }

            // 收集当前页的记录
            if (notes.length < limit) {
              notes.push(cursor.value);
              cursor.continue();
            } else {
              // 已收集足够的记录
              const hasMore = (offset + limit) < total;
              resolve({ notes, total, hasMore });
            }
          } else {
            // 遍历完成
            const hasMore = (offset + limit) < total;
            resolve({ notes, total, hasMore });
          }
        };

        cursorRequest.onerror = () => {
          const error = createOfflineError(
            OfflineErrorCode.DATABASE_ERROR,
            'Failed to get paginated notes',
            cursorRequest.error
          );
          ErrorLogger.log(error, 'IndexedDBManager.getNotesPaginated');
          reject(error);
        };
      } catch (error) {
        const offlineError = createOfflineError(
          OfflineErrorCode.DATABASE_ERROR,
          'Failed to get paginated notes',
          error
        );
        ErrorLogger.log(offlineError, 'IndexedDBManager.getNotesPaginated');
        reject(offlineError);
      }
    });
  }

  /**
   * 删除笔记
   */
  async deleteNote(id: string): Promise<void> {
    try {
      await this.executeOperation(
        DB_CONFIG.stores.notes,
        'readwrite',
        (store) => store.delete(id)
      );

      // 使缓存失效
      this.invalidateCache('notes_');
    } catch (error) {
      const offlineError = createOfflineError(
        OfflineErrorCode.DATABASE_ERROR,
        'Failed to delete note',
        error
      );
      ErrorLogger.log(offlineError, 'IndexedDBManager.deleteNote');
      throw offlineError;
    }
  }

  /**
   * 清理过期数据
   * @param daysOld 清理多少天前的数据
   * @returns 清理的笔记数量
   */
  async cleanupOldData(daysOld: number = 30): Promise<number> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      try {
        const cutoffTime = Date.now() - daysOld * 24 * 60 * 60 * 1000;
        const transaction = this.getTransaction(
          DB_CONFIG.stores.notes,
          'readwrite'
        );
        const store = transaction.objectStore(DB_CONFIG.stores.notes);
        const index = store.index('lastAccessedAt');
        const request = index.openCursor(IDBKeyRange.upperBound(cutoffTime));

        let deletedCount = 0;
        const idsToDelete: string[] = [];

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest<IDBCursorWithValue>)
            .result;
          if (cursor) {
            const note = cursor.value as LocalNote;
            // 只删除已同步的笔记，保留待同步的笔记
            if (note.syncStatus === 'synced') {
              idsToDelete.push(note.id);
            }
            cursor.continue();
          } else {
            // 删除收集到的笔记
            idsToDelete.forEach((id) => {
              store.delete(id);
              deletedCount++;
            });
            resolve(deletedCount);
          }
        };

        request.onerror = () => {
          const error = createOfflineError(
            OfflineErrorCode.DATABASE_ERROR,
            'Failed to cleanup old data',
            request.error
          );
          ErrorLogger.log(error, 'IndexedDBManager.cleanupOldData');
          reject(error);
        };
      } catch (error) {
        const offlineError = createOfflineError(
          OfflineErrorCode.DATABASE_ERROR,
          'Failed to cleanup old data',
          error
        );
        ErrorLogger.log(offlineError, 'IndexedDBManager.cleanupOldData');
        reject(offlineError);
      }
    });
  }

  /**
   * 根据临时 ID 查找笔记
   */
  async getNoteByTempId(tempId: string): Promise<LocalNote | null> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.getTransaction(DB_CONFIG.stores.notes);
        const store = transaction.objectStore(DB_CONFIG.stores.notes);
        const index = store.index('tempId');
        const request = index.get(tempId);

        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => {
          const error = createOfflineError(
            OfflineErrorCode.DATABASE_ERROR,
            'Failed to get note by temp ID',
            request.error
          );
          ErrorLogger.log(error, 'IndexedDBManager.getNoteByTempId');
          reject(error);
        };
      } catch (error) {
        const offlineError = createOfflineError(
          OfflineErrorCode.DATABASE_ERROR,
          'Failed to get note by temp ID',
          error
        );
        ErrorLogger.log(offlineError, 'IndexedDBManager.getNoteByTempId');
        reject(offlineError);
      }
    });
  }

  /**
   * 批量保存笔记（优化性能）
   */
  async saveNotesBatch(notes: LocalNote[]): Promise<void> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.getTransaction(
          DB_CONFIG.stores.notes,
          'readwrite'
        );
        const store = transaction.objectStore(DB_CONFIG.stores.notes);

        // 批量添加笔记
        notes.forEach((note) => {
          const noteToSave = {
            ...note,
            lastAccessedAt: Date.now(),
          };
          store.put(noteToSave);
        });

        transaction.oncomplete = () => {
          // 使缓存失效
          this.invalidateCache('notes_');
          resolve();
        };

        transaction.onerror = () => {
          const error = createOfflineError(
            OfflineErrorCode.DATABASE_ERROR,
            'Failed to save notes batch',
            transaction.error
          );
          ErrorLogger.log(error, 'IndexedDBManager.saveNotesBatch');
          reject(error);
        };
      } catch (error) {
        const offlineError = createOfflineError(
          OfflineErrorCode.DATABASE_ERROR,
          'Failed to save notes batch',
          error
        );
        ErrorLogger.log(offlineError, 'IndexedDBManager.saveNotesBatch');
        reject(offlineError);
      }
    });
  }

  /**
   * 批量删除笔记（优化性能）
   */
  async deleteNotesBatch(ids: string[]): Promise<void> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.getTransaction(
          DB_CONFIG.stores.notes,
          'readwrite'
        );
        const store = transaction.objectStore(DB_CONFIG.stores.notes);

        // 批量删除笔记
        ids.forEach((id) => {
          store.delete(id);
        });

        transaction.oncomplete = () => {
          // 使缓存失效
          this.invalidateCache('notes_');
          resolve();
        };

        transaction.onerror = () => {
          const error = createOfflineError(
            OfflineErrorCode.DATABASE_ERROR,
            'Failed to delete notes batch',
            transaction.error
          );
          ErrorLogger.log(error, 'IndexedDBManager.deleteNotesBatch');
          reject(error);
        };
      } catch (error) {
        const offlineError = createOfflineError(
          OfflineErrorCode.DATABASE_ERROR,
          'Failed to delete notes batch',
          error
        );
        ErrorLogger.log(offlineError, 'IndexedDBManager.deleteNotesBatch');
        reject(offlineError);
      }
    });
  }

  // ==================== Sync Queue Operations ====================

  /**
   * 添加同步操作到队列
   */
  async addToSyncQueue(operation: SyncOperation): Promise<void> {
    try {
      await this.executeOperation(
        DB_CONFIG.stores.syncQueue,
        'readwrite',
        (store) => store.put(operation)
      );
    } catch (error) {
      const offlineError = createOfflineError(
        OfflineErrorCode.DATABASE_ERROR,
        'Failed to add to sync queue',
        error
      );
      ErrorLogger.log(offlineError, 'IndexedDBManager.addToSyncQueue');
      throw offlineError;
    }
  }

  /**
   * 获取同步队列
   */
  async getSyncQueue(): Promise<SyncOperation[]> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.getTransaction(DB_CONFIG.stores.syncQueue);
        const store = transaction.objectStore(DB_CONFIG.stores.syncQueue);
        const index = store.index('timestamp');
        const request = index.openCursor();
        const operations: SyncOperation[] = [];

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest<IDBCursorWithValue>)
            .result;
          if (cursor) {
            operations.push(cursor.value);
            cursor.continue();
          } else {
            resolve(operations);
          }
        };

        request.onerror = () => {
          const error = createOfflineError(
            OfflineErrorCode.DATABASE_ERROR,
            'Failed to get sync queue',
            request.error
          );
          ErrorLogger.log(error, 'IndexedDBManager.getSyncQueue');
          reject(error);
        };
      } catch (error) {
        const offlineError = createOfflineError(
          OfflineErrorCode.DATABASE_ERROR,
          'Failed to get sync queue',
          error
        );
        ErrorLogger.log(offlineError, 'IndexedDBManager.getSyncQueue');
        reject(offlineError);
      }
    });
  }

  /**
   * 从同步队列中移除操作
   */
  async removeFromSyncQueue(operationId: string): Promise<void> {
    try {
      await this.executeOperation(
        DB_CONFIG.stores.syncQueue,
        'readwrite',
        (store) => store.delete(operationId)
      );
    } catch (error) {
      const offlineError = createOfflineError(
        OfflineErrorCode.DATABASE_ERROR,
        'Failed to remove from sync queue',
        error
      );
      ErrorLogger.log(offlineError, 'IndexedDBManager.removeFromSyncQueue');
      throw offlineError;
    }
  }

  /**
   * 更新同步操作状态
   */
  async updateSyncOperation(operation: SyncOperation): Promise<void> {
    try {
      await this.executeOperation(
        DB_CONFIG.stores.syncQueue,
        'readwrite',
        (store) => store.put(operation)
      );
    } catch (error) {
      const offlineError = createOfflineError(
        OfflineErrorCode.DATABASE_ERROR,
        'Failed to update sync operation',
        error
      );
      ErrorLogger.log(offlineError, 'IndexedDBManager.updateSyncOperation');
      throw offlineError;
    }
  }

  /**
   * 清空同步队列
   */
  async clearSyncQueue(): Promise<void> {
    try {
      await this.executeOperation(
        DB_CONFIG.stores.syncQueue,
        'readwrite',
        (store) => store.clear()
      );
    } catch (error) {
      const offlineError = createOfflineError(
        OfflineErrorCode.DATABASE_ERROR,
        'Failed to clear sync queue',
        error
      );
      ErrorLogger.log(offlineError, 'IndexedDBManager.clearSyncQueue');
      throw offlineError;
    }
  }

  // ==================== Metadata Operations ====================

  /**
   * 保存元数据
   */
  async setMetadata(key: string, value: unknown): Promise<void> {
    try {
      const metadata: MetadataStore = {
        key,
        value,
        updatedAt: Date.now(),
      };

      await this.executeOperation(
        DB_CONFIG.stores.metadata,
        'readwrite',
        (store) => store.put(metadata)
      );
    } catch (error) {
      const offlineError = createOfflineError(
        OfflineErrorCode.DATABASE_ERROR,
        'Failed to set metadata',
        error
      );
      ErrorLogger.log(offlineError, 'IndexedDBManager.setMetadata');
      throw offlineError;
    }
  }

  /**
   * 获取元数据
   */
  async getMetadata<T = unknown>(key: string): Promise<T | null> {
    try {
      const metadata = await this.executeOperation<MetadataStore | undefined>(
        DB_CONFIG.stores.metadata,
        'readonly',
        (store) => store.get(key)
      );

      return metadata ? (metadata.value as T) : null;
    } catch (error) {
      const offlineError = createOfflineError(
        OfflineErrorCode.DATABASE_ERROR,
        'Failed to get metadata',
        error
      );
      ErrorLogger.log(offlineError, 'IndexedDBManager.getMetadata');
      throw offlineError;
    }
  }

  /**
   * 删除元数据
   */
  async deleteMetadata(key: string): Promise<void> {
    try {
      await this.executeOperation(
        DB_CONFIG.stores.metadata,
        'readwrite',
        (store) => store.delete(key)
      );
    } catch (error) {
      const offlineError = createOfflineError(
        OfflineErrorCode.DATABASE_ERROR,
        'Failed to delete metadata',
        error
      );
      ErrorLogger.log(offlineError, 'IndexedDBManager.deleteMetadata');
      throw offlineError;
    }
  }

  // ==================== Utility Methods ====================

  /**
   * 获取存储使用情况
   */
  async getStorageEstimate(): Promise<{
    usage: number;
    quota: number;
    usagePercentage: number;
  }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage || 0;
      const quota = estimate.quota || 0;
      const usagePercentage = quota > 0 ? (usage / quota) * 100 : 0;

      return { usage, quota, usagePercentage };
    }

    return { usage: 0, quota: 0, usagePercentage: 0 };
  }

  /**
   * 获取笔记数量
   */
  async getNotesCount(userId?: string): Promise<number> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.getTransaction(DB_CONFIG.stores.notes);
        const store = transaction.objectStore(DB_CONFIG.stores.notes);

        let request: IDBRequest<number>;

        if (userId) {
          const index = store.index('userId');
          request = index.count(IDBKeyRange.only(userId));
        } else {
          request = store.count();
        }

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => {
          const error = createOfflineError(
            OfflineErrorCode.DATABASE_ERROR,
            'Failed to get notes count',
            request.error
          );
          ErrorLogger.log(error, 'IndexedDBManager.getNotesCount');
          reject(error);
        };
      } catch (error) {
        const offlineError = createOfflineError(
          OfflineErrorCode.DATABASE_ERROR,
          'Failed to get notes count',
          error
        );
        ErrorLogger.log(offlineError, 'IndexedDBManager.getNotesCount');
        reject(offlineError);
      }
    });
  }

  /**
   * 获取待同步操作数量
   */
  async getPendingSyncCount(): Promise<number> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.getTransaction(DB_CONFIG.stores.syncQueue);
        const store = transaction.objectStore(DB_CONFIG.stores.syncQueue);
        const index = store.index('status');
        const request = index.count(IDBKeyRange.only('pending'));

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => {
          const error = createOfflineError(
            OfflineErrorCode.DATABASE_ERROR,
            'Failed to get pending sync count',
            request.error
          );
          ErrorLogger.log(error, 'IndexedDBManager.getPendingSyncCount');
          reject(error);
        };
      } catch (error) {
        const offlineError = createOfflineError(
          OfflineErrorCode.DATABASE_ERROR,
          'Failed to get pending sync count',
          error
        );
        ErrorLogger.log(offlineError, 'IndexedDBManager.getPendingSyncCount');
        reject(offlineError);
      }
    });
  }
}

// 导出单例实例
export const indexedDBManager = IndexedDBManager.getInstance();
