import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { createNoteSchema } from '@/lib/validations/notes';
import { validateData } from '@/lib/validation-utils';
import { generateEmbedding } from '@/lib/actions/ai';
import { summaryService } from '@/lib/ai/summary-service';

/**
 * POST /api/notes
 * 创建新笔记
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    const tagIds = formData.get('tagIds')
      ? JSON.parse(formData.get('tagIds') as string)
      : [];
    const categoryId = formData.get('categoryId') as string | null;

    // 验证数据
    const validation = validateData(createNoteSchema, {
      title,
      content,
      tagIds,
      categoryId: categoryId || undefined,
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error, errors: validation.errors },
        { status: 400 }
      );
    }

    const validatedFields = validation.data;

    // 生成摘要（内容超过 200 字时自动生成）
    let summary: string | null = null;
    if (summaryService.shouldGenerateSummary(validatedFields.content)) {
      try {
        summary = await summaryService.generateSummary(validatedFields.content);
      } catch (error) {
        console.error('生成摘要失败:', error);
        // 失败时不影响笔记创建
      }
    }

    // 生成嵌入向量
    let embedding: string | null = null;
    try {
      const text = `${validatedFields.title}\n\n${validatedFields.content}`;
      const embeddingVector = await generateEmbedding(text);
      embedding = JSON.stringify(embeddingVector);
    } catch (error) {
      console.error('生成嵌入失败:', error);
    }

    // 创建笔记
    // @ts-ignore - Prisma Client type generation issue with summary field
    const note = await prisma.note.create({
      data: {
        title: validatedFields.title,
        content: validatedFields.content,
        summary,
        embedding,
        userId: session.user.id,
        tags: validatedFields.tagIds
          ? {
              connect: validatedFields.tagIds.map((id) => ({ id })),
            }
          : undefined,
        categoryId: validatedFields.categoryId || null,
      },
      select: {
        id: true,
        title: true,
        content: true,
        summary: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error('创建笔记失败:', error);
    return NextResponse.json(
      { error: 'Failed to create note' },
      { status: 500 }
    );
  }
}
