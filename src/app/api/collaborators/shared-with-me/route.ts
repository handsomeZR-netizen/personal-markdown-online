/**
 * API route to get notes shared with the current user
 * Shows notes where the user is a collaborator (not owner)
 */

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all collaborations for this user
    const collaborations = await prisma.collaborator.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    if (collaborations.length === 0) {
      return NextResponse.json({ notes: [] })
    }

    // Get note IDs
    const noteIds = collaborations.map((c) => c.noteId)

    // Get notes
    const notes = await prisma.note.findMany({
      where: {
        id: { in: noteIds },
      },
      select: {
        id: true,
        title: true,
        content: true,
        summary: true,
        updatedAt: true,
        createdAt: true,
        ownerId: true,
      },
    })

    // Get owner info
    const ownerIds = [...new Set(notes.map((n) => n.ownerId))]
    const owners = await prisma.user.findMany({
      where: { id: { in: ownerIds } },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        color: true,
      },
    })
    const ownerMap = new Map(owners.map((o) => [o.id, o]))

    // Create collaboration map
    const collabMap = new Map(collaborations.map((c) => [c.noteId, c]))

    // Transform the data
    const sharedNotes = notes.map((note) => {
      const collab = collabMap.get(note.id)
      return {
        id: note.id,
        title: note.title,
        content: note.content,
        summary: note.summary,
        updatedAt: note.updatedAt,
        createdAt: note.createdAt,
        role: collab?.role || 'viewer',
        sharedAt: collab?.createdAt || note.createdAt,
        owner: ownerMap.get(note.ownerId) || {
          id: note.ownerId,
          name: null,
          email: 'unknown',
          avatar: null,
          color: null,
        },
      }
    })

    return NextResponse.json({ notes: sharedNotes })
  } catch (error) {
    console.error('Error fetching shared notes:', error)
    // Return empty array instead of error to avoid breaking the UI
    return NextResponse.json({ notes: [] })
  }
}
