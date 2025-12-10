import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { getNoteVersions } from "@/lib/versions/version-manager"

/**
 * GET /api/notes/[id]/versions
 * Get all versions for a note
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: noteId } = await params;
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const result = await getNoteVersions(noteId, session.user.id)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error("Failed to get note versions:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
