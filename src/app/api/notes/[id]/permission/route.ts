/**
 * API route for checking note permissions
 * Returns whether the user has access and can edit the note
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { checkNotePermission } from '@/lib/actions/collaborators'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { hasAccess: false, canEdit: false, role: null },
        { status: 401 }
      )
    }

    const noteId = params.id
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
