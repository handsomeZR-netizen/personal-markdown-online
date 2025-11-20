'use server';

import { simpleChat, DeepSeekError, callDeepSeekWithRetry } from '@/lib/ai/deepseek';
import { suggestTagsSchema, summarizeNoteSchema, semanticSearchSchema, answerQuerySchema } from '@/lib/validations/ai';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export type ActionResult<T = void> = 
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * 使用 AI 建议标签
 * @param content - 笔记内容
 * @param title - 笔记标题（可选）
 * @returns 建议的标签列表
 */
export async function suggestTags(
  content: string,
  title?: string
): Promise<ActionResult<string[]>> {
  try {
    // 验证输入
    const validated = suggestTagsSchema.parse({ content, title });

    // 构建提示词
    const noteText = validated.title 
      ? `标题：${validated.title}\n\n内容：${validated.content}`
      : validated.content;

    const prompt = `请分析以下笔记内容，建议3-5个相关的标签。标签应该简洁、准确，能够帮助用户快速分类和检索笔记。

${noteText}

请只返回标签列表，每个标签用逗号分隔，不要包含其他解释文字。例如：技术,编程,JavaScript,前端,React`;

    const systemPrompt = '你是一个专业的笔记管理助手，擅长为笔记内容生成准确的分类标签。';

    // 调用 AI
    const response = await simpleChat(prompt, systemPrompt, {
      temperature: 0.5,
      max_tokens: 100,
    });

    // 解析标签
    const tags = response
      .split(/[,，、]/)
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0 && tag.length <= 20)
      .slice(0, 5);

    if (tags.length === 0) {
      return {
        success: false,
        error: 'AI 未能生成有效的标签建议',
      };
    }

    return {
      success: true,
      data: tags,
    };
  } catch (error) {
    console.error('AI 标签建议失败:', error);

    if (error instanceof DeepSeekError) {
      return {
        success: false,
        error: `AI 服务错误: ${error.message}`,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'AI 标签建议失败',
    };
  }
}

/**
 * 生成笔记摘要
 * @param content - 笔记内容
 * @returns 生成的摘要
 */
export async function summarizeNote(
  content: string
): Promise<ActionResult<string>> {
  try {
    // 验证输入
    const validated = summarizeNoteSchema.parse({ content });

    const prompt = `请用一句话总结以下笔记内容，不超过100字，要求简洁明了，突出核心要点：

${validated.content}

请只返回摘要内容，不要包含"摘要："等前缀。`;

    const systemPrompt = '你是一个专业的内容摘要助手，擅长提取文本的核心信息。';

    // 调用 AI
    const summary = await simpleChat(prompt, systemPrompt, {
      temperature: 0.3,
      max_tokens: 150,
    });

    const trimmedSummary = summary.trim();

    if (!trimmedSummary) {
      return {
        success: false,
        error: 'AI 未能生成有效的摘要',
      };
    }

    return {
      success: true,
      data: trimmedSummary,
    };
  } catch (error) {
    console.error('AI 摘要生成失败:', error);

    if (error instanceof DeepSeekError) {
      return {
        success: false,
        error: `AI 服务错误: ${error.message}`,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'AI 摘要生成失败',
    };
  }
}


/**
 * 生成文本的向量嵌入
 * @param text - 要生成嵌入的文本
 * @returns 向量嵌入数组
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
    const DEEPSEEK_API_URL = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1';

    if (!DEEPSEEK_API_KEY) {
      throw new DeepSeekError('DeepSeek API key 未配置');
    }

    // Note: DeepSeek may not have a dedicated embedding endpoint
    // This is a placeholder implementation
    // In production, you might want to use a dedicated embedding service
    // or generate embeddings using the chat model with a special prompt
    
    // For now, we'll create a simple hash-based embedding as a fallback
    // In a real implementation, you would call an embedding API
    const embedding = await createSimpleEmbedding(text);
    
    return embedding;
  } catch (error) {
    console.error('生成嵌入失败:', error);
    throw error;
  }
}

/**
 * 创建简单的文本嵌入（基于文本特征）
 * 这是一个简化的实现，实际应用中应使用专业的嵌入模型
 */
function createSimpleEmbedding(text: string): number[] {
  // 创建一个384维的向量（常见的嵌入维度）
  const dimension = 384;
  const embedding = new Array(dimension).fill(0);
  
  // 基于文本内容生成特征
  const words = text.toLowerCase().split(/\s+/);
  const uniqueWords = new Set(words);
  
  // 使用简单的哈希函数分布特征
  uniqueWords.forEach(word => {
    for (let i = 0; i < word.length; i++) {
      const charCode = word.charCodeAt(i);
      const index = (charCode * (i + 1)) % dimension;
      embedding[index] += 1 / word.length;
    }
  });
  
  // 归一化向量
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  if (magnitude > 0) {
    for (let i = 0; i < dimension; i++) {
      embedding[i] /= magnitude;
    }
  }
  
  return embedding;
}

/**
 * 计算两个向量的余弦相似度
 */
function cosineSimilarity(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length) {
    throw new Error('向量维度不匹配');
  }
  
  let dotProduct = 0;
  let mag1 = 0;
  let mag2 = 0;
  
  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    mag1 += vec1[i] * vec1[i];
    mag2 += vec2[i] * vec2[i];
  }
  
  mag1 = Math.sqrt(mag1);
  mag2 = Math.sqrt(mag2);
  
  if (mag1 === 0 || mag2 === 0) {
    return 0;
  }
  
  return dotProduct / (mag1 * mag2);
}

/**
 * 语义搜索笔记
 * @param query - 搜索查询
 * @param limit - 返回结果数量限制
 * @returns 相关笔记列表
 */
export async function semanticSearch(
  query: string,
  limit: number = 10
): Promise<ActionResult<Array<{ id: string; title: string; content: string; summary: string | null; similarity: number }>>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: '未授权' };
    }

    // 验证输入
    const validated = semanticSearchSchema.parse({ query, limit });

    // 生成查询的嵌入
    const queryEmbedding = await generateEmbedding(validated.query);

    // 获取所有用户的笔记（包含嵌入）
    const notes = await prisma.note.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
        title: true,
        content: true,
        summary: true,
        embedding: true,
      },
    });

    // 计算相似度并排序
    const notesWithSimilarity = notes
      .map(note => {
        let similarity = 0;
        
        if (note.embedding) {
          try {
            const noteEmbedding = JSON.parse(note.embedding);
            similarity = cosineSimilarity(queryEmbedding, noteEmbedding);
          } catch (error) {
            console.error('解析嵌入失败:', error);
          }
        }
        
        // 如果没有嵌入，使用简单的文本匹配作为后备
        if (similarity === 0) {
          const queryLower = validated.query.toLowerCase();
          const titleMatch = note.title.toLowerCase().includes(queryLower);
          const contentMatch = note.content.toLowerCase().includes(queryLower);
          similarity = (titleMatch ? 0.5 : 0) + (contentMatch ? 0.3 : 0);
        }
        
        return {
          id: note.id,
          title: note.title,
          content: note.content,
          summary: note.summary,
          similarity,
        };
      })
      .filter(note => note.similarity > 0.1) // 过滤低相似度结果
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, validated.limit);

    return {
      success: true,
      data: notesWithSimilarity,
    };
  } catch (error) {
    console.error('语义搜索失败:', error);

    if (error instanceof DeepSeekError) {
      return {
        success: false,
        error: `AI 服务错误: ${error.message}`,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : '语义搜索失败',
    };
  }
}

/**
 * 为笔记生成并保存嵌入
 * @param noteId - 笔记ID
 */
export async function generateNoteEmbedding(noteId: string): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: '未授权' };
    }

    // 获取笔记
    const note = await prisma.note.findUnique({
      where: {
        id: noteId,
        userId: session.user.id,
      },
    });

    if (!note) {
      return { success: false, error: '笔记不存在' };
    }

    // 生成嵌入（使用标题和内容）
    const text = `${note.title}\n\n${note.content}`;
    const embedding = await generateEmbedding(text);

    // 保存嵌入
    await prisma.note.update({
      where: {
        id: noteId,
      },
      data: {
        embedding: JSON.stringify(embedding),
      },
    });

    return { success: true, data: undefined };
  } catch (error) {
    console.error('生成笔记嵌入失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '生成嵌入失败',
    };
  }
}


/**
 * 自然语言问答
 * @param query - 用户问题
 * @param maxNotes - 最多使用的笔记数量
 * @returns AI 回答和相关笔记
 */
export async function answerQuery(
  query: string,
  maxNotes: number = 5
): Promise<ActionResult<{
  answer: string;
  relatedNotes: Array<{ id: string; title: string; similarity: number }>;
}>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: '未授权' };
    }

    // 验证输入
    const validated = answerQuerySchema.parse({ query, maxNotes });

    // 使用语义搜索找到相关笔记
    const searchResult = await semanticSearch(validated.query, validated.maxNotes);
    
    if (!searchResult.success) {
      return { success: false, error: searchResult.error };
    }

    const relevantNotes = searchResult.data;

    if (relevantNotes.length === 0) {
      return {
        success: true,
        data: {
          answer: '抱歉，我在您的笔记中没有找到与此问题相关的内容。',
          relatedNotes: [],
        },
      };
    }

    // 构建上下文
    const context = relevantNotes
      .map((note, index) => `笔记 ${index + 1}: ${note.title}\n${note.content}`)
      .join('\n\n---\n\n');

    // 构建提示词
    const prompt = `基于以下笔记内容回答用户的问题。请用简洁、准确的语言回答，并在回答中引用相关笔记的内容。

笔记内容：
${context}

用户问题：${validated.query}

请提供详细的回答：`;

    const systemPrompt = '你是一个专业的笔记助手，擅长从用户的笔记中提取信息并回答问题。';

    // 调用 AI 生成回答
    const answer = await simpleChat(prompt, systemPrompt, {
      temperature: 0.7,
      max_tokens: 1000,
    });

    // 准备相关笔记信息
    const relatedNotes = relevantNotes.map(note => ({
      id: note.id,
      title: note.title,
      similarity: note.similarity,
    }));

    return {
      success: true,
      data: {
        answer: answer.trim(),
        relatedNotes,
      },
    };
  } catch (error) {
    console.error('AI 问答失败:', error);

    if (error instanceof DeepSeekError) {
      return {
        success: false,
        error: `AI 服务错误: ${error.message}`,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'AI 问答失败',
    };
  }
}
