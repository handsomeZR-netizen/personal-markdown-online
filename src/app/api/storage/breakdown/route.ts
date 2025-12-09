/**
 * Storage Breakdown API Route
 * GET /api/storage/breakdown - Get storage breakdown by type
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

    // Get storage breakdown
    const breakdown = await storageQuotaManager.getStorageBreakdown(userId);

    return NextResponse.json(breakdown);
  } catch (error) {
    console.error('Error getting storage breakdown:', error);
    return NextResponse.json(
      { error: 'Failed to get storage breakdown' },
      { status: 500 }
    );
  }
}
