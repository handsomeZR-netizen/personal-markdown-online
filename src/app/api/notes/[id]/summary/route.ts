import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { isValidCuid } from '@/lib/validation-utils';
import { summaryService } from '@/lib/ai/summary-service';

/**
 * POST /api/notes/[id]/summary
 * 重新生成笔记摘要
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // 验证 ID 格式
    if (!isValidCuid(id)) {
      return NextResponse.json(
        { error: 'Invalid note ID' },
        { status: 400 }
      );
    }

    // 获取笔记
    const note = await prisma.note.findUnique({
      where: { id, userId: session.user.id },
      select: {
        id: true,
        content: true,
      },
    });

    if (!note) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      );
    }

    // 生成摘要
    const summary = await summaryService.generateSummary(note.content);

    // 更新数据库
    // @ts-ignore - Prisma Client type generation issue with summary field
    const updatedNote = await prisma.note.update({
      where: { id, userId: session.user.id },
      data: { summary },
      select: {
        id: true,
        summary: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      summary: updatedNote.summary,
      updatedAt: updatedNote.updatedAt,
    });
  } catch (error) {
    console.error('重新生成摘要失败:', error);
    return NextResponse.json(
      { error: 'Failed to regenerate summary' },
      { status: 500 }
    );
  }
}
