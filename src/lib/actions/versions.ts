"use server"

import { auth } from "@/auth"
import { 
  getNoteVersions as getVersions,
  getNoteVersion as getVersion,
  restoreNoteVersion as restoreVersion,
} from "@/lib/versions/version-manager"
import { revalidatePath } from "next/cache"
import { isValidCuid } from "@/lib/validation-utils"

type ActionResult<T = void> = 
  | { success: true; data: T }
  | { success: false; error: string }

/**
 * Get all versions for a note
 */
export async function getNoteVersionHistory(noteId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' }
  }

  if (!isValidCuid(noteId)) {
    return { success: false, error: 'Invalid note ID' }
  }

  return await getVersions(noteId, session.user.id)
}

/**
 * Get a specific version
 */
export async function getVersionById(versionId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' }
  }

  if (!isValidCuid(versionId)) {
    return { success: false, error: 'Invalid version ID' }
  }

  return await getVersion(versionId, session.user.id)
}

/**
 * Restore a note to a specific version
 */
export async function restoreToVersion(
  noteId: string,
  versionId: string
): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' }
  }

  if (!isValidCuid(noteId) || !isValidCuid(versionId)) {
    return { success: false, error: 'Invalid ID' }
  }

  const result = await restoreVersion(noteId, versionId, session.user.id)

  if (result.success) {
    revalidatePath("/dashboard")
    revalidatePath("/notes")
    revalidatePath(`/notes/${noteId}`)
  }

  return result
}
