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

  // Initialize provider
  useEffect(() => {
    if (!enabled || !noteId || !userId) {
      return;
    }

    let mounted = true;

    async function initProvider() {
      try {
        // Get JWT token from session
        const token = await getAuthToken();
        
        if (!mounted) return;

        const newProvider = new YjsProvider({
          noteId,
          userId,
          userName,
          userColor,
          token,
          websocketUrl: process.env.NEXT_PUBLIC_COLLAB_SERVER_URL || 'ws://localhost:1234',
        });

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

        // Cleanup function
        return () => {
          mounted = false;
          unsubscribeStatus();
          unsubscribeSynced();
          unsubscribeAwareness();
          newProvider.destroy();
        };
      } catch (error) {
        console.error('Failed to initialize collaboration:', error);
        if (onError) {
          onError(error as Error);
        }
      }
    }

    const cleanup = initProvider();

    return () => {
      cleanup.then(fn => fn?.());
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

/**
 * Get authentication token for WebSocket connection
 */
async function getAuthToken(): Promise<string> {
  try {
    // Fetch session from NextAuth
    const response = await fetch('/api/auth/session');
    const session = await response.json();
    
    if (!session?.user) {
      throw new Error('No active session');
    }

    // In a real implementation, you would generate a proper JWT token
    // For now, we'll create a simple token with user info
    const tokenPayload = {
      sub: session.user.id,
      userId: session.user.id,
      name: session.user.name || '',
      email: session.user.email || '',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour
    };

    // Simple base64 encoding (in production, use proper JWT signing)
    const token = `header.${Buffer.from(JSON.stringify(tokenPayload)).toString('base64')}.signature`;
    
    return token;
  } catch (error) {
    console.error('Failed to get auth token:', error);
    throw error;
  }
}
