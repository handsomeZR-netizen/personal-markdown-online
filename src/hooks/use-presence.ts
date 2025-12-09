import { useEffect, useState } from 'react';
import { PresenceManager, PresenceUser } from '@/lib/collaboration/presence-manager';
import { Awareness } from 'y-protocols/awareness';

/**
 * Hook to use PresenceManager with React
 */
export function usePresence(awareness: Awareness | null, userId: string) {
  const [presenceManager, setPresenceManager] = useState<PresenceManager | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);

  useEffect(() => {
    if (!awareness) {
      return;
    }

    const manager = new PresenceManager(awareness, userId);
    setPresenceManager(manager);

    // Subscribe to user changes
    const unsubscribe = manager.onUsersChange((users) => {
      setOnlineUsers(users);
    });

    return () => {
      unsubscribe();
      manager.destroy();
    };
  }, [awareness, userId]);

  return {
    presenceManager,
    onlineUsers,
    onlineUserCount: onlineUsers.length,
    activeEditors: onlineUsers.filter(user => user.cursor !== null),
    viewers: onlineUsers.filter(user => user.cursor === null),
  };
}

/**
 * Hook to track editing status for a specific note
 * This can be used in note lists to show editing indicators
 */
export function useNoteEditingStatus(noteId: string) {
  const [isEditing, setIsEditing] = useState(false);
  const [editors, setEditors] = useState<string[]>([]);

  useEffect(() => {
    // In a real implementation, this would:
    // 1. Subscribe to a global presence service that tracks all notes
    // 2. Filter for users editing this specific note
    // 3. Update the state when users join/leave or start/stop editing
    
    // For now, this is a placeholder
    // You would need a global presence service that tracks all active notes
    
    return () => {
      // Cleanup subscription
    };
  }, [noteId]);

  return {
    isEditing,
    editors,
    editorCount: editors.length,
  };
}

/**
 * Hook to set local user presence information
 */
export function useSetPresence(
  presenceManager: PresenceManager | null,
  userInfo: {
    id: string;
    name: string;
    email?: string;
    avatar?: string;
    color: string;
  }
) {
  useEffect(() => {
    if (!presenceManager) {
      return;
    }

    presenceManager.setLocalUser({
      ...userInfo,
      cursor: null,
    });

    // Update activity periodically
    const interval = setInterval(() => {
      presenceManager.updateActivity();
    }, 10000); // Every 10 seconds

    return () => {
      clearInterval(interval);
    };
  }, [presenceManager, userInfo]);
}
