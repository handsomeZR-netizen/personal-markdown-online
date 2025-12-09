/**
 * Storage Quota API Route
 * GET /api/storage/quota - Get storage usage for current user
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { storageQuotaManager } from '@/lib/storage/storage-quota-manager';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Get storage usage
    const usage = await storageQuotaManager.getStorageUsage(userId);

    return NextResponse.json(usage);
  } catch (error) {
    console.error('Error getting storage quota:', error);
    return NextResponse.json(
      { error: 'Failed to get storage quota' },
      { status: 500 }
    );
  }
}
