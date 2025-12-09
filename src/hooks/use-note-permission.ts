/**
 * Hook for checking note permissions
 * Determines if the current user can view or edit a note
 */

'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface NotePermission {
  hasAccess: boolean
  canEdit: boolean
  role: 'owner' | 'editor' | 'viewer' | null
  loading: boolean
}

export function useNotePermission(noteId: string): NotePermission {
  const { data: session } = useSession()
  const [permission, setPermission] = useState<NotePermission>({
    hasAccess: false,
    canEdit: false,
    role: null,
    loading: true,
  })

  useEffect(() => {
    if (!session?.user?.id || !noteId) {
      setPermission({
        hasAccess: false,
        canEdit: false,
        role: null,
        loading: false,
      })
      return
    }

    const checkPermission = async () => {
      try {
        const response = await fetch(`/api/notes/${noteId}/permission`)
        
        if (!response.ok) {
          throw new Error('Failed to check permission')
        }

        const data = await response.json()
        setPermission({
          hasAccess: data.hasAccess,
          canEdit: data.canEdit,
          role: data.role,
          loading: false,
        })
      } catch (error) {
        console.error('Error checking permission:', error)
        setPermission({
          hasAccess: false,
          canEdit: false,
          role: null,
          loading: false,
        })
      }
    }

    checkPermission()
  }, [noteId, session?.user?.id])

  return permission
}
