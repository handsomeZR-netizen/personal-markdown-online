'use client';

/**
 * Network Status Indicator Component
 * 
 * Displays a banner showing online/offline status with auto-hide functionality.
 * Implements Requirements 4.3, 4.4 from the offline-and-ai-enhancements spec.
 */

import React, { useEffect, useState } from 'react';
import { useNetworkStatus } from '@/contexts/network-status-context';
import { Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export function NetworkStatusIndicator() {
  const { isOnline } = useNetworkStatus();
  const [visible, setVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    // Show indicator when status changes
    if (!isOnline) {
      // Offline: show immediately and keep visible
      setShouldRender(true);
      setVisible(true);
    } else {
      // Online: show for 3 seconds then hide
      setShouldRender(true);
      setVisible(true);
      
      const hideTimer = setTimeout(() => {
        setVisible(false);
      }, 3000);

      // Remove from DOM after animation completes
      const removeTimer = setTimeout(() => {
        setShouldRender(false);
      }, 3500); // 3s display + 0.5s animation

      return () => {
        clearTimeout(hideTimer);
        clearTimeout(removeTimer);
      };
    }
  }, [isOnline]);

  if (!shouldRender) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-[60] transition-all duration-500 ease-in-out',
        visible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      )}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div
        className={cn(
          'flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium shadow-md',
          isOnline
            ? 'bg-green-500 text-white'
            : 'bg-amber-500 text-white'
        )}
      >
        {isOnline ? (
          <>
            <Wifi className="h-4 w-4" aria-hidden="true" />
            <span>已连接到网络</span>
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4 animate-pulse" aria-hidden="true" />
            <span>当前处于离线状态</span>
          </>
        )}
      </div>
    </div>
  );
}
