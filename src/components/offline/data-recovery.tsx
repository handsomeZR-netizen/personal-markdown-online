'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { indexedDBManager } from '@/lib/offline/indexeddb-manager';
import { syncQueueManager } from '@/lib/offline/sync-queue-manager';
import { toast } from 'sonner';

export function DataRecovery() {
  const { data: session } = useSession();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!session?.user?.id || isInitialized) return;

    const initializeOfflineData = async () => {
      try {
        // 初始化 IndexedDB
        await indexedDBManager.initialize();

        // 恢复同步队列
        const queue = await syncQueueManager.getQueue();
        const pendingCount = queue.filter(op => op.status === 'pending' || op.status === 'failed').length;

        if (pendingCount > 0) {
          toast.info(`发现 ${pendingCount} 个待同步操作`, {
            description: '网络恢复后将自动同步',
            duration: 5000,
          });
        }

        // 恢复笔记数据
        const localNotes = await indexedDBManager.getAllNotes();
        console.log(`已恢复 ${localNotes.length} 条本地笔记`);

        setIsInitialized(true);
      } catch (error) {
        console.error('数据恢复失败:', error);
        toast.error('离线数据恢复失败', {
          description: '部分功能可能无法正常使用',
        });
      }
    };

    initializeOfflineData();
  }, [session?.user?.id, isInitialized]);

  return null;
}
