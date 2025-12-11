/**
 * Server actions for collaborator management
 */

'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import {
  addCollaboratorSchema,
  removeCollaboratorSchema,
  updateCollaboratorRoleSchema,
  type AddCollaboratorInput,
  type RemoveCollaboratorInput,
  type UpdateCollaboratorRoleInput,
} from '@/lib/validations/collaborators'
import crypto from 'crypto'

/**
 * Add a collaborator to a note
 */
export async function addCollaborator(input: AddCollaboratorInput) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: 'Unauthorized' }
    }

    const validated = addCollaboratorSchema.parse(input)

    // Check if user is the note owner
    const note = await prisma.note.findUnique({
      where: { id: validated.noteId },
      select: { ownerId: true, title: true },
    })

    if (!note) {
      return { error: 'Note not found' }
    }

    if (note.ownerId !== session.user.id) {
      return { error: 'Only the note owner can add collaborators' }
    }

    // Find user by email
    const targetUser = await prisma.user.findUnique({
      where: { email: validated.email },
      select: { id: true, name: true, email: true, avatar: true, color: true },
    })

    if (!targetUser) {
      return { error: 'User not found with this email' }
    }

    // Check if user is already a collaborator
    const existingCollaborator = await prisma.collaborator.findUnique({
      where: {
        noteId_userId: {
          noteId: validated.noteId,
          userId: targetUser.id,
        },
      },
    })

    if (existingCollaborator) {
      return { error: 'User is already a collaborator' }
    }

    // Don't allow adding the owner as a collaborator
    if (targetUser.id === note.ownerId) {
      return { error: 'Cannot add the note owner as a collaborator' }
    }

    // Create collaborator
    const collaborator = await prisma.collaborator.create({
      data: {
        id: crypto.randomUUID(),
        noteId: validated.noteId,
        userId: targetUser.id,
        role: validated.role,
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            color: true,
          },
        },
      },
    })

    // Transform to match expected format
    const transformedCollaborator = {
      ...collaborator,
      user: collaborator.User,
    }

    // Revalidate paths
    revalidatePath(`/notes/${validated.noteId}`)
    revalidatePath(`/notes/${validated.noteId}/edit`)

    return { success: true, collaborator: transformedCollaborator }
  } catch (error) {
    console.error('Error adding collaborator:', error)
    return { error: 'Failed to add collaborator' }
  }
}

/**
 * Remove a collaborator from a note
 */
export async function removeCollaborator(input: RemoveCollaboratorInput) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: 'Unauthorized' }
    }

    const validated = removeCollaboratorSchema.parse(input)

    // Check if user is the note owner
    const note = await prisma.note.findUnique({
      where: { id: validated.noteId },
      select: { ownerId: true },
    })

    if (!note) {
      return { error: 'Note not found' }
    }

    if (note.ownerId !== session.user.id) {
      return { error: 'Only the note owner can remove collaborators' }
    }

    // Check if collaborator exists
    const collaborator = await prisma.collaborator.findUnique({
      where: {
        noteId_userId: {
          noteId: validated.noteId,
          userId: validated.userId,
        },
      },
    })

    if (!collaborator) {
      return { error: 'Collaborator not found' }
    }

    // Delete collaborator
    await prisma.collaborator.delete({
      where: {
        noteId_userId: {
          noteId: validated.noteId,
          userId: validated.userId,
        },
      },
    })

    // Revalidate paths
    revalidatePath(`/notes/${validated.noteId}`)
    revalidatePath(`/notes/${validated.noteId}/edit`)

    return { success: true }
  } catch (error) {
    console.error('Error removing collaborator:', error)
    return { error: 'Failed to remove collaborator' }
  }
}

/**
 * Update a collaborator's role
 */
export async function updateCollaboratorRole(input: UpdateCollaboratorRoleInput) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: 'Unauthorized' }
    }

    const validated = updateCollaboratorRoleSchema.parse(input)

    // Check if user is the note owner
    const note = await prisma.note.findUnique({
      where: { id: validated.noteId },
      select: { ownerId: true },
    })

    if (!note) {
      return { error: 'Note not found' }
    }

    if (note.ownerId !== session.user.id) {
      return { error: 'Only the note owner can update collaborator roles' }
    }

    // Update collaborator role
    const collaborator = await prisma.collaborator.update({
      where: {
        noteId_userId: {
          noteId: validated.noteId,
          userId: validated.userId,
        },
      },
      data: {
        role: validated.role,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            color: true,
          },
        },
      },
    })

    // Revalidate paths
    revalidatePath(`/notes/${validated.noteId}`)
    revalidatePath(`/notes/${validated.noteId}/edit`)

    return { success: true, collaborator }
  } catch (error) {
    console.error('Error updating collaborator role:', error)
    return { error: 'Failed to update collaborator role' }
  }
}

/**
 * Get all collaborators for a note
 */
export async function getCollaborators(noteId: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: 'Unauthorized' }
    }

    // Check if user has access to this note
    const note = await prisma.note.findUnique({
      where: { id: noteId },
      select: {
        id: true,
        ownerId: true,
        userId: true,
        Collaborator: {
          where: { userId: session.user.id },
        },
      },
    })

    if (!note) {
      return { error: 'Note not found' }
    }

    // User must be owner, creator, or existing collaborator
    const hasAccess =
      note.ownerId === session.user.id ||
      note.userId === session.user.id ||
      note.Collaborator.length > 0

    if (!hasAccess) {
      return { error: 'Access denied' }
    }

    // Get all collaborators with user details
    const collaborators = await prisma.collaborator.findMany({
      where: { noteId },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            color: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    // Transform to match expected format
    const transformedCollaborators = collaborators.map((c) => ({
      ...c,
      user: c.User,
    }))

    return { success: true, collaborators: transformedCollaborators }
  } catch (error) {
    console.error('Error getting collaborators:', error)
    return { error: 'Failed to get collaborators' }
  }
}

/**
 * Check if user has permission to edit a note
 */
export async function checkNotePermission(noteId: string, userId: string) {
  try {
    const note = await prisma.note.findUnique({
      where: { id: noteId },
      select: {
        ownerId: true,
        userId: true,
        Collaborator: {
          where: { userId },
          select: { role: true },
        },
      },
    })

    if (!note) {
      return { hasAccess: false, canEdit: false, role: null }
    }

    // Owner and creator have full access
    if (note.ownerId === userId || note.userId === userId) {
      return { hasAccess: true, canEdit: true, role: 'owner' }
    }

    // Check collaborator role
    const collaborator = note.Collaborator[0]
    if (collaborator) {
      return {
        hasAccess: true,
        canEdit: collaborator.role === 'editor',
        role: collaborator.role,
      }
    }

    return { hasAccess: false, canEdit: false, role: null }
  } catch (error) {
    console.error('Error checking note permission:', error)
    return { hasAccess: false, canEdit: false, role: null }
  }
}
