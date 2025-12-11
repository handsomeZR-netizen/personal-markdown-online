'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { SortBy, SortOrder } from '@/lib/sorting';

/**
 * Get user's sorting preferences
 */
export async function getUserPreferences() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const preferences = await prisma.userPreference.findUnique({
    where: { userId: session.user.id },
  });

  return preferences || {
    sortBy: 'updatedAt' as SortBy,
    sortOrder: 'desc' as SortOrder,
  };
}

/**
 * Update user's sorting preferences
 */
export async function updateUserPreferences(
  sortBy: SortBy,
  sortOrder: SortOrder
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const preferences = await prisma.userPreference.upsert({
    where: { userId: session.user.id },
    update: {
      sortBy,
      sortOrder,
    },
    create: {
      userId: session.user.id,
      sortBy,
      sortOrder,
    },
  });

  return preferences;
}

/**
 * Update sort order for a folder
 */
export async function updateFolderSortOrder(folderId: string, sortOrder: number) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  // Verify ownership
  const folder = await prisma.folder.findFirst({
    where: {
      id: folderId,
      userId: session.user.id,
    },
  });

  if (!folder) {
    throw new Error('Folder not found or unauthorized');
  }

  const updated = await prisma.folder.update({
    where: { id: folderId },
    data: { sortOrder },
  });

  return updated;
}

/**
 * Update sort order for a note
 */
export async function updateNoteSortOrder(noteId: string, sortOrder: number) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  // Verify ownership or collaboration
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
    throw new Error('Note not found or unauthorized');
  }

  const updated = await prisma.note.update({
    where: { id: noteId },
    data: { sortOrder },
  });

  return updated;
}

/**
 * Batch update sort orders for folders
 */
export async function batchUpdateFolderSortOrders(
  updates: Array<{ id: string; sortOrder: number }>
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  // Verify all folders belong to the user
  const folderIds = updates.map((u) => u.id);
  const folders = await prisma.folder.findMany({
    where: {
      id: { in: folderIds },
      userId: session.user.id,
    },
  });

  if (folders.length !== folderIds.length) {
    throw new Error('Some folders not found or unauthorized');
  }

  // Perform batch update
  await prisma.$transaction(
    updates.map((update) =>
      prisma.folder.update({
        where: { id: update.id },
        data: { sortOrder: update.sortOrder },
      })
    )
  );

  return { success: true, count: updates.length };
}

/**
 * Batch update sort orders for notes
 */
export async function batchUpdateNoteSortOrders(
  updates: Array<{ id: string; sortOrder: number }>
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  // Verify all notes belong to the user or are editable
  const noteIds = updates.map((u) => u.id);
  const notes = await prisma.note.findMany({
    where: {
      id: { in: noteIds },
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

  if (notes.length !== noteIds.length) {
    throw new Error('Some notes not found or unauthorized');
  }

  // Perform batch update
  await prisma.$transaction(
    updates.map((update) =>
      prisma.note.update({
        where: { id: update.id },
        data: { sortOrder: update.sortOrder },
      })
    )
  );

  return { success: true, count: updates.length };
}
