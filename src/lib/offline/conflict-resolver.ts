/**
 * 冲突解决器
 * 负责检测和解决本地数据与服务器数据的冲突
 */

import {
  LocalNote,
  ConflictStrategy,
  ConflictResolution,
} from '@/types/offline';
import { createOfflineError, OfflineErrorCode, ErrorLogger } from './errors';

/**
 * 服务器笔记数据结构（从 API 返回）
 */
export interface RemoteNote {
  id: string;
  title: string;
  content: string;
  summary?: string | null;
  updatedAt: Date | string;
  createdAt?: Date | string;
  userId?: string;
  categoryId?: string | null;
  tags?: Array<{ id: string; name: string }>;
}

/**
 * 冲突信息
 */
export interface ConflictInfo {
  local: LocalNote;
  remote: RemoteNote;
  conflictFields: string[];
}

/**
 * 冲突解决器类
 */
export class ConflictResolver {
  private static instance: ConflictResolver | null = null;

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): ConflictResolver {
    if (!ConflictResolver.instance) {
      ConflictResolver.instance = new ConflictResolver();
    }
    return ConflictResolver.instance;
  }

  /**
   * 检测冲突
   * 通过比较 updatedAt 时间戳来判断是否存在冲突
   * 
   * @param local 本地笔记
   * @param remote 服务器笔记
   * @returns 是否存在冲突
   */
  detectConflict(local: LocalNote, remote: RemoteNote): boolean {
    try {
      // 将远程时间戳转换为数字
      const remoteTimestamp = this.getTimestamp(remote.updatedAt);
      const localTimestamp = local.updatedAt;

      // 如果本地更新时间晚于服务器更新时间，说明存在冲突
      // 这意味着本地有未同步的更改，而服务器上也有新的更改
      return localTimestamp > remoteTimestamp;
    } catch (error) {
      const offlineError = createOfflineError(
        OfflineErrorCode.CONFLICT_DETECTED,
        'Failed to detect conflict',
        error
      );
      ErrorLogger.log(offlineError, 'ConflictResolver.detectConflict');
      throw offlineError;
    }
  }

  /**
   * 获取冲突详细信息
   * 
   * @param local 本地笔记
   * @param remote 服务器笔记
   * @returns 冲突信息
   */
  getConflictInfo(local: LocalNote, remote: RemoteNote): ConflictInfo {
    const conflictFields: string[] = [];

    // 比较各个字段
    if (local.title !== remote.title) {
      conflictFields.push('title');
    }
    if (local.content !== remote.content) {
      conflictFields.push('content');
    }
    if (local.summary !== remote.summary) {
      conflictFields.push('summary');
    }
    if (local.categoryId !== remote.categoryId) {
      conflictFields.push('categoryId');
    }

    // 比较标签（简化比较）
    const localTags = JSON.stringify(local.tags?.sort() || []);
    const remoteTags = JSON.stringify(
      remote.tags?.map((t) => t.id).sort() || []
    );
    if (localTags !== remoteTags) {
      conflictFields.push('tags');
    }

    return {
      local,
      remote,
      conflictFields,
    };
  }

  /**
   * 解决冲突
   * 
   * @param local 本地笔记
   * @param remote 服务器笔记
   * @param strategy 冲突解决策略
   * @returns 解决后的笔记数据
   */
  async resolveConflict(
    local: LocalNote,
    remote: RemoteNote,
    strategy: ConflictStrategy,
    mergedData?: Partial<LocalNote>
  ): Promise<LocalNote> {
    try {
      switch (strategy) {
        case 'use-local':
          return this.useLocalVersion(local);

        case 'use-remote':
          return this.useRemoteVersion(local, remote);

        case 'manual-merge':
          if (!mergedData) {
            throw createOfflineError(
              OfflineErrorCode.CONFLICT_DETECTED,
              'Manual merge requires merged data'
            );
          }
          return this.manualMerge(local, remote, mergedData);

        default:
          throw createOfflineError(
            OfflineErrorCode.CONFLICT_DETECTED,
            `Unknown conflict strategy: ${strategy}`
          );
      }
    } catch (error) {
      const offlineError = createOfflineError(
        OfflineErrorCode.CONFLICT_DETECTED,
        'Failed to resolve conflict',
        error
      );
      ErrorLogger.log(offlineError, 'ConflictResolver.resolveConflict');
      throw offlineError;
    }
  }

  /**
   * 使用本地版本
   * 保留本地所有更改，覆盖服务器版本
   */
  private useLocalVersion(local: LocalNote): LocalNote {
    return {
      ...local,
      syncStatus: 'pending', // 标记为待同步
      updatedAt: Date.now(), // 更新时间戳
    };
  }

  /**
   * 使用服务器版本
   * 放弃本地更改，使用服务器数据
   */
  private useRemoteVersion(local: LocalNote, remote: RemoteNote): LocalNote {
    const remoteTimestamp = this.getTimestamp(remote.updatedAt);

    return {
      id: remote.id,
      title: remote.title,
      content: remote.content,
      summary: remote.summary || undefined,
      tags: remote.tags?.map((t) => t.id) || [],
      categoryId: remote.categoryId || undefined,
      userId: local.userId, // 保留本地用户 ID
      createdAt: local.createdAt, // 保留本地创建时间
      updatedAt: remoteTimestamp,
      lastAccessedAt: Date.now(),
      syncStatus: 'synced', // 标记为已同步
    };
  }

  /**
   * 手动合并
   * 使用用户提供的合并数据
   */
  private manualMerge(
    local: LocalNote,
    remote: RemoteNote,
    mergedData: Partial<LocalNote>
  ): LocalNote {
    const remoteTimestamp = this.getTimestamp(remote.updatedAt);

    return {
      ...local,
      ...mergedData,
      id: remote.id, // 使用服务器 ID
      updatedAt: Math.max(local.updatedAt, remoteTimestamp), // 使用较新的时间戳
      lastAccessedAt: Date.now(),
      syncStatus: 'pending', // 标记为待同步，因为有新的合并更改
    };
  }

  /**
   * 将日期转换为时间戳
   */
  private getTimestamp(date: Date | string | number): number {
    if (typeof date === 'number') {
      return date;
    }
    if (typeof date === 'string') {
      return new Date(date).getTime();
    }
    if (date instanceof Date) {
      return date.getTime();
    }
    throw new Error('Invalid date format');
  }

  /**
   * 比较两个笔记的差异
   * 返回一个对象，包含每个字段的本地值和远程值
   */
  getDifferences(
    local: LocalNote,
    remote: RemoteNote
  ): Record<string, { local: any; remote: any }> {
    const differences: Record<string, { local: any; remote: any }> = {};

    // 比较标题
    if (local.title !== remote.title) {
      differences.title = {
        local: local.title,
        remote: remote.title,
      };
    }

    // 比较内容
    if (local.content !== remote.content) {
      differences.content = {
        local: local.content,
        remote: remote.content,
      };
    }

    // 比较摘要
    if (local.summary !== remote.summary) {
      differences.summary = {
        local: local.summary,
        remote: remote.summary,
      };
    }

    // 比较分类
    if (local.categoryId !== remote.categoryId) {
      differences.categoryId = {
        local: local.categoryId,
        remote: remote.categoryId,
      };
    }

    // 比较标签
    const localTags = JSON.stringify(local.tags?.sort() || []);
    const remoteTags = JSON.stringify(
      remote.tags?.map((t) => t.id).sort() || []
    );
    if (localTags !== remoteTags) {
      differences.tags = {
        local: local.tags,
        remote: remote.tags?.map((t) => t.id),
      };
    }

    // 比较更新时间
    const remoteTimestamp = this.getTimestamp(remote.updatedAt);
    if (local.updatedAt !== remoteTimestamp) {
      differences.updatedAt = {
        local: new Date(local.updatedAt).toISOString(),
        remote: new Date(remoteTimestamp).toISOString(),
      };
    }

    return differences;
  }
}

// 导出单例实例
export const conflictResolver = ConflictResolver.getInstance();
