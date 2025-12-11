/**
 * Permission utilities for server-side permission checks
 */

import { prisma } from '@/lib/prisma'

export type NoteRole = 'owner' | 'editor' | 'viewer' | null

export interface NotePermission {
  hasAccess: boolean
  canEdit: boolean
  canDelete: boolean
  canShare: boolean
  role: NoteRole
}

/**
 * Check user's permission for a note
 */
export async function checkNotePermissions(
  noteId: string,
  userId: string
): Promise<NotePermission> {
  try {
    const note = await prisma.note.findUnique({
      where: { id: noteId },
      select: {
        ownerId: true,
        userId: true,
        isPublic: true,
        Collaborator: {
          where: { userId },
          select: { role: true },
        },
      },
    })

    if (!note) {
      return {
        hasAccess: false,
        canEdit: false,
        canDelete: false,
        canShare: false,
        role: null,
      }
    }

    // Owner has full permissions
    if (note.ownerId === userId) {
      return {
        hasAccess: true,
        canEdit: true,
        canDelete: true,
        canShare: true,
        role: 'owner',
      }
    }

    // Creator has full permissions (if different from owner)
    if (note.userId === userId) {
      return {
        hasAccess: true,
        canEdit: true,
        canDelete: true,
        canShare: true,
        role: 'owner',
      }
    }

    // Check collaborator role
    const collaborator = note.Collaborator[0]
    if (collaborator) {
      const isEditor = collaborator.role === 'editor'
      return {
        hasAccess: true,
        canEdit: isEditor,
        canDelete: false,
        canShare: false,
        role: collaborator.role as 'editor' | 'viewer',
      }
    }

    // Public notes are viewable by anyone
    if (note.isPublic) {
      return {
        hasAccess: true,
        canEdit: false,
        canDelete: false,
        canShare: false,
        role: 'viewer',
      }
    }

    // No access
    return {
      hasAccess: false,
      canEdit: false,
      canDelete: false,
      canShare: false,
      role: null,
    }
  } catch (error) {
    console.error('Error checking note permissions:', error)
    return {
      hasAccess: false,
      canEdit: false,
      canDelete: false,
      canShare: false,
      role: null,
    }
  }
}

/**
 * Require specific permission or throw error
 */
export async function requirePermission(
  noteId: string,
  userId: string,
  requiredPermission: 'view' | 'edit' | 'delete' | 'share'
): Promise<void> {
  const permissions = await checkNotePermissions(noteId, userId)

  switch (requiredPermission) {
    case 'view':
      if (!permissions.hasAccess) {
        throw new Error('You do not have permission to view this note')
      }
      break
    case 'edit':
      if (!permissions.canEdit) {
        throw new Error('You do not have permission to edit this note')
      }
      break
    case 'delete':
      if (!permissions.canDelete) {
        throw new Error('You do not have permission to delete this note')
      }
      break
    case 'share':
      if (!permissions.canShare) {
        throw new Error('You do not have permission to share this note')
      }
      break
  }
}

/**
 * Check if user is note owner
 */
export async function isNoteOwner(noteId: string, userId: string): Promise<boolean> {
  const note = await prisma.note.findUnique({
    where: { id: noteId },
    select: { ownerId: true, userId: true },
  })

  if (!note) {
    return false
  }

  return note.ownerId === userId || note.userId === userId
}

/**
 * Get user's role on a note
 */
export async function getNoteRole(noteId: string, userId: string): Promise<NoteRole> {
  const permissions = await checkNotePermissions(noteId, userId)
  return permissions.role
}
