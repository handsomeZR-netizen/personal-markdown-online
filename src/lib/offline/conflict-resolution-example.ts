/**
 * 冲突解决功能使用示例
 * 
 * 此文件展示如何在应用中集成和使用冲突检测与解决功能
 */

import { SyncEngine } from './sync-engine';
import { ConflictDialog } from '@/components/offline/conflict-dialog';
import { LocalNote, ConflictStrategy } from '@/types/offline';
import { RemoteNote } from './conflict-resolver';
import { SyncOperation } from '@/types/offline';

/**
 * 示例 1: 在 React 组件中使用冲突对话框
 * 
 * 这个示例展示如何在网络状态 Context 或同步管理组件中
 * 集成冲突检测和解决功能
 */

/*
'use client';

import { useState, useEffect } from 'react';
import { SyncEngine } from '@/lib/offline/sync-engine';
import { ConflictDialog } from '@/components/offline/conflict-dialog';
import { LocalNote, ConflictStrategy } from '@/types/offline';
import { RemoteNote } from '@/lib/offline/conflict-resolver';

export function SyncManager() {
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);
  const [conflictData, setConflictData] = useState<{
    local: LocalNote;
    remote: RemoteNote;
    operation: SyncOperation;
  } | null>(null);
  const [resolveConflict, setResolveConflict] = useState<
    ((strategy: ConflictStrategy) => void) | null
  >(null);

  useEffect(() => {
    const syncEngine = SyncEngine.getInstance();

    // 设置冲突回调
    syncEngine.onConflict(async (local, remote, operation) => {
      return new Promise<ConflictStrategy | null>((resolve) => {
        // 保存冲突数据
        setConflictData({ local, remote, operation });
        
        // 保存解决函数
        setResolveConflict(() => (strategy: ConflictStrategy) => {
          resolve(strategy);
          setConflictDialogOpen(false);
          setConflictData(null);
        });

        // 显示冲突对话框
        setConflictDialogOpen(true);
      });
    });
  }, []);

  const handleResolve = (strategy: ConflictStrategy) => {
    if (resolveConflict) {
      resolveConflict(strategy);
    }
  };

  const handleCancel = () => {
    setConflictDialogOpen(false);
    setConflictData(null);
    if (resolveConflict) {
      resolveConflict(null);
    }
  };

  return (
    <>
      {conflictData && (
        <ConflictDialog
          open={conflictDialogOpen}
          local={conflictData.local}
          remote={conflictData.remote}
          onResolve={handleResolve}
          onCancel={handleCancel}
        />
      )}
    </>
  );
}
*/

/**
 * 示例 2: 手动触发同步并处理冲突
 * 
 * 这个示例展示如何在用户点击"同步"按钮时
 * 手动触发同步并处理可能出现的冲突
 */

/*
async function handleManualSync() {
  const syncEngine = SyncEngine.getInstance();

  try {
    // 开始同步
    const result = await syncEngine.startSync();

    if (result.success > 0) {
      console.log(`成功同步 ${result.success} 个操作`);
    }

    if (result.failed > 0) {
      console.error(`同步失败 ${result.failed} 个操作`, result.errors);
    }
  } catch (error) {
    console.error('同步失败:', error);
  }
}
*/

/**
 * 示例 3: 监听同步进度
 * 
 * 这个示例展示如何监听同步进度并显示进度条
 */

/*
useEffect(() => {
  const syncEngine = SyncEngine.getInstance();

  const unsubscribe = syncEngine.onProgress((progress) => {
    console.log(`同步进度: ${progress.percentage.toFixed(0)}%`);
    console.log(`已完成: ${progress.current}/${progress.total}`);
    
    if (progress.currentOperation) {
      console.log(`正在同步: ${progress.currentOperation.type} ${progress.currentOperation.noteId}`);
    }
  });

  return () => {
    unsubscribe();
  };
}, []);
*/

/**
 * 示例 4: 自动同步（网络恢复时）
 * 
 * 这个示例展示如何在网络恢复时自动触发同步
 */

/*
useEffect(() => {
  const handleOnline = async () => {
    console.log('网络已恢复，开始同步...');
    
    // 延迟 5 秒后开始同步，避免网络不稳定
    setTimeout(async () => {
      const syncEngine = SyncEngine.getInstance();
      
      try {
        const result = await syncEngine.startSync();
        console.log('自动同步完成:', result);
      } catch (error) {
        console.error('自动同步失败:', error);
      }
    }, 5000);
  };

  window.addEventListener('online', handleOnline);

  return () => {
    window.removeEventListener('online', handleOnline);
  };
}, []);
*/

/**
 * 示例 5: 使用 ConflictResolver 手动检测和解决冲突
 * 
 * 这个示例展示如何在不使用 SyncEngine 的情况下
 * 手动使用 ConflictResolver 检测和解决冲突
 */

/*
import { ConflictResolver } from '@/lib/offline/conflict-resolver';

async function manualConflictResolution(
  local: LocalNote,
  remote: RemoteNote
) {
  const resolver = ConflictResolver.getInstance();

  // 检测冲突
  const hasConflict = resolver.detectConflict(local, remote);

  if (hasConflict) {
    console.log('检测到冲突！');

    // 获取冲突详情
    const conflictInfo = resolver.getConflictInfo(local, remote);
    console.log('冲突字段:', conflictInfo.conflictFields);

    // 获取差异
    const differences = resolver.getDifferences(local, remote);
    console.log('差异:', differences);

    // 解决冲突 - 使用本地版本
    const resolved = await resolver.resolveConflict(
      local,
      remote,
      'use-local'
    );

    console.log('冲突已解决:', resolved);
    return resolved;
  }

  return local;
}
*/

/**
 * 冲突解决策略说明
 * 
 * 1. use-local (保留本地版本)
 *    - 保留本地所有更改
 *    - 覆盖服务器版本
 *    - 适用于：确定本地版本是最新的，或者本地更改更重要
 * 
 * 2. use-remote (使用服务器版本)
 *    - 放弃本地更改
 *    - 使用服务器数据
 *    - 适用于：服务器版本更新，或者本地更改不重要
 * 
 * 3. manual-merge (手动合并)
 *    - 用户手动选择要保留的内容
 *    - 可以混合本地和服务器的更改
 *    - 适用于：两个版本都有重要更改，需要仔细合并
 */

/**
 * 冲突检测逻辑说明
 * 
 * 冲突检测基于 updatedAt 时间戳：
 * - 如果本地 updatedAt > 服务器 updatedAt，说明存在冲突
 * - 这意味着本地有未同步的更改，而服务器上也有新的更改
 * - 需要用户决定如何解决这个冲突
 * 
 * 不会产生冲突的情况：
 * - 本地 updatedAt <= 服务器 updatedAt：服务器版本更新，直接使用服务器版本
 * - 创建操作：新笔记不会有冲突
 * - 删除操作：删除操作不检查冲突
 */

export {};
