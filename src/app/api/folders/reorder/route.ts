import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { batchUpdateFolderSortOrders } from '@/lib/actions/preferences';
import { z } from 'zod';

// Schema for validating reorder updates
const reorderUpdateSchema = z.object({
  id: z.string().uuid('Invalid folder ID format'),
  sortOrder: z.number().int().min(0).max(1000000),
});

const reorderRequestSchema = z.object({
  updates: z.array(reorderUpdateSchema).min(1).max(100, 'Too many updates in single request'),
});

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
    
    // Validate request body with Zod schema
    const parseResult = reorderRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0]?.message || 'Invalid request format' },
        { status: 400 }
      );
    }

    const { updates } = parseResult.data;

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
