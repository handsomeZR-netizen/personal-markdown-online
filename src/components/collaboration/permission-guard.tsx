/**
 * PermissionGuard component
 * Displays permission denied messages and enforces access control
 */

'use client'

import { ReactNode } from 'react'
import { useNotePermission } from '@/hooks/use-note-permission'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { ShieldAlertIcon, EyeIcon } from 'lucide-react'

interface PermissionGuardProps {
  noteId: string
  requireEdit?: boolean
  children: ReactNode
  fallback?: ReactNode
}

export function PermissionGuard({
  noteId,
  requireEdit = false,
  children,
  fallback,
}: PermissionGuardProps) {
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
      fallback || (
        <Alert variant="destructive">
          <ShieldAlertIcon className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You don't have permission to view this note. Please contact the note owner
            to request access.
          </AlertDescription>
        </Alert>
      )
    )
  }

  if (requireEdit && !canEdit) {
    return (
      fallback || (
        <Alert>
          <EyeIcon className="h-4 w-4" />
          <AlertTitle>View Only</AlertTitle>
          <AlertDescription>
            You have viewer access to this note. You can read the content but cannot
            make changes. Contact the note owner to request editor access.
          </AlertDescription>
        </Alert>
      )
    )
  }

  return <>{children}</>
}

/**
 * Hook-based permission check for inline usage
 */
export function usePermissionCheck(noteId: string) {
  return useNotePermission(noteId)
}
