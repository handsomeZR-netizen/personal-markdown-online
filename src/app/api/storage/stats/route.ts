/**
 * 存储统计 API
 * 获取当前用户的数据库存储统计信息
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export interface DatabaseStats {
  notes: {
    count: number;
    totalContentSize: number;
  };
  folders: {
    count: number;
  };
  versions: {
    count: number;
    totalContentSize: number;
  };
  templates: {
    count: number;
  };
  tags: {
    count: number;
  };
  collaborations: {
    count: number;
  };
  aiConversations: {
    count: number;
    messagesCount: number;
  };
  total: {
    estimatedSize: number;
  };
}

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '未授权' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // 并行获取所有统计数据
    const [
      notesData,
      foldersCount,
      versionsData,
      templatesCount,
      tagsCount,
      collaborationsCount,
      conversationsData,
    ] = await Promise.all([
      // 笔记统计
      prisma.note.findMany({
        where: { userId },
        select: { content: true },
      }),
      // 文件夹数量
      prisma.folder.count({
        where: { userId },
      }),
      // 版本历史统计
      prisma.noteVersion.findMany({
        where: { userId },
        select: { content: true },
      }),
      // 模板数量
      prisma.noteTemplate.count({
        where: { userId },
      }),
      // 用户使用的标签数量（通过笔记关联）
      prisma.tag.count({
        where: {
          notes: {
            some: { userId },
          },
        },
      }),
      // 协作数量（作为协作者）
      prisma.collaborator.count({
        where: { userId },
      }),
      // AI 对话统计
      // @ts-expect-error - Prisma client types may not be regenerated
      prisma.aIConversation.findMany({
        where: { userId },
        select: {
          _count: {
            select: { messages: true },
          },
        },
      }),
    ]);

    // 计算笔记内容大小（使用 Buffer 在服务端计算字节大小）
    const notesCount = notesData.length;
    const notesContentSize = notesData.reduce(
      (sum: number, note: { content: string }) => sum + Buffer.byteLength(note.content, 'utf8'),
      0
    );

    // 计算版本内容大小
    const versionsCount = versionsData.length;
    const versionsContentSize = versionsData.reduce(
      (sum: number, version: { content: string }) => sum + Buffer.byteLength(version.content, 'utf8'),
      0
    );

    // AI 对话统计
    const conversationsCount = conversationsData.length;
    const messagesCount = conversationsData.reduce(
      (sum: number, conv: { _count: { messages: number } }) => sum + conv._count.messages,
      0
    );

    // 估算总大小（包括元数据开销）
    const metadataOverhead = 
      notesCount * 500 + // 每个笔记约 500 字节元数据
      foldersCount * 200 + // 每个文件夹约 200 字节
      versionsCount * 300 + // 每个版本约 300 字节元数据
      templatesCount * 1000 + // 每个模板约 1KB
      tagsCount * 100 + // 每个标签约 100 字节
      collaborationsCount * 200 + // 每个协作约 200 字节
      messagesCount * 500; // 每条消息约 500 字节

    const totalEstimatedSize = 
      notesContentSize + 
      versionsContentSize + 
      metadataOverhead;

    const stats: DatabaseStats = {
      notes: {
        count: notesCount,
        totalContentSize: notesContentSize,
      },
      folders: {
        count: foldersCount,
      },
      versions: {
        count: versionsCount,
        totalContentSize: versionsContentSize,
      },
      templates: {
        count: templatesCount,
      },
      tags: {
        count: tagsCount,
      },
      collaborations: {
        count: collaborationsCount,
      },
      aiConversations: {
        count: conversationsCount,
        messagesCount: messagesCount,
      },
      total: {
        estimatedSize: totalEstimatedSize,
      },
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('获取存储统计失败:', error);
    return NextResponse.json(
      { error: '获取存储统计失败' },
      { status: 500 }
    );
  }
}
