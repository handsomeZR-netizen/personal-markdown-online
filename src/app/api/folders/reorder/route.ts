import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { batchUpdateFolderSortOrders } from '@/lib/actions/preferences';

/**
 * POST /api/folders/reorder
 * Batch update folder sort orders for manual sorting
 * Validates: Requirement 22.4
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { updates } = body;

    if (!Array.isArray(updates)) {
      return NextResponse.json(
        { error: 'Invalid request: updates must be an array' },
        { status: 400 }
      );
    }

    // Validate each update
    for (const update of updates) {
      if (!update.id || typeof update.sortOrder !== 'number') {
        return NextResponse.json(
          { error: 'Invalid update format: each update must have id and sortOrder' },
          { status: 400 }
        );
      }
    }

    const result = await batchUpdateFolderSortOrders(updates);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Folder reorder error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to reorder folders' },
      { status: 500 }
    );
  }
}
