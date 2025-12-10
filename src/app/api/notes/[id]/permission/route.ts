/**
 * API route for checking note permissions
 * Returns whether the user has access and can edit the note
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { checkNotePermission } from '@/lib/actions/collaborators'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: noteId } = await params;
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { hasAccess: false, canEdit: false, role: null },
        { status: 401 }
      )
    }

    const permission = await checkNotePermission(noteId, session.user.id)

    return NextResponse.json(permission)
  } catch (error) {
    console.error('Error checking note permission:', error)
    return NextResponse.json(
      { error: 'Failed to check permission' },
      { status: 500 }
    )
  }
}
