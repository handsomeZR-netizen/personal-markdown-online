import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { folderTreeManager, type FolderNode } from '@/lib/folders/folder-tree';

/**
 * API route for folder tree operations
 * Validates: Requirements 4.2, 5.1, 5.2
 */

/**
 * GET /api/folders/tree - Get the folder tree for the current user
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    // Fetch all folders for the user
    const folders = await prisma.folder.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        _count: {
          select: {
            notes: true,
            children: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Transform to FolderNode format
    const folderNodes: FolderNode[] = folders.map((folder) => ({
      id: folder.id,
      name: folder.name,
      parentId: folder.parentId,
      type: 'folder' as const,
      createdAt: folder.createdAt,
      updatedAt: folder.updatedAt,
      noteCount: folder._count.notes,
    }));

    // Build the tree structure
    const tree = folderTreeManager.buildTree(folderNodes);

    return NextResponse.json({ tree });
  } catch (error) {
    console.error('GET /api/folders/tree error:', error);
    return NextResponse.json(
      { error: '获取文件夹树失败' },
      { status: 500 }
    );
  }
}
