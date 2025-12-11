import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { updateFolderSchema } from '@/lib/validations/folders';

/**
 * API routes for individual folder operations
 * Validates: Requirements 4.1, 4.2
 */

/**
 * GET /api/folders/[id] - Get a single folder
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

    const folder = await prisma.folder.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        Folder: true,
        other_Folder: {
          orderBy: { name: 'asc' },
        },
        Note: {
          orderBy: { updatedAt: 'desc' },
          include: {
            Tag: true,
            Category: true,
          },
        },
        _count: {
          select: {
            other_Folder: true,
            Note: true,
          },
        },
      },
    });

    if (!folder) {
      return NextResponse.json(
        { error: '文件夹不存在或无权访问' },
        { status: 404 }
      );
    }

    return NextResponse.json({ folder });
  } catch (error) {
    console.error('GET /api/folders/[id] error:', error);
    return NextResponse.json({ error: '获取文件夹失败' }, { status: 500 });
  }
}

/**
 * PATCH /api/folders/[id] - Update a folder
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const body = await request.json();
    const validated = updateFolderSchema.parse(body);

    // Verify folder exists and belongs to user
    const existingFolder = await prisma.folder.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingFolder) {
      return NextResponse.json(
        { error: '文件夹不存在或无权访问' },
        { status: 404 }
      );
    }

    // If updating parentId, verify the new parent exists and belongs to user
    if (validated.parentId !== undefined && validated.parentId !== null) {
      const parentFolder = await prisma.folder.findFirst({
        where: {
          id: validated.parentId,
          userId: session.user.id,
        },
      });

      if (!parentFolder) {
        return NextResponse.json(
          { error: '父文件夹不存在或无权访问' },
          { status: 404 }
        );
      }

      // Prevent moving folder into itself
      if (validated.parentId === id) {
        return NextResponse.json(
          { error: '不能将文件夹移动到自身' },
          { status: 400 }
        );
      }

      // Check for circular reference
      const wouldCreateCircle = await checkCircularReference(
        id,
        validated.parentId
      );
      if (wouldCreateCircle) {
        return NextResponse.json(
          { error: '不能将文件夹移动到其子文件夹中' },
          { status: 400 }
        );
      }
    }

    const folder = await prisma.folder.update({
      where: { id },
      data: {
        ...(validated.name && { name: validated.name }),
        ...(validated.parentId !== undefined && {
          parentId: validated.parentId,
        }),
      },
      include: {
        Folder: true,
        _count: {
          select: {
            other_Folder: true,
            Note: true,
          },
        },
      },
    });

    return NextResponse.json({ folder });
  } catch (error) {
    console.error('PATCH /api/folders/[id] error:', error);
    return NextResponse.json({ error: '更新文件夹失败' }, { status: 500 });
  }
}

/**
 * DELETE /api/folders/[id] - Delete a folder
 */
export async function DELETE(
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
      include: {
        _count: {
          select: {
            other_Folder: true,
            Note: true,
          },
        },
      },
    });

    if (!folder) {
      return NextResponse.json(
        { error: '文件夹不存在或无权访问' },
        { status: 404 }
      );
    }

    // Check if folder has children or notes
    if (folder._count.other_Folder > 0 || folder._count.Note > 0) {
      return NextResponse.json(
        { error: '文件夹不为空，请先删除其中的内容' },
        { status: 400 }
      );
    }

    await prisma.folder.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/folders/[id] error:', error);
    return NextResponse.json({ error: '删除文件夹失败' }, { status: 500 });
  }
}

/**
 * Helper function to check for circular references
 */
async function checkCircularReference(
  folderId: string,
  newParentId: string
): Promise<boolean> {
  let currentId: string | null = newParentId;

  while (currentId) {
    if (currentId === folderId) {
      return true; // Circular reference detected
    }

    const foundFolder: { parentId: string | null } | null = await prisma.folder.findUnique({
      where: { id: currentId },
      select: { parentId: true },
    });

    currentId = foundFolder?.parentId || null;
  }

  return false;
}
