import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { getNoteVersion } from "@/lib/versions/version-manager"

/**
 * GET /api/notes/[id]/versions/[versionId]
 * Get a specific version
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; versionId: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const result = await getNoteVersion(params.versionId, session.user.id)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === "Access denied" ? 403 : 404 }
      )
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error("Failed to get note version:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
