import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { createFolderSchema } from '@/lib/validations/folders';
import { randomUUID } from 'crypto';

/**
 * API routes for folder operations
 * Validates: Requirements 4.1, 4.2
 */

/**
 * GET /api/folders - Get all folders for the current user
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const folders = await prisma.folder.findMany({
      where: {
        userId: session.user.id,
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
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ folders });
  } catch (error) {
    console.error('GET /api/folders error:', error);
    return NextResponse.json(
      { error: '获取文件夹列表失败' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/folders - Create a new folder
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const body = await request.json();
    const validated = createFolderSchema.parse(body);

    // If parentId is provided, verify it exists and belongs to the user
    if (validated.parentId) {
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
    }

    const folder = await prisma.folder.create({
      data: {
        id: randomUUID(),
        name: validated.name,
        parentId: validated.parentId || null,
        userId: session.user.id,
        updatedAt: new Date(),
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

    return NextResponse.json({ folder }, { status: 201 });
  } catch (error) {
    console.error('POST /api/folders error:', error);
    return NextResponse.json({ error: '创建文件夹失败' }, { status: 500 });
  }
}
