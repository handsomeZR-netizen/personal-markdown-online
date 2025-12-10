/**
 * Storage Cleanup API Route
 * DELETE /api/storage/cleanup - Delete selected notes and images
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getStorageAdapter } from '@/lib/storage/storage-adapter';

export async function DELETE(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await request.json();
    const { noteIds, imagePaths } = body;

    let deletedNotes = 0;
    let deletedImages = 0;

    // Delete notes
    if (noteIds && Array.isArray(noteIds) && noteIds.length > 0) {
      // Verify ownership before deleting
      const notes = await prisma.note.findMany({
        where: {
          id: { in: noteIds },
          ownerId: userId,
        },
        select: { id: true },
      });

      const ownedNoteIds = notes.map((note) => note.id);

      if (ownedNoteIds.length > 0) {
        // Delete notes (cascade will handle related data)
        const result = await prisma.note.deleteMany({
          where: {
            id: { in: ownedNoteIds },
            ownerId: userId,
          },
        });

        deletedNotes = result.count;

        // Also delete associated images from storage
        const storageAdapter = getStorageAdapter();
        for (const noteId of ownedNoteIds) {
          try {
            const paths = await storageAdapter.list(noteId);

            if (paths && paths.length > 0) {
              for (const path of paths) {
                try {
                  await storageAdapter.delete(path);
                } catch (error) {
                  console.warn(`Error deleting image ${path}:`, error);
                }
              }
            }
          } catch (error) {
            console.warn(`Error deleting images for note ${noteId}:`, error);
          }
        }
      }
    }

    // Delete images
    if (imagePaths && Array.isArray(imagePaths) && imagePaths.length > 0) {
      // Verify ownership by checking if the note belongs to the user
      const validPaths: string[] = [];

      for (const path of imagePaths) {
        const noteId = path.split('/')[0];
        const note = await prisma.note.findFirst({
          where: {
            id: noteId,
            ownerId: userId,
          },
        });

        if (note) {
          validPaths.push(path);
        }
      }

      if (validPaths.length > 0) {
        const storageAdapter = getStorageAdapter();
        
        for (const path of validPaths) {
          try {
            await storageAdapter.delete(path);
            deletedImages++;
          } catch (error) {
            console.error(`Error deleting image ${path}:`, error);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      deletedNotes,
      deletedImages,
    });
  } catch (error) {
    console.error('Error cleaning up storage:', error);
    return NextResponse.json(
      { error: 'Failed to cleanup storage' },
      { status: 500 }
    );
  }
}
