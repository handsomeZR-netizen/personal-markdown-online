/**
 * Permission-aware editor wrapper
 * Enforces read-only mode for viewers and shows permission messages
 */

'use client'

import { ReactNode } from 'react'
import { useNotePermission } from '@/hooks/use-note-permission'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { EyeIcon, ShieldAlertIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface PermissionAwareEditorProps {
  noteId: string
  children: (props: {
    canEdit: boolean
    role: 'owner' | 'editor' | 'viewer' | null
  }) => ReactNode
}

export function PermissionAwareEditor({
  noteId,
  children,
}: PermissionAwareEditorProps) {
  const { hasAccess, canEdit, role, loading } = useNotePermission(noteId)

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <Alert variant="destructive">
        <ShieldAlertIcon className="h-4 w-4" />
        <AlertTitle>Access Denied</AlertTitle>
        <AlertDescription>
          You don't have permission to view this note. Please contact the note owner
          to request access.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-2">
      {!canEdit && (
        <Alert>
          <EyeIcon className="h-4 w-4" />
          <AlertTitle>View Only Mode</AlertTitle>
          <AlertDescription>
            You have viewer access to this note. You can read the content but cannot
            make changes.
          </AlertDescription>
        </Alert>
      )}
      {children({ canEdit, role })}
    </div>
  )
}

/**
 * Permission badge component
 * Shows the user's role on the note
 */
interface PermissionBadgeProps {
  noteId: string
}

export function PermissionBadge({ noteId }: PermissionBadgeProps) {
  const { role, loading } = useNotePermission(noteId)

  if (loading || !role) {
    return null
  }

  const roleConfig = {
    owner: { label: 'Owner', variant: 'default' as const },
    editor: { label: 'Editor', variant: 'secondary' as const },
    viewer: { label: 'Viewer', variant: 'outline' as const },
  }

  const config = roleConfig[role]

  return (
    <Badge variant={config.variant} className="capitalize">
      {config.label}
    </Badge>
  )
}
