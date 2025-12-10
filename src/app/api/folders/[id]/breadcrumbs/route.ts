import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

/**
 * API route for folder breadcrumbs
 * Validates: Requirements 5.1, 5.2
 */

/**
 * GET /api/folders/[id]/breadcrumbs - Get breadcrumb path for a folder
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    // Verify folder exists and belongs to user
    const folder = await prisma.folder.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!folder) {
      return NextResponse.json(
        { error: '文件夹不存在或无权访问' },
        { status: 404 }
      );
    }

    // Build breadcrumb path by traversing up the tree
    const breadcrumbs = [];
    let currentFolder = folder;

    while (currentFolder) {
      breadcrumbs.unshift({
        id: currentFolder.id,
        name: currentFolder.name,
        parentId: currentFolder.parentId,
      });

      if (currentFolder.parentId) {
        const parent = await prisma.folder.findFirst({
          where: {
            id: currentFolder.parentId,
            userId: session.user.id,
          },
        });
        currentFolder = parent as any;
      } else {
        break;
      }
    }

    return NextResponse.json({ breadcrumbs });
  } catch (error) {
    console.error('GET /api/folders/[id]/breadcrumbs error:', error);
    return NextResponse.json(
      { error: '获取面包屑路径失败' },
      { status: 500 }
    );
  }
}
