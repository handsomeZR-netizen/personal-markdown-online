import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getNoteById, updateNote, deleteNote } from '@/lib/supabase-notes';
import { updateNoteSchema, deleteNoteSchema } from '@/lib/validations/notes';
import { validateData, isValidCuid } from '@/lib/validation-utils';
import { generateEmbedding } from '@/lib/actions/ai';
import { summaryService } from '@/lib/ai/summary-service';

/**
 * GET /api/notes/[id]
 * 获取单个笔记
 */
export async function GET(
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
    const { data: note, error } = await getNoteById(id, session.user.id);

    if (error || !note) {
      return NextResponse.json(
        { error: error || 'Note not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(note);
  } catch (error) {
    console.error('获取笔记失败:', error);
    return NextResponse.json(
      { error: 'Failed to get note' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/notes/[id]
 * 更新笔记
 */
export async function PUT(
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

    const formData = await request.formData();
    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    const tagIds = formData.get('tagIds')
      ? JSON.parse(formData.get('tagIds') as string)
      : [];
    const categoryId = formData.get('categoryId') as string | null;

    // 验证数据
    const validation = validateData(updateNoteSchema, {
      id,
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

    // 验证笔记所有权
    const { data: existingNote, error: checkError } = await getNoteById(id, session.user.id);

    if (checkError || !existingNote) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      );
    }

    // 生成摘要（内容超过 200 字时自动生成）
    let summary: string | null = null;
    if (validatedFields.content && summaryService.shouldGenerateSummary(validatedFields.content)) {
      try {
        summary = await summaryService.generateSummary(validatedFields.content);
      } catch (error) {
        console.error('生成摘要失败:', error);
        // 失败时不影响笔记保存
      }
    }

    // 生成嵌入向量
    let embedding: string | null = null;
    if (validatedFields.title && validatedFields.content) {
      try {
        const text = `${validatedFields.title}\n\n${validatedFields.content}`;
        const embeddingVector = await generateEmbedding(text);
        embedding = JSON.stringify(embeddingVector);
      } catch (error) {
        console.error('生成嵌入失败:', error);
      }
    }

    // 构建更新数据
    const updateData: any = {};

    if (validatedFields.title !== undefined) {
      updateData.title = validatedFields.title;
    }
    if (validatedFields.content !== undefined) {
      updateData.content = validatedFields.content;
    }
    if (summary !== null) {
      updateData.summary = summary;
    }
    if (embedding !== null) {
      updateData.embedding = embedding;
    }
    if (validatedFields.categoryId !== undefined) {
      updateData.categoryId = validatedFields.categoryId || null;
    }

    // 更新笔记
    const { data: note, error: updateError } = await updateNote(
      id,
      session.user.id,
      updateData
    );

    if (updateError || !note) {
      return NextResponse.json(
        { error: updateError || 'Failed to update note' },
        { status: 500 }
      );
    }

    return NextResponse.json(note);
  } catch (error) {
    console.error('更新笔记失败:', error);
    return NextResponse.json(
      { error: 'Failed to update note' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notes/[id]
 * 删除笔记
 */
export async function DELETE(
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

    // 验证数据
    const validation = validateData(deleteNoteSchema, { id });
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // 验证笔记所有权并删除
    const { data: note } = await getNoteById(id, session.user.id);

    if (!note) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      );
    }

    // 删除笔记
    const { error: deleteError } = await deleteNote(id, session.user.id);

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除笔记失败:', error);
    return NextResponse.json(
      { error: 'Failed to delete note' },
      { status: 500 }
    );
  }
}
