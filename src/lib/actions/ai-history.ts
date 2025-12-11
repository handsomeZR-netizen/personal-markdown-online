'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// 验证 schemas
const saveSearchHistorySchema = z.object({
  query: z.string().min(1),
  searchType: z.enum(['semantic', 'natural_language']),
  resultCount: z.number().int().min(0),
});

const createConversationSchema = z.object({
  title: z.string().optional(),
});

const addMessageSchema = z.object({
  conversationId: z.string(),
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1),
  relatedNotes: z.array(z.object({
    id: z.string(),
    title: z.string(),
    similarity: z.number(),
  })).optional(),
});

/**
 * 保存搜索历史
 */
export async function saveSearchHistory(
  query: string,
  searchType: 'semantic' | 'natural_language',
  resultCount: number
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: '未登录' };
    }

    const validated = saveSearchHistorySchema.parse({ query, searchType, resultCount });

    const history = await prisma.aISearchHistory.create({
      data: {
        userId: session.user.id,
        query: validated.query,
        searchType: validated.searchType,
        resultCount: validated.resultCount,
      },
    });

    return { success: true, data: history };
  } catch (error) {
    console.error('保存搜索历史失败:', error);
    return { success: false, error: '保存搜索历史失败' };
  }
}

/**
 * 获取搜索历史
 */
export async function getSearchHistory(
  searchType?: 'semantic' | 'natural_language',
  limit: number = 20
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: '未登录' };
    }

    const history = await prisma.aISearchHistory.findMany({
      where: {
        userId: session.user.id,
        ...(searchType && { searchType }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return { success: true, data: history };
  } catch (error) {
    console.error('获取搜索历史失败:', error);
    return { success: false, error: '获取搜索历史失败' };
  }
}

/**
 * 删除搜索历史
 */
export async function deleteSearchHistory(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: '未登录' };
    }

    await prisma.aISearchHistory.deleteMany({
      where: {
        id,
        userId: session.user.id,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('删除搜索历史失败:', error);
    return { success: false, error: '删除搜索历史失败' };
  }
}

/**
 * 清空搜索历史
 */
export async function clearSearchHistory(searchType?: 'semantic' | 'natural_language') {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: '未登录' };
    }

    await prisma.aISearchHistory.deleteMany({
      where: {
        userId: session.user.id,
        ...(searchType && { searchType }),
      },
    });

    return { success: true };
  } catch (error) {
    console.error('清空搜索历史失败:', error);
    return { success: false, error: '清空搜索历史失败' };
  }
}


/**
 * 创建新对话
 */
export async function createConversation(title?: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: '未登录' };
    }

    const conversation = await prisma.aIConversation.create({
      data: {
        userId: session.user.id,
        title: title || '新对话',
      },
    });

    return { success: true, data: conversation };
  } catch (error) {
    console.error('创建对话失败:', error);
    return { success: false, error: '创建对话失败' };
  }
}

/**
 * 添加消息到对话
 */
export async function addMessageToConversation(
  conversationId: string,
  role: 'user' | 'assistant',
  content: string,
  relatedNotes?: Array<{ id: string; title: string; similarity: number }>
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: '未登录' };
    }

    // 验证对话属于当前用户
    const conversation = await prisma.aIConversation.findFirst({
      where: {
        id: conversationId,
        userId: session.user.id,
      },
    });

    if (!conversation) {
      return { success: false, error: '对话不存在' };
    }

    const message = await prisma.aIMessage.create({
      data: {
        conversationId,
        role,
        content,
        relatedNotes: relatedNotes ? JSON.stringify(relatedNotes) : null,
      },
    });

    // 更新对话的 updatedAt
    await prisma.aIConversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // 如果是第一条用户消息且对话没有标题，自动设置标题
    if (role === 'user' && conversation.title === '新对话') {
      const truncatedTitle = content.length > 30 ? content.substring(0, 30) + '...' : content;
      await prisma.aIConversation.update({
        where: { id: conversationId },
        data: { title: truncatedTitle },
      });
    }

    return { success: true, data: message };
  } catch (error) {
    console.error('添加消息失败:', error);
    return { success: false, error: '添加消息失败' };
  }
}

/**
 * 获取对话列表
 */
export async function getConversations(limit: number = 20) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: '未登录' };
    }

    const conversations = await prisma.aIConversation.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return { success: true, data: conversations };
  } catch (error) {
    console.error('获取对话列表失败:', error);
    return { success: false, error: '获取对话列表失败' };
  }
}

/**
 * 获取对话详情（包含所有消息）
 */
export async function getConversation(conversationId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: '未登录' };
    }

    const conversation = await prisma.aIConversation.findFirst({
      where: {
        id: conversationId,
        userId: session.user.id,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) {
      return { success: false, error: '对话不存在' };
    }

    // 解析 relatedNotes JSON
    const messagesWithParsedNotes = conversation.messages.map(msg => ({
      ...msg,
      relatedNotes: msg.relatedNotes ? JSON.parse(msg.relatedNotes) : null,
    }));

    return {
      success: true,
      data: {
        ...conversation,
        messages: messagesWithParsedNotes,
      },
    };
  } catch (error) {
    console.error('获取对话详情失败:', error);
    return { success: false, error: '获取对话详情失败' };
  }
}

/**
 * 删除对话
 */
export async function deleteConversation(conversationId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: '未登录' };
    }

    await prisma.aIConversation.deleteMany({
      where: {
        id: conversationId,
        userId: session.user.id,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('删除对话失败:', error);
    return { success: false, error: '删除对话失败' };
  }
}

/**
 * 清空所有对话
 */
export async function clearAllConversations() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: '未登录' };
    }

    await prisma.aIConversation.deleteMany({
      where: { userId: session.user.id },
    });

    return { success: true };
  } catch (error) {
    console.error('清空对话失败:', error);
    return { success: false, error: '清空对话失败' };
  }
}
