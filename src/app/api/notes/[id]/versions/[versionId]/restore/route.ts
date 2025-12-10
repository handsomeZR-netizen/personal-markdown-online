import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { restoreNoteVersion } from "@/lib/versions/version-manager"
import { revalidatePath } from "next/cache"

/**
 * POST /api/notes/[id]/versions/[versionId]/restore
 * Restore a note to a specific version
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  try {
    const { id: noteId, versionId } = await params;
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const result = await restoreNoteVersion(noteId, versionId, session.user.id)

    if (!result.success) {
      const status = result.error?.includes("permission") ? 403 : 400
      return NextResponse.json(
        { error: result.error },
        { status }
      )
    }

    // Revalidate paths
    revalidatePath("/dashboard")
    revalidatePath("/notes")
    revalidatePath(`/notes/${noteId}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to restore note version:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
