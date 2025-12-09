/**
 * Storage Check Hook
 * Checks storage quota before allowing uploads
 */

import { useState, useEffect, useCallback } from 'react';

interface StorageCheckResult {
  canUpload: boolean;
  usagePercentage: number;
  isNearQuota: boolean;
  isQuotaExceeded: boolean;
  checkStorage: () => Promise<void>;
}

export function useStorageCheck(): StorageCheckResult {
  const [usagePercentage, setUsagePercentage] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const checkStorage = useCallback(async () => {
    try {
      const response = await fetch('/api/storage/quota');
      if (response.ok) {
        const data = await response.json();
        setUsagePercentage(data.usagePercentage);
      }
    } catch (error) {
      console.error('Error checking storage:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkStorage();
  }, [checkStorage]);

  const isQuotaExceeded = usagePercentage >= 100;
  const isNearQuota = usagePercentage >= 80;
  const canUpload = !isQuotaExceeded;

  return {
    canUpload,
    usagePercentage,
    isNearQuota,
    isQuotaExceeded,
    checkStorage,
  };
}
