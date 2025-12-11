'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

/**
 * AI History Actions
 * 管理 AI 对话历史和搜索历史
 */

// ==================== 搜索历史 ====================

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

    const history = await prisma.aISearchHistory.create({
      data: {
        userId: session.user.id,
        query,
        searchType,
        resultCount,
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
      return { success: false, error: '未登录', data: [] };
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
    return { success: false, error: '获取搜索历史失败', data: [] };
  }
}

/**
 * 搜索历史记录（模糊搜索）
 */
export async function searchHistory(
  keyword: string,
  searchType?: 'semantic' | 'natural_language',
  limit: number = 20
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: '未登录', data: [] };
    }

    const history = await prisma.aISearchHistory.findMany({
      where: {
        userId: session.user.id,
        query: { contains: keyword, mode: 'insensitive' },
        ...(searchType && { searchType }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return { success: true, data: history };
  } catch (error) {
    console.error('搜索历史失败:', error);
    return { success: false, error: '搜索历史失败', data: [] };
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

    await prisma.aISearchHistory.delete({
      where: { id, userId: session.user.id },
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

// ==================== 对话历史 ====================

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
        title: title || null,
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
      where: { id: conversationId, userId: session.user.id },
    });

    if (!conversation) {
      return { success: false, error: '对话不存在' };
    }

    const message = await prisma.aIMessage.create({
      data: {
        conversationId,
        role,
        content,
        relatedNotes: relatedNotes ? JSON.parse(JSON.stringify(relatedNotes)) : null,
      },
    });

    // 如果是用户的第一条消息，更新对话标题
    if (role === 'user' && !conversation.title) {
      const title = content.length > 50 ? content.substring(0, 50) + '...' : content;
      await prisma.aIConversation.update({
        where: { id: conversationId },
        data: { title },
      });
    }

    // 更新对话的 updatedAt
    await prisma.aIConversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

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
      return { success: false, error: '未登录', data: [] };
    }

    const conversations = await prisma.aIConversation.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      select: {
        id: true,
        title: true,
        updatedAt: true,
        _count: { select: { messages: true } },
      },
    });

    return { 
      success: true, 
      data: conversations.map(c => ({
        id: c.id,
        title: c.title,
        updatedAt: c.updatedAt,
        messageCount: c._count.messages,
      }))
    };
  } catch (error) {
    console.error('获取对话列表失败:', error);
    return { success: false, error: '获取对话列表失败', data: [] };
  }
}

/**
 * 搜索对话（按标题或消息内容）
 */
export async function searchConversations(keyword: string, limit: number = 20) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: '未登录', data: [] };
    }

    const conversations = await prisma.aIConversation.findMany({
      where: {
        userId: session.user.id,
        OR: [
          { title: { contains: keyword, mode: 'insensitive' } },
          { messages: { some: { content: { contains: keyword, mode: 'insensitive' } } } },
        ],
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      select: {
        id: true,
        title: true,
        updatedAt: true,
        _count: { select: { messages: true } },
      },
    });

    return { 
      success: true, 
      data: conversations.map(c => ({
        id: c.id,
        title: c.title,
        updatedAt: c.updatedAt,
        messageCount: c._count.messages,
      }))
    };
  } catch (error) {
    console.error('搜索对话失败:', error);
    return { success: false, error: '搜索对话失败', data: [] };
  }
}

/**
 * 获取单个对话及其消息
 */
export async function getConversation(conversationId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: '未登录', data: null };
    }

    const conversation = await prisma.aIConversation.findFirst({
      where: { id: conversationId, userId: session.user.id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) {
      return { success: false, error: '对话不存在', data: null };
    }

    return { 
      success: true, 
      data: {
        ...conversation,
        messages: conversation.messages.map(m => ({
          id: m.id,
          role: m.role,
          content: m.content,
          relatedNotes: m.relatedNotes as Array<{ id: string; title: string; similarity: number }> | null,
          createdAt: m.createdAt,
        })),
      }
    };
  } catch (error) {
    console.error('获取对话失败:', error);
    return { success: false, error: '获取对话失败', data: null };
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

    await prisma.aIConversation.delete({
      where: { id: conversationId, userId: session.user.id },
    });

    return { success: true };
  } catch (error) {
    console.error('删除对话失败:', error);
    return { success: false, error: '删除对话失败' };
  }
}

/**
 * 更新对话标题
 */
export async function updateConversationTitle(conversationId: string, title: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: '未登录' };
    }

    await prisma.aIConversation.update({
      where: { id: conversationId, userId: session.user.id },
      data: { title },
    });

    return { success: true };
  } catch (error) {
    console.error('更新对话标题失败:', error);
    return { success: false, error: '更新对话标题失败' };
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
