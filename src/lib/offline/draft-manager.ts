/**
 * 草稿管理器
 * 负责管理自动保存的草稿数据
 */

import { DraftContent } from '@/types/offline';

const DRAFT_PREFIX = 'draft_';
const DRAFT_EXPIRY_DAYS = 7;

/**
 * 草稿管理器类
 */
export class DraftManager {
  /**
   * 保存草稿到 LocalStorage
   * @param noteId 笔记 ID（可以是 'new' 表示新笔记）
   * @param content 草稿内容
   */
  saveDraft(noteId: string, content: DraftContent): void {
    if (typeof window === 'undefined') return;

    const key = this.getDraftKey(noteId);
    const draftData = {
      ...content,
      savedAt: Date.now(),
    };

    try {
      localStorage.setItem(key, JSON.stringify(draftData));
    } catch (error) {
      console.error('保存草稿失败:', error);
      // 如果存储空间不足，尝试清理过期草稿后重试
      this.cleanupExpiredDrafts(DRAFT_EXPIRY_DAYS);
      try {
        localStorage.setItem(key, JSON.stringify(draftData));
      } catch (retryError) {
        console.error('重试保存草稿失败:', retryError);
      }
    }
  }

  /**
   * 获取草稿
   * @param noteId 笔记 ID
   * @returns 草稿内容，如果不存在或已过期则返回 null
   */
  getDraft(noteId: string): DraftContent | null {
    if (typeof window === 'undefined') return null;

    const key = this.getDraftKey(noteId);
    const draftJson = localStorage.getItem(key);

    if (!draftJson) return null;

    try {
      const draft = JSON.parse(draftJson) as DraftContent;

      // 检查草稿是否过期（7天）
      const expiryTime = DRAFT_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
      if (Date.now() - draft.savedAt > expiryTime) {
        this.deleteDraft(noteId);
        return null;
      }

      return draft;
    } catch (error) {
      console.error('解析草稿失败:', error);
      // 删除损坏的草稿
      this.deleteDraft(noteId);
      return null;
    }
  }

  /**
   * 删除草稿
   * @param noteId 笔记 ID
   */
  deleteDraft(noteId: string): void {
    if (typeof window === 'undefined') return;

    const key = this.getDraftKey(noteId);
    localStorage.removeItem(key);
  }

  /**
   * 检查是否有草稿
   * @param noteId 笔记 ID
   * @returns 是否存在草稿
   */
  hasDraft(noteId: string): boolean {
    return this.getDraft(noteId) !== null;
  }

  /**
   * 清理过期草稿
   * @param daysOld 草稿保留天数，默认 7 天
   * @returns 清理的草稿数量
   */
  cleanupExpiredDrafts(daysOld: number = DRAFT_EXPIRY_DAYS): number {
    if (typeof window === 'undefined') return 0;

    const expiryTime = daysOld * 24 * 60 * 60 * 1000;
    const now = Date.now();
    let cleanedCount = 0;

    try {
      // 遍历所有 localStorage 键
      const keys = Object.keys(localStorage);
      
      for (const key of keys) {
        // 只处理草稿键
        if (!key.startsWith(DRAFT_PREFIX)) continue;

        try {
          const draftJson = localStorage.getItem(key);
          if (!draftJson) continue;

          const draft = JSON.parse(draftJson) as DraftContent;

          // 检查是否过期
          if (now - draft.savedAt > expiryTime) {
            localStorage.removeItem(key);
            cleanedCount++;
          }
        } catch (error) {
          // 如果解析失败，删除损坏的草稿
          localStorage.removeItem(key);
          cleanedCount++;
        }
      }
    } catch (error) {
      console.error('清理过期草稿失败:', error);
    }

    return cleanedCount;
  }

  /**
   * 获取所有草稿
   * @returns 草稿列表，包含 noteId 和内容
   */
  getAllDrafts(): Array<{ noteId: string; content: DraftContent }> {
    if (typeof window === 'undefined') return [];

    const drafts: Array<{ noteId: string; content: DraftContent }> = [];

    try {
      const keys = Object.keys(localStorage);

      for (const key of keys) {
        if (!key.startsWith(DRAFT_PREFIX)) continue;

        const noteId = key.substring(DRAFT_PREFIX.length);
        const draft = this.getDraft(noteId);

        if (draft) {
          drafts.push({ noteId, content: draft });
        }
      }
    } catch (error) {
      console.error('获取所有草稿失败:', error);
    }

    return drafts;
  }

  /**
   * 获取草稿的 LocalStorage 键
   * @param noteId 笔记 ID
   * @returns LocalStorage 键
   */
  private getDraftKey(noteId: string): string {
    return `${DRAFT_PREFIX}${noteId}`;
  }
}

// 导出单例实例
export const draftManager = new DraftManager();
