import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

/**
 * Unified search API for folders and notes
 * Validates: Requirements 21.1, 21.2
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '未授权' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    if (!query.trim()) {
      return NextResponse.json({
        folders: [],
        notes: [],
        totalCount: 0,
        currentPage: page,
        totalPages: 0,
      });
    }

    const skip = (page - 1) * pageSize;
    const searchTerm = query.toLowerCase();

    // Search folders
    const folders = await prisma.folder.findMany({
      where: {
        userId: session.user.id,
        name: {
          contains: searchTerm,
          mode: 'insensitive',
        },
      },
      include: {
        parent: true,
        _count: {
          select: {
            children: true,
            notes: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Search notes
    const notes = await prisma.note.findMany({
      where: {
        AND: [
          {
            OR: [
              { userId: session.user.id },
              { ownerId: session.user.id },
              {
                collaborators: {
                  some: {
                    userId: session.user.id,
                  },
                },
              },
            ],
          },
          {
            OR: [
              {
                title: {
                  contains: searchTerm,
                  mode: 'insensitive',
                },
              },
              {
                content: {
                  contains: searchTerm,
                  mode: 'insensitive',
                },
              },
            ],
          },
        ],
      },
      include: {
        folder: true,
        tags: true,
        category: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Calculate total results
    const totalCount = folders.length + notes.length;
    const totalPages = Math.ceil(totalCount / pageSize);

    // Combine and paginate results
    const allResults = [
      ...folders.map(f => ({ type: 'folder' as const, data: f })),
      ...notes.map(n => ({ type: 'note' as const, data: n })),
    ];

    const paginatedResults = allResults.slice(skip, skip + pageSize);

    // Separate back into folders and notes
    const paginatedFolders = paginatedResults
      .filter(r => r.type === 'folder')
      .map(r => r.data);
    const paginatedNotes = paginatedResults
      .filter(r => r.type === 'note')
      .map(r => r.data);

    return NextResponse.json({
      folders: paginatedFolders,
      notes: paginatedNotes,
      totalCount,
      currentPage: page,
      totalPages,
      query,
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: '搜索失败' },
      { status: 500 }
    );
  }
}
