/**
 * 离线功能相关类型定义
 */

/**
 * 同步状态
 */
export type SyncStatus = 'synced' | 'pending' | 'syncing' | 'failed';

/**
 * 同步操作类型
 */
export type SyncOperationType = 'create' | 'update' | 'delete';

/**
 * 冲突解决策略
 */
export type ConflictStrategy = 'use-local' | 'use-remote' | 'manual-merge';

/**
 * 本地笔记数据结构
 */
export interface LocalNote {
  id: string;
  title: string;
  content: string;
  summary?: string;
  tags: string[];
  categoryId?: string;
  userId: string;
  createdAt: number;
  updatedAt: number;
  lastAccessedAt: number;
  syncStatus: SyncStatus;
  tempId?: string; // 临时 ID，用于离线创建的笔记
}

/**
 * 同步操作
 */
export interface SyncOperation {
  id: string;
  type: SyncOperationType;
  noteId: string;
  tempId?: string;
  data: Partial<LocalNote>;
  timestamp: number;
  retryCount: number;
  status: SyncStatus;
  error?: string;
}

/**
 * 同步结果
 */
export interface SyncResult {
  total: number;
  success: number;
  failed: number;
  errors: Array<{ operationId: string; error: string }>;
}

/**
 * 同步进度
 */
export interface SyncProgress {
  current: number;
  total: number;
  percentage: number;
  currentOperation?: SyncOperation;
}

/**
 * 草稿内容
 */
export interface DraftContent {
  title: string;
  content: string;
  tags: string[];
  categoryId?: string;
  savedAt: number;
}

/**
 * 冲突解决结果
 */
export interface ConflictResolution {
  strategy: ConflictStrategy;
  mergedData?: Partial<LocalNote>;
}

/**
 * 存储使用情况
 */
export interface StorageEstimate {
  usage?: number;
  quota?: number;
  usagePercentage?: number;
}

/**
 * 同步状态信息
 */
export interface SyncStatusInfo {
  pendingOperations: number;
  lastSyncTime?: number;
  syncInProgress: boolean;
}

/**
 * 保存结果
 */
export interface SaveResult {
  success: boolean;
  noteId: string;
  isOffline: boolean;
  needsSync: boolean;
}

/**
 * IndexedDB 数据库配置
 */
export interface IndexedDBConfig {
  name: string;
  version: number;
  stores: {
    notes: string;
    syncQueue: string;
    metadata: string;
  };
}

/**
 * 元数据存储
 */
export interface MetadataStore {
  key: string;
  value: unknown;
  updatedAt: number;
}

/**
 * 离线功能设置
 */
export interface OfflineSettings {
  offlineModeEnabled: boolean;
  autoSyncEnabled: boolean;
  conflictResolutionStrategy: ConflictStrategy;
  draftAutoSaveInterval: number; // 毫秒
}

/**
 * 默认离线设置
 */
export const DEFAULT_OFFLINE_SETTINGS: OfflineSettings = {
  offlineModeEnabled: true,
  autoSyncEnabled: true,
  conflictResolutionStrategy: 'manual-merge',
  draftAutoSaveInterval: 3000, // 3 秒
};
