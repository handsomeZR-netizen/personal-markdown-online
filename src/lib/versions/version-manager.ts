/**
 * Version Manager
 * Handles note version history operations
 */

import { prisma } from "@/lib/prisma"

const MAX_VERSIONS_PER_NOTE = 50

export interface NoteVersion {
  id: string
  noteId: string
  content: string
  title: string
  userId: string
  createdAt: Date
}

export interface NoteVersionWithUser extends NoteVersion {
  userName?: string | null
  userEmail?: string
}

/**
 * Save a new version of a note
 * Automatically limits to the most recent 50 versions
 */
export async function saveNoteVersion(
  noteId: string,
  title: string,
  content: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Create new version
    await prisma.noteVersion.create({
      data: {
        noteId,
        title,
        content,
        userId,
      },
    })

    // Get count of versions for this note
    const versionCount = await prisma.noteVersion.count({
      where: { noteId },
    })

    // If we exceed the limit, delete the oldest versions
    if (versionCount > MAX_VERSIONS_PER_NOTE) {
      const versionsToDelete = versionCount - MAX_VERSIONS_PER_NOTE

      // Get the oldest versions to delete
      const oldestVersions = await prisma.noteVersion.findMany({
        where: { noteId },
        orderBy: { createdAt: 'asc' },
        take: versionsToDelete,
        select: { id: true },
      })

      // Delete them
      await prisma.noteVersion.deleteMany({
        where: {
          id: {
            in: oldestVersions.map(v => v.id),
          },
        },
      })
    }

    return { success: true }
  } catch (error) {
    console.error('Failed to save note version:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Get all versions for a note
 */
export async function getNoteVersions(
  noteId: string,
  userId: string
): Promise<{ success: boolean; data?: NoteVersionWithUser[]; error?: string }> {
  try {
    // First verify the user has access to this note
    const note = await prisma.note.findFirst({
      where: {
        id: noteId,
        OR: [
          { userId },
          { ownerId: userId },
          {
            collaborators: {
              some: { userId },
            },
          },
        ],
      },
    })

    if (!note) {
      return { success: false, error: 'Note not found or access denied' }
    }

    // Get versions
    const versions = await prisma.noteVersion.findMany({
      where: { noteId },
      orderBy: { createdAt: 'desc' },
    })

    // Get user information for each version
    const versionsWithUsers = await Promise.all(
      versions.map(async (version) => {
        const user = await prisma.user.findUnique({
          where: { id: version.userId },
          select: { id: true, name: true, email: true },
        })
        
        return {
          ...version,
          userName: user?.name,
          userEmail: user?.email || '',
        }
      })
    )

    return { success: true, data: versionsWithUsers }
  } catch (error) {
    console.error('Failed to get note versions:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Get a specific version
 */
export async function getNoteVersion(
  versionId: string,
  userId: string
): Promise<{ success: boolean; data?: NoteVersionWithUser; error?: string }> {
  try {
    const version = await prisma.noteVersion.findUnique({
      where: { id: versionId },
      include: {
        note: {
          select: {
            userId: true,
            ownerId: true,
            collaborators: {
              select: { userId: true },
            },
          },
        },
      },
    })

    if (!version) {
      return { success: false, error: 'Version not found' }
    }

    // Check access
    const hasAccess = 
      version.note.userId === userId ||
      version.note.ownerId === userId ||
      version.note.collaborators.some(c => c.userId === userId)

    if (!hasAccess) {
      return { success: false, error: 'Access denied' }
    }

    // Get user information
    const user = await prisma.user.findUnique({
      where: { id: version.userId },
      select: { id: true, name: true, email: true },
    })

    const versionWithUser = {
      ...version,
      userName: user?.name,
      userEmail: user?.email || '',
    }

    return { success: true, data: versionWithUser }
  } catch (error) {
    console.error('Failed to get note version:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Restore a note to a specific version
 * Creates a new version with the restored content
 */
export async function restoreNoteVersion(
  noteId: string,
  versionId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get the version to restore
    const versionResult = await getNoteVersion(versionId, userId)
    if (!versionResult.success || !versionResult.data) {
      return { success: false, error: versionResult.error || 'Version not found' }
    }

    const version = versionResult.data

    // Verify the version belongs to this note
    if (version.noteId !== noteId) {
      return { success: false, error: 'Version does not belong to this note' }
    }

    // Check if user has edit permission
    const note = await prisma.note.findFirst({
      where: {
        id: noteId,
        OR: [
          { userId },
          { ownerId: userId },
          {
            collaborators: {
              some: {
                userId,
                role: 'editor',
              },
            },
          },
        ],
      },
    })

    if (!note) {
      return { success: false, error: 'Note not found or insufficient permissions' }
    }

    // Save current state as a version before restoring
    await saveNoteVersion(noteId, note.title, note.content, userId)

    // Update the note with the restored content
    await prisma.note.update({
      where: { id: noteId },
      data: {
        title: version.title,
        content: version.content,
        updatedAt: new Date(),
      },
    })

    // Create a new version for the restore action
    await saveNoteVersion(noteId, version.title, version.content, userId)

    return { success: true }
  } catch (error) {
    console.error('Failed to restore note version:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Delete all versions for a note (used when note is deleted)
 */
export async function deleteNoteVersions(noteId: string): Promise<void> {
  try {
    await prisma.noteVersion.deleteMany({
      where: { noteId },
    })
  } catch (error) {
    console.error('Failed to delete note versions:', error)
  }
}
