/**
 * API routes for collaborator management
 * Handles adding, listing, and managing note collaborators
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import {
  addCollaboratorSchema,
  removeCollaboratorSchema,
  updateCollaboratorRoleSchema,
  listCollaboratorsSchema,
} from '@/lib/validations/collaborators'
import { z } from 'zod'
import crypto from 'crypto'

/**
 * GET /api/collaborators?noteId=xxx
 * List all collaborators for a note
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const noteId = searchParams.get('noteId')

    if (!noteId) {
      return NextResponse.json({ error: 'Note ID is required' }, { status: 400 })
    }

    // Validate input
    const validated = listCollaboratorsSchema.parse({ noteId })

    // Check if note exists and user has access
    const note = await prisma.note.findUnique({
      where: { id: validated.noteId },
      select: {
        id: true,
        ownerId: true,
        userId: true,
      },
    })

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }

    // Check if user is a collaborator
    const userCollaboration = await prisma.collaborator.findUnique({
      where: {
        noteId_userId: {
          noteId: validated.noteId,
          userId: session.user.id,
        },
      },
    })

    // User must be owner, creator, or existing collaborator
    const hasAccess =
      note.ownerId === session.user.id ||
      note.userId === session.user.id ||
      userCollaboration !== null

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get all collaborators
    const collaboratorRecords = await prisma.collaborator.findMany({
      where: { noteId: validated.noteId },
      orderBy: { createdAt: 'asc' },
    })

    // Get user details for each collaborator
    const userIds = collaboratorRecords.map((c) => c.userId)
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        color: true,
      },
    })
    const userMap = new Map(users.map((u) => [u.id, u]))

    // Combine collaborator records with user details
    const collaborators = collaboratorRecords.map((c) => ({
      id: c.id,
      noteId: c.noteId,
      userId: c.userId,
      role: c.role,
      createdAt: c.createdAt,
      user: userMap.get(c.userId) || null,
    }))

    return NextResponse.json({ collaborators })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error listing collaborators:', error)
    return NextResponse.json(
      { error: 'Failed to list collaborators' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/collaborators
 * Add a new collaborator to a note
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validated = addCollaboratorSchema.parse(body)

    // Check if user is the note owner
    const note = await prisma.note.findUnique({
      where: { id: validated.noteId },
      select: { ownerId: true },
    })

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }

    if (note.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only the note owner can add collaborators' },
        { status: 403 }
      )
    }

    // Find user by email
    const targetUser = await prisma.user.findUnique({
      where: { email: validated.email },
      select: { id: true, name: true, email: true, avatar: true, color: true },
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found with this email' },
        { status: 404 }
      )
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
      return NextResponse.json(
        { error: 'User is already a collaborator' },
        { status: 400 }
      )
    }

    // Don't allow adding the owner as a collaborator
    if (targetUser.id === note.ownerId) {
      return NextResponse.json(
        { error: 'Cannot add the note owner as a collaborator' },
        { status: 400 }
      )
    }

    // Create collaborator
    const collaborator = await prisma.collaborator.create({
      data: {
        id: crypto.randomUUID(),
        noteId: validated.noteId,
        userId: targetUser.id,
        role: validated.role,
      },
    })

    // Return with user details
    const result = {
      id: collaborator.id,
      noteId: collaborator.noteId,
      userId: collaborator.userId,
      role: collaborator.role,
      createdAt: collaborator.createdAt,
      user: targetUser,
    }

    return NextResponse.json({ collaborator: result }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error adding collaborator:', error)
    return NextResponse.json(
      { error: 'Failed to add collaborator' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/collaborators
 * Remove a collaborator from a note
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validated = removeCollaboratorSchema.parse(body)

    // Check if user is the note owner
    const note = await prisma.note.findUnique({
      where: { id: validated.noteId },
      select: { ownerId: true },
    })

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }

    if (note.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only the note owner can remove collaborators' },
        { status: 403 }
      )
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
      return NextResponse.json({ error: 'Collaborator not found' }, { status: 404 })
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

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error removing collaborator:', error)
    return NextResponse.json(
      { error: 'Failed to remove collaborator' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/collaborators
 * Update a collaborator's role
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validated = updateCollaboratorRoleSchema.parse(body)

    // Check if user is the note owner
    const note = await prisma.note.findUnique({
      where: { id: validated.noteId },
      select: { ownerId: true },
    })

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }

    if (note.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only the note owner can update collaborator roles' },
        { status: 403 }
      )
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
    })

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: collaborator.userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        color: true,
      },
    })

    // Return with user details
    const result = {
      id: collaborator.id,
      noteId: collaborator.noteId,
      userId: collaborator.userId,
      role: collaborator.role,
      createdAt: collaborator.createdAt,
      user,
    }

    return NextResponse.json({ collaborator: result })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error updating collaborator role:', error)
    return NextResponse.json(
      { error: 'Failed to update collaborator role' },
      { status: 500 }
    )
  }
}
