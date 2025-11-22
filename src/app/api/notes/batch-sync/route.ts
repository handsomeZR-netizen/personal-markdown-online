import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createNote, updateNote, deleteNote, getNoteById } from '@/lib/supabase-notes';
import { SyncOperation } from '@/types/offline';
import { isValidCuid } from '@/lib/validation-utils';
import { summarizeNote as generateSummary, generateEmbedding } from '@/lib/actions/ai';

/**
 * 批量同步操作结果
 */
interface BatchSyncResult {
  success: boolean;
  noteId?: string;
  error?: string;
}

/**
 * POST /api/notes/batch-sync
 * 批量同步笔记操作
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

    const body = await request.json();
    const { operations } = body as { operations: SyncOperation[] };

    if (!Array.isArray(operations) || operations.length === 0) {
      return NextResponse.json(
        { error: 'Invalid operations array' },
        { status: 400 }
      );
    }

    // 限制批量大小
    if (operations.length > 20) {
      return NextResponse.json(
        { error: 'Batch size exceeds maximum of 20 operations' },
        { status: 400 }
      );
    }

    const results: BatchSyncResult[] = [];
    const userId = session.user.id;

    // 设置 30 秒超时限制
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Batch sync timeout after 30 seconds')), 30000);
    });

    try {
      // 使用 Promise.race 实现超时控制
      await Promise.race([
        (async () => {
          // 按操作类型分组以优化批量处理
          const createOps = operations.filter(op => op.type === 'create');
          const updateOps = operations.filter(op => op.type === 'update');
          const deleteOps = operations.filter(op => op.type === 'delete');

          // 并行处理不同类型的操作以减少数据库往返
          const [createResults, updateResults, deleteResults] = await Promise.all([
            // 处理创建操作
            Promise.all(createOps.map(async (operation) => {
              try {
                return await handleCreateOperation(operation, userId);
              } catch (error) {
                console.error(`创建操作失败 (${operation.id}):`, error);
                return {
                  success: false,
                  error: error instanceof Error ? error.message : 'Unknown error',
                };
              }
            })),
            // 处理更新操作
            Promise.all(updateOps.map(async (operation) => {
              try {
                return await handleUpdateOperation(operation, userId);
              } catch (error) {
                console.error(`更新操作失败 (${operation.id}):`, error);
                return {
                  success: false,
                  error: error instanceof Error ? error.message : 'Unknown error',
                };
              }
            })),
            // 处理删除操作
            Promise.all(deleteOps.map(async (operation) => {
              try {
                return await handleDeleteOperation(operation, userId);
              } catch (error) {
                console.error(`删除操作失败 (${operation.id}):`, error);
                return {
                  success: false,
                  error: error instanceof Error ? error.message : 'Unknown error',
                };
              }
            })),
          ]);

          // 按原始顺序重新组合结果
          const resultMap = new Map<string, BatchSyncResult>();
          createOps.forEach((op, i) => resultMap.set(op.id, createResults[i]));
          updateOps.forEach((op, i) => resultMap.set(op.id, updateResults[i]));
          deleteOps.forEach((op, i) => resultMap.set(op.id, deleteResults[i]));

          // 按原始操作顺序返回结果
          operations.forEach(op => {
            const result = resultMap.get(op.id);
            if (result) {
              results.push(result);
            } else {
              results.push({
                success: false,
                error: 'Operation result not found',
              });
            }
          });
        })(),
        timeoutPromise,
      ]);

      // 计算成功和失败数量
      const successCount = results.filter((r) => r.success).length;
      const failedCount = results.filter((r) => !r.success).length;

      return NextResponse.json({
        results,
        summary: {
          total: operations.length,
          success: successCount,
          failed: failedCount,
        },
      });
    } catch (error) {
      console.error('批量同步失败:', error);
      
      // 如果是超时错误，返回部分结果
      if (error instanceof Error && error.message.includes('timeout')) {
        const successCount = results.filter((r) => r.success).length;
        const failedCount = results.filter((r) => !r.success).length;
        const remaining = operations.length - results.length;
        
        return NextResponse.json({
          results,
          summary: {
            total: operations.length,
            success: successCount,
            failed: failedCount + remaining,
          },
          error: 'Batch sync timeout - partial results returned',
        }, { status: 408 });
      }
      
      return NextResponse.json(
        { error: 'Batch sync failed' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('批量同步失败:', error);
    return NextResponse.json(
      { error: 'Failed to process batch sync' },
      { status: 500 }
    );
  }
}

/**
 * 处理创建操作
 */
async function handleCreateOperation(
  operation: SyncOperation,
  userId: string
): Promise<BatchSyncResult> {
  try {
    const { title, content, tags, categoryId } = operation.data;

    if (!title || !content) {
      return {
        success: false,
        error: 'Title and content are required',
      };
    }

    // 生成摘要
    let summary: string | null = null;
    if (content.length >= 50) {
      const summaryResult = await generateSummary(content);
      if (summaryResult.success) {
        summary = summaryResult.data;
      }
    }

    // 生成嵌入向量
    let embedding: string | null = null;
    try {
      const text = `${title}\n\n${content}`;
      const embeddingVector = await generateEmbedding(text);
      embedding = JSON.stringify(embeddingVector);
    } catch (error) {
      console.error('生成嵌入失败:', error);
    }

    // 创建笔记
    const { data: note, error } = await createNote({
      title,
      content,
      summary,
      embedding,
      userId,
      categoryId: categoryId || null,
    });

    if (error || !note) {
      return {
        success: false,
        error: error || 'Failed to create note',
      };
    }

    return {
      success: true,
      noteId: note.id,
    };
  } catch (error) {
    console.error('创建笔记失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create note',
    };
  }
}

/**
 * 处理更新操作
 */
async function handleUpdateOperation(
  operation: SyncOperation,
  userId: string
): Promise<BatchSyncResult> {
  try {
    const { noteId } = operation;

    if (!noteId || !isValidCuid(noteId)) {
      return {
        success: false,
        error: 'Invalid note ID',
      };
    }

    // 验证笔记所有权
    const { data: existingNote, error: checkError } = await getNoteById(noteId, userId);

    if (checkError || !existingNote) {
      return {
        success: false,
        error: 'Note not found',
      };
    }

    const { title, content, tags, categoryId } = operation.data;

    // 生成摘要
    let summary: string | null = null;
    if (content && content.length >= 50) {
      const summaryResult = await generateSummary(content);
      if (summaryResult.success) {
        summary = summaryResult.data;
      }
    }

    // 生成嵌入向量
    let embedding: string | null = null;
    if (title && content) {
      try {
        const text = `${title}\n\n${content}`;
        const embeddingVector = await generateEmbedding(text);
        embedding = JSON.stringify(embeddingVector);
      } catch (error) {
        console.error('生成嵌入失败:', error);
      }
    }

    // 构建更新数据
    const updateData: any = {};

    if (title !== undefined) {
      updateData.title = title;
    }
    if (content !== undefined) {
      updateData.content = content;
    }
    if (summary !== null) {
      updateData.summary = summary;
    }
    if (embedding !== null) {
      updateData.embedding = embedding;
    }
    if (categoryId !== undefined) {
      updateData.categoryId = categoryId || null;
    }

    // 更新笔记
    const { error: updateError } = await updateNote(noteId, userId, updateData);

    if (updateError) {
      return {
        success: false,
        error: updateError,
      };
    }

    return {
      success: true,
      noteId,
    };
  } catch (error) {
    console.error('更新笔记失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update note',
    };
  }
}

/**
 * 处理删除操作
 */
async function handleDeleteOperation(
  operation: SyncOperation,
  userId: string
): Promise<BatchSyncResult> {
  try {
    const { noteId } = operation;

    if (!noteId || !isValidCuid(noteId)) {
      return {
        success: false,
        error: 'Invalid note ID',
      };
    }

    // 验证笔记所有权并删除
    const { data: note } = await getNoteById(noteId, userId);

    if (!note) {
      return {
        success: false,
        error: 'Note not found',
      };
    }

    // 删除笔记
    const { error: deleteError } = await deleteNote(noteId, userId);

    if (deleteError) {
      return {
        success: false,
        error: deleteError,
      };
    }

    return {
      success: true,
      noteId,
    };
  } catch (error) {
    console.error('删除笔记失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete note',
    };
  }
}
