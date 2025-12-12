'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import {
  createFolderSchema,
  updateFolderSchema,
  deleteFolderSchema,
  getFolderSchema,
  type CreateFolderInput,
  type UpdateFolderInput,
} from '@/lib/validations/folders';
import { revalidatePath } from 'next/cache';

/**
 * Server actions for folder CRUD operations
 * Validates: Requirements 4.1, 4.2
 */

/**
 * Create a new folder
 */
export async function createFolder(input: CreateFolderInput) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: '未授权' };
    }

    const validated = createFolderSchema.parse(input);

    // If parentId is provided, verify it exists and belongs to the user
    if (validated.parentId) {
      const parentFolder = await prisma.folder.findFirst({
        where: {
          id: validated.parentId,
          userId: session.user.id,
        },
      });

      if (!parentFolder) {
        return { success: false, error: '父文件夹不存在或无权访问' };
      }
    }

    const { createId } = await import('@paralleldrive/cuid2')
    const folder = await prisma.folder.create({
      data: {
        id: createId(),
        name: validated.name,
        parentId: validated.parentId || null,
        userId: session.user.id,
        updatedAt: new Date(),
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
    });

    revalidatePath('/notes');
    revalidatePath('/folders');

    return { success: true, data: folder };
  } catch (error) {
    console.error('Create folder error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '创建文件夹失败',
    };
  }
}

/**
 * Update a folder
 */
export async function updateFolder(id: string, input: UpdateFolderInput) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: '未授权' };
    }

    const validated = updateFolderSchema.parse(input);

    // Verify folder exists and belongs to user
    const existingFolder = await prisma.folder.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingFolder) {
      return { success: false, error: '文件夹不存在或无权访问' };
    }

    // If updating parentId, verify the new parent exists and belongs to user
    if (validated.parentId !== undefined && validated.parentId !== null) {
      const parentFolder = await prisma.folder.findFirst({
        where: {
          id: validated.parentId,
          userId: session.user.id,
        },
      });

      if (!parentFolder) {
        return { success: false, error: '父文件夹不存在或无权访问' };
      }

      // Prevent moving folder into itself or its descendants
      if (validated.parentId === id) {
        return { success: false, error: '不能将文件夹移动到自身' };
      }

      // Check for circular reference
      const wouldCreateCircle = await checkCircularReference(
        id,
        validated.parentId
      );
      if (wouldCreateCircle) {
        return { success: false, error: '不能将文件夹移动到其子文件夹中' };
      }
    }

    const folder = await prisma.folder.update({
      where: { id },
      data: {
        ...(validated.name && { name: validated.name }),
        ...(validated.parentId !== undefined && {
          parentId: validated.parentId,
        }),
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
    });

    revalidatePath('/notes');
    revalidatePath('/folders');
    revalidatePath(`/folders/${id}`);

    return { success: true, data: folder };
  } catch (error) {
    console.error('Update folder error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '更新文件夹失败',
    };
  }
}

/**
 * Delete a folder
 */
export async function deleteFolder(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: '未授权' };
    }

    const validated = deleteFolderSchema.parse({ id });

    // Verify folder exists and belongs to user
    const folder = await prisma.folder.findFirst({
      where: {
        id: validated.id,
        userId: session.user.id,
      },
      include: {
        _count: {
          select: {
            children: true,
            notes: true,
          },
        },
      },
    });

    if (!folder) {
      return { success: false, error: '文件夹不存在或无权访问' };
    }

    // Check if folder has children or notes
    if (folder._count.children > 0 || folder._count.notes > 0) {
      return {
        success: false,
        error: '文件夹不为空，请先删除其中的内容',
      };
    }

    await prisma.folder.delete({
      where: { id: validated.id },
    });

    revalidatePath('/notes');
    revalidatePath('/folders');

    return { success: true };
  } catch (error) {
    console.error('Delete folder error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '删除文件夹失败',
    };
  }
}

/**
 * Get a single folder with its details
 */
export async function getFolder(id: string, sortBy?: string, sortOrder?: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: '未授权' };
    }

    const validated = getFolderSchema.parse({ id });

    // Get user preferences if sort options not provided
    let orderBy: any = { updatedAt: 'desc' };
    if (sortBy && sortOrder) {
      switch (sortBy) {
        case 'name':
          orderBy = { name: sortOrder };
          break;
        case 'createdAt':
          orderBy = { createdAt: sortOrder };
          break;
        case 'updatedAt':
          orderBy = { updatedAt: sortOrder };
          break;
        case 'manual':
          orderBy = { sortOrder: sortOrder };
          break;
      }
    }

    const folder = await prisma.folder.findFirst({
      where: {
        id: validated.id,
        userId: session.user.id,
      },
      include: {
        parent: true,
        children: {
          orderBy,
        },
        notes: {
          orderBy,
          include: {
            tags: true,
            category: true,
          },
        },
        _count: {
          select: {
            children: true,
            notes: true,
          },
        },
      },
    });

    if (!folder) {
      return { success: false, error: '文件夹不存在或无权访问' };
    }

    return { success: true, data: folder };
  } catch (error) {
    console.error('Get folder error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '获取文件夹失败',
    };
  }
}

/**
 * Get all folders for the current user
 */
export async function getFolders(sortBy?: string, sortOrder?: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: '未授权' };
    }

    // Determine order by
    let orderBy: any = { name: 'asc' };
    if (sortBy && sortOrder) {
      switch (sortBy) {
        case 'name':
          orderBy = { name: sortOrder };
          break;
        case 'createdAt':
          orderBy = { createdAt: sortOrder };
          break;
        case 'updatedAt':
          orderBy = { updatedAt: sortOrder };
          break;
        case 'manual':
          orderBy = { sortOrder: sortOrder };
          break;
      }
    }

    const folders = await prisma.folder.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        Folder: true, // parent folder
        _count: {
          select: {
            other_Folder: true, // children count
            Note: true, // notes count
          },
        },
      },
      orderBy,
    });

    // Transform to expected format
    const transformedFolders = folders.map(folder => ({
      ...folder,
      parent: folder.Folder,
      _count: {
        children: folder._count.other_Folder,
        notes: folder._count.Note,
      },
    }));

    return { success: true, data: transformedFolders };
  } catch (error) {
    console.error('Get folders error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '获取文件夹列表失败',
    };
  }
}

/**
 * Move a folder to a new parent
 * Validates: Requirements 4.4, 4.5
 */
export async function moveFolder(folderId: string, newParentId: string | null) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: '未授权' };
    }

    // Verify the folder exists and belongs to user
    const folder = await prisma.folder.findFirst({
      where: {
        id: folderId,
        userId: session.user.id,
      },
    });

    if (!folder) {
      return { success: false, error: '文件夹不存在或无权访问' };
    }

    // If newParentId is provided, verify it exists and belongs to user
    if (newParentId) {
      const newParent = await prisma.folder.findFirst({
        where: {
          id: newParentId,
          userId: session.user.id,
        },
      });

      if (!newParent) {
        return { success: false, error: '目标文件夹不存在或无权访问' };
      }

      // Prevent moving folder into itself
      if (newParentId === folderId) {
        return { success: false, error: '不能将文件夹移动到自身' };
      }

      // Check for circular reference
      const wouldCreateCircle = await checkCircularReference(
        folderId,
        newParentId
      );
      if (wouldCreateCircle) {
        return { success: false, error: '不能将文件夹移动到其子文件夹中' };
      }
    }

    // Perform the move
    const updatedFolder = await prisma.folder.update({
      where: { id: folderId },
      data: {
        parentId: newParentId,
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
    });

    revalidatePath('/notes');
    revalidatePath('/folders');

    return { success: true, data: updatedFolder };
  } catch (error) {
    console.error('Move folder error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '移动文件夹失败',
    };
  }
}

/**
 * Move a note to a folder
 * Validates: Requirements 4.4, 4.5
 */
export async function moveNoteToFolder(noteId: string, folderId: string | null) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: '未授权' };
    }

    // Verify the note exists and user has access
    const note = await prisma.note.findFirst({
      where: {
        id: noteId,
        OR: [
          { userId: session.user.id },
          { ownerId: session.user.id },
          {
            Collaborator: {
              some: {
                userId: session.user.id,
                role: 'editor',
              },
            },
          },
        ],
      },
    });

    if (!note) {
      return { success: false, error: '笔记不存在或无权访问' };
    }

    // If folderId is provided, verify it exists and belongs to user
    if (folderId) {
      const folder = await prisma.folder.findFirst({
        where: {
          id: folderId,
          userId: session.user.id,
        },
      });

      if (!folder) {
        return { success: false, error: '目标文件夹不存在或无权访问' };
      }
    }

    // Perform the move
    const updatedNote = await prisma.note.update({
      where: { id: noteId },
      data: {
        folderId: folderId,
      },
      include: {
        folder: true,
        tags: true,
        category: true,
      },
    });

    revalidatePath('/notes');
    revalidatePath('/folders');
    if (folderId) {
      revalidatePath(`/folders/${folderId}`);
    }

    return { success: true, data: updatedNote };
  } catch (error) {
    console.error('Move note error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '移动笔记失败',
    };
  }
}

/**
 * Helper function to check for circular references
 */
async function checkCircularReference(
  folderId: string,
  newParentId: string
): Promise<boolean> {
  let currentId: string | null = newParentId;

  while (currentId) {
    if (currentId === folderId) {
      return true; // Circular reference detected
    }

    const folder = await prisma.folder.findUnique({
      where: { id: currentId },
      select: { parentId: true },
    });

    currentId = folder?.parentId || null;
  }

  return false;
}
