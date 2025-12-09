import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

/**
 * API route for moving folders
 * Validates: Requirements 4.4, 4.5
 */

const moveFolderSchema = z.object({
  nodeId: z.string().cuid('无效的节点 ID'),
  newParentId: z.string().cuid('无效的父节点 ID').nullable(),
});

/**
 * POST /api/folders/move - Move a folder to a new parent
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const body = await request.json();
    const validated = moveFolderSchema.parse(body);

    // Verify the folder exists and belongs to user
    const folder = await prisma.folder.findFirst({
      where: {
        id: validated.nodeId,
        userId: session.user.id,
      },
    });

    if (!folder) {
      return NextResponse.json(
        { error: '文件夹不存在或无权访问' },
        { status: 404 }
      );
    }

    // If newParentId is provided, verify it exists and belongs to user
    if (validated.newParentId) {
      const newParent = await prisma.folder.findFirst({
        where: {
          id: validated.newParentId,
          userId: session.user.id,
        },
      });

      if (!newParent) {
        return NextResponse.json(
          { error: '目标文件夹不存在或无权访问' },
          { status: 404 }
        );
      }

      // Prevent moving folder into itself
      if (validated.newParentId === validated.nodeId) {
        return NextResponse.json(
          { error: '不能将文件夹移动到自身' },
          { status: 400 }
        );
      }

      // Check for circular reference
      const wouldCreateCircle = await checkCircularReference(
        validated.nodeId,
        validated.newParentId
      );
      if (wouldCreateCircle) {
        return NextResponse.json(
          { error: '不能将文件夹移动到其子文件夹中' },
          { status: 400 }
        );
      }
    }

    // Perform the move
    const updatedFolder = await prisma.folder.update({
      where: { id: validated.nodeId },
      data: {
        parentId: validated.newParentId,
      },
      include: {
        parent: true,
        _count: {
          select: {
            children: true,
            notes: true,
          },
        },
      },
    });

    return NextResponse.json({ folder: updatedFolder });
  } catch (error) {
    console.error('POST /api/folders/move error:', error);
    return NextResponse.json({ error: '移动文件夹失败' }, { status: 500 });
  }
}

/**
 * Helper function to check for circular references
 * This prevents creating cycles in the folder tree
 */
async function checkCircularReference(
  folderId: string,
  newParentId: string
): Promise<boolean> {
  let currentId: string | null = newParentId;

  // Traverse up the tree from newParentId
  while (currentId) {
    if (currentId === folderId) {
      return true; // Circular reference detected
    }

    const folder = await prisma.folder.findUnique({
      where: { id: currentId },
      select: { parentId: true },
    });

    currentId = folder?.parentId || null;
  }

  return false;
}
