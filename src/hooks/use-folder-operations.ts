'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { moveFolder, moveNoteToFolder } from '@/lib/actions/folders';

/**
 * Hook for folder operations
 * Handles moving folders and notes with proper error handling
 * Validates: Requirements 4.4, 4.5
 */

export function useFolderOperations() {
  const [isMoving, setIsMoving] = useState(false);

  const handleMove = useCallback(
    async (itemId: string, itemType: 'folder' | 'note', targetFolderId: string | null) => {
      setIsMoving(true);

      try {
        let result;

        if (itemType === 'folder') {
          result = await moveFolder(itemId, targetFolderId);
        } else {
          result = await moveNoteToFolder(itemId, targetFolderId);
        }

        if (result.success) {
          toast.success(
            itemType === 'folder' ? '文件夹移动成功' : '笔记移动成功'
          );
          return true;
        } else {
          toast.error(result.error || '移动失败');
          return false;
        }
      } catch (error) {
        console.error('Move error:', error);
        toast.error('移动失败，请重试');
        return false;
      } finally {
        setIsMoving(false);
      }
    },
    []
  );

  return {
    handleMove,
    isMoving,
  };
}
