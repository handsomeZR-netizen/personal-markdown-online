'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { syncQueueManager } from '@/lib/offline/sync-queue-manager';

/**
 * 页面卸载警告组件
 * 当用户尝试关闭页面且有未同步数据时显示警告
 */
export function UnloadWarning() {
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.user?.id) return;

    const handleBeforeUnload = async (e: BeforeUnloadEvent) => {
      try {
        // 检查是否有未同步的数据
        const queue = await syncQueueManager.getQueue();
        const pendingOperations = queue.filter(
          op => op.status === 'pending' || op.status === 'failed'
        );

        if (pendingOperations.length > 0) {
          // 显示浏览器默认的确认对话框
          const message = `您有 ${pendingOperations.length} 个操作尚未同步到服务器，关闭页面可能导致数据丢失。`;
          e.preventDefault();
          e.returnValue = message;
          return message;
        }
      } catch (error) {
        console.error('检查未同步数据失败:', error);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [session?.user?.id]);

  return null;
}
