'use client';

/**
 * Storage Settings Client Component
 * Client-side component for storage management
 */

import { useState } from 'react';
import { StorageManager } from '@/components/storage/storage-manager';
import { StorageCleanupDialog } from '@/components/storage/storage-cleanup-dialog';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

export function StorageSettingsClient() {
  const [cleanupDialogOpen, setCleanupDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCleanupComplete = () => {
    // Refresh storage data
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="container max-w-4xl py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">存储管理</h1>
          <p className="text-muted-foreground mt-2">
            查看和管理您的存储空间使用情况
          </p>
        </div>

        {/* Storage Manager */}
        <div key={refreshKey}>
          <StorageManager />
        </div>

        {/* Cleanup Button */}
        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={() => setCleanupDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            清理存储空间
          </Button>
        </div>

        {/* Cleanup Dialog */}
        <StorageCleanupDialog
          open={cleanupDialogOpen}
          onOpenChange={setCleanupDialogOpen}
          onCleanupComplete={handleCleanupComplete}
        />
      </div>
    </div>
  );
}
