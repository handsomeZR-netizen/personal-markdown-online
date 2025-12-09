/**
 * Large Items API Route
 * GET /api/storage/large-items - Get large items for cleanup
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type') || 'large'; // 'large' or 'old'
    const daysOld = parseInt(searchParams.get('daysOld') || '90');

    // Get items based on type
    let items;
    if (type === 'old') {
      items = await storageQuotaManager.getOldItems(userId, daysOld, limit);
    } else {
      items = await storageQuotaManager.getLargeItems(userId, limit);
    }

    return NextResponse.json(items);
  } catch (error) {
    console.error('Error getting large items:', error);
    return NextResponse.json(
      { error: 'Failed to get large items' },
      { status: 500 }
    );
  }
}
