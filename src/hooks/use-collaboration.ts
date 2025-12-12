import { useEffect, useState, useRef } from 'react';
import { YjsProvider, ConnectionStatus } from '@/lib/collaboration/yjs-provider';
import * as Y from 'yjs';
import { Awareness } from 'y-protocols/awareness';

/**
 * Configuration for useCollaboration hook
 */
export interface UseCollaborationConfig {
  noteId: string;
  userId: string;
  userName: string;
  userColor: string;
  enabled?: boolean;
  onError?: (error: Error) => void;
}

/**
 * Return type for useCollaboration hook
 */
export interface UseCollaborationReturn {
  ydoc: Y.Doc | null;
  awareness: Awareness | null;
  provider: YjsProvider | null;
  status: ConnectionStatus;
  isSynced: boolean;
  onlineUsers: Array<{
    clientId: number;
    user: {
      id: string;
      name: string;
      color: string;
    };
    cursor: { anchor: number; head: number } | null;
  }>;
  updateCursor: (position: { anchor: number; head: number } | null) => void;
  isReady: boolean;
}

/**
 * React hook for Y.js collaboration
 * Manages WebSocket connection and document synchronization
 */
export function useCollaboration(config: UseCollaborationConfig): UseCollaborationReturn {
  const {
    noteId,
    userId,
    userName,
    userColor,
    enabled = true,
    onError,
  } = config;

  const [provider, setProvider] = useState<YjsProvider | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [isSynced, setIsSynced] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Array<any>>([]);
  const [isReady, setIsReady] = useState(false);
  
  const providerRef = useRef<YjsProvider | null>(null);

  // Store cleanup functions in a ref to avoid async cleanup issues
  const cleanupFnsRef = useRef<(() => void)[]>([]);

  // Initialize provider
  useEffect(() => {
    if (!enabled || !noteId || !userId) {
      return;
    }

    let mounted = true;
    cleanupFnsRef.current = [];

    async function initProvider() {
      try {
        const token = await fetchCollabToken();
        
        if (!mounted) return;

        const newProvider = new YjsProvider({
          noteId,
          userId,
          userName,
          userColor,
          token,
          websocketUrl: process.env.NEXT_PUBLIC_COLLAB_SERVER_URL || 'ws://localhost:1234',
        });

        if (!mounted) {
          // Component unmounted during async operation
          newProvider.destroy();
          return;
        }

        providerRef.current = newProvider;
        setProvider(newProvider);
        setIsReady(true);

        // Listen to status changes
        const unsubscribeStatus = newProvider.onStatusChange((newStatus) => {
          if (mounted) {
            setStatus(newStatus);
          }
        });

        // Listen to sync events
        const unsubscribeSynced = newProvider.onSynced(() => {
          if (mounted) {
            setIsSynced(true);
          }
        });

        // Listen to awareness changes
        const unsubscribeAwareness = newProvider.onAwarenessChange(() => {
          if (mounted) {
            setOnlineUsers(newProvider.getOnlineUsers());
          }
        });

        // Store cleanup functions
        cleanupFnsRef.current = [
          unsubscribeStatus,
          unsubscribeSynced,
          unsubscribeAwareness,
          () => newProvider.destroy(),
        ];
      } catch (error) {
        console.error('Failed to initialize collaboration:', error);
        if (mounted && onError) {
          onError(error as Error);
        }
      }
    }

    initProvider();

    // Synchronous cleanup function
    return () => {
      mounted = false;
      // Execute all cleanup functions synchronously
      cleanupFnsRef.current.forEach((fn) => {
        try {
          fn();
        } catch (e) {
          console.error('Cleanup error:', e);
        }
      });
      cleanupFnsRef.current = [];
      providerRef.current = null;
      setProvider(null);
      setIsReady(false);
      setIsSynced(false);
      setOnlineUsers([]);
      setStatus('disconnected');
    };
  }, [noteId, userId, userName, userColor, enabled, onError]);

  // Update cursor position
  const updateCursor = (position: { anchor: number; head: number } | null) => {
    if (providerRef.current) {
      providerRef.current.updateCursor(position);
    }
  };

  return {
    ydoc: provider?.getYDoc() ?? null,
    awareness: provider?.getAwareness() ?? null,
    provider,
    status,
    isSynced,
    onlineUsers,
    updateCursor,
    isReady,
  };
}

async function fetchCollabToken(): Promise<string> {
  try {
    const response = await fetch('/api/collab/token', { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Failed to fetch collab token: ${response.status}`);
    }
    const data = await response.json();
    if (!data?.token) {
      throw new Error('Invalid token response');
    }
    return data.token as string;
  } catch (error) {
    console.error('Failed to get auth token:', error);
    throw error;
  }
}
