import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

/**
 * GET /api/categories
 * 获取所有分类
 */
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    console.error('获取分类失败:', error);
    return NextResponse.json(
      { success: false, error: '获取分类列表失败' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/categories
 * 创建新分类
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: '未授权访问' },
        { status: 401 }
      );
    }

    const { name } = await request.json();
    
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: '分类名称不能为空' },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();

    // Check if category already exists
    const existingCategory = await prisma.category.findUnique({
      where: { name: trimmedName },
    });

    if (existingCategory) {
      return NextResponse.json({ success: true, data: existingCategory });
    }

    const category = await prisma.category.create({
      data: { name: trimmedName },
    });

    return NextResponse.json({ success: true, data: category }, { status: 201 });
  } catch (error) {
    console.error('创建分类失败:', error);
    return NextResponse.json(
      { success: false, error: '创建分类失败' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/categories
 * 删除分类
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: '未授权访问' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('id');

    if (!categoryId) {
      return NextResponse.json(
        { success: false, error: '缺少分类ID' },
        { status: 400 }
      );
    }

    // Check if category exists and has notes
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        _count: { select: { notes: true } },
      },
    });

    if (!category) {
      return NextResponse.json(
        { success: false, error: '分类不存在' },
        { status: 404 }
      );
    }

    if (category._count.notes > 0) {
      return NextResponse.json(
        { success: false, error: `该分类下还有 ${category._count.notes} 篇笔记，无法删除` },
        { status: 400 }
      );
    }

    await prisma.category.delete({
      where: { id: categoryId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除分类失败:', error);
    return NextResponse.json(
      { success: false, error: '删除分类失败' },
      { status: 500 }
    );
  }
}
