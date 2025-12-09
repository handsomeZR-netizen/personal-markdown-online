import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

/**
 * API route for moving notes to folders
 * Validates: Requirements 4.4, 4.5
 */

const moveNoteSchema = z.object({
  noteId: z.string().cuid('无效的笔记 ID'),
  folderId: z.string().cuid('无效的文件夹 ID').nullable(),
});

/**
 * POST /api/notes/move - Move a note to a folder
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const body = await request.json();
    const validated = moveNoteSchema.parse(body);

    // Verify the note exists and user has access
    const note = await prisma.note.findFirst({
      where: {
        id: validated.noteId,
        OR: [
          { userId: session.user.id },
          { ownerId: session.user.id },
          {
            collaborators: {
              some: {
                userId: session.user.id,
                role: 'editor',
              },
            },
          },
        ],
      },
    });

    if (!note) {
      return NextResponse.json(
        { error: '笔记不存在或无权访问' },
        { status: 404 }
      );
    }

    // If folderId is provided, verify it exists and belongs to user
    if (validated.folderId) {
      const folder = await prisma.folder.findFirst({
        where: {
          id: validated.folderId,
          userId: session.user.id,
        },
      });

      if (!folder) {
        return NextResponse.json(
          { error: '目标文件夹不存在或无权访问' },
          { status: 404 }
        );
      }
    }

    // Perform the move
    const updatedNote = await prisma.note.update({
      where: { id: validated.noteId },
      data: {
        folderId: validated.folderId,
      },
      include: {
        folder: true,
        tags: true,
        category: true,
      },
    });

    return NextResponse.json({ note: updatedNote });
  } catch (error) {
    console.error('POST /api/notes/move error:', error);
    return NextResponse.json({ error: '移动笔记失败' }, { status: 500 });
  }
}
