'use client';

/**
 * Network Status Context
 * 
 * Provides network connectivity status throughout the application.
 * Implements Requirements 4.1, 4.2, 5.1 from the offline-and-ai-enhancements spec.
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { getNetworkStatusManager } from '@/lib/offline/network-status-manager';
import { SyncEngine } from '@/lib/offline/sync-engine';
import { OfflineSettingsManager } from '@/lib/offline/settings-manager';
import { toast } from 'sonner';

interface NetworkStatusContextValue {
  isOnline: boolean;
  checkConnection: () => Promise<boolean>;
  lastOnlineTime: number | null;
  lastOfflineTime: number | null;
  isSyncing: boolean;
}

const NetworkStatusContext = createContext<NetworkStatusContextValue | undefined>(undefined);

interface NetworkStatusProviderProps {
  children: React.ReactNode;
}

export function NetworkStatusProvider({ children }: NetworkStatusProviderProps) {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [lastOnlineTime, setLastOnlineTime] = useState<number | null>(null);
  const [lastOfflineTime, setLastOfflineTime] = useState<number | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousOnlineStatusRef = useRef<boolean>(true);

  useEffect(() => {
    const manager = getNetworkStatusManager();
    const syncEngine = SyncEngine.getInstance();
    
    // Initialize with current status
    const initialStatus = manager.isOnline();
    setIsOnline(initialStatus);
    previousOnlineStatusRef.current = initialStatus;
    
    // Set up listener for status changes
    const unsubscribe = manager.onStatusChange((online) => {
      const wasOffline = !previousOnlineStatusRef.current;
      setIsOnline(online);
      
      // Track status change times
      if (online) {
        setLastOnlineTime(Date.now());
        
        // Trigger sync when network recovers (from offline to online)
        // Requirement 5.1: Delay 5 seconds to avoid network instability
        if (wasOffline) {
          // Clear any existing timeout
          if (syncTimeoutRef.current) {
            clearTimeout(syncTimeoutRef.current);
          }
          
          // Check if auto-sync is enabled
          const settings = OfflineSettingsManager.getSettings();
          if (!settings.autoSyncEnabled || !settings.offlineModeEnabled) {
            return;
          }
          
          // Schedule sync after 5 seconds
          syncTimeoutRef.current = setTimeout(async () => {
            try {
              setIsSyncing(true);
              toast.info('正在同步...', {
                id: 'sync-in-progress',
              });
              
              const result = await syncEngine.startSync();
              
              if (result.total === 0) {
                toast.dismiss('sync-in-progress');
              } else if (result.failed === 0) {
                toast.success(`同步完成！已同步 ${result.success} 项`, {
                  id: 'sync-in-progress',
                });
              } else {
                toast.warning(
                  `同步完成：成功 ${result.success} 项，失败 ${result.failed} 项`,
                  {
                    id: 'sync-in-progress',
                  }
                );
              }
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : '未知错误';
              toast.error(`同步失败：${errorMessage}`, {
                id: 'sync-in-progress',
              });
            } finally {
              setIsSyncing(false);
            }
          }, 5000);
        }
      } else {
        setLastOfflineTime(Date.now());
        
        // Clear sync timeout if going offline
        if (syncTimeoutRef.current) {
          clearTimeout(syncTimeoutRef.current);
          syncTimeoutRef.current = null;
        }
      }
      
      // Update previous status
      previousOnlineStatusRef.current = online;
    });

    // Cleanup on unmount
    return () => {
      unsubscribe();
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  const checkConnection = useCallback(async () => {
    const manager = getNetworkStatusManager();
    const online = await manager.checkConnection();
    setIsOnline(online);
    return online;
  }, []);

  const value: NetworkStatusContextValue = {
    isOnline,
    checkConnection,
    lastOnlineTime,
    lastOfflineTime,
    isSyncing,
  };

  return (
    <NetworkStatusContext.Provider value={value}>
      {children}
    </NetworkStatusContext.Provider>
  );
}

/**
 * Hook to access network status
 * @throws Error if used outside NetworkStatusProvider
 */
export function useNetworkStatus(): NetworkStatusContextValue {
  const context = useContext(NetworkStatusContext);
  
  if (context === undefined) {
    throw new Error('useNetworkStatus must be used within a NetworkStatusProvider');
  }
  
  return context;
}
