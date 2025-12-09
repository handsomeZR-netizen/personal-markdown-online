/**
 * ShareDialog component for managing note collaborators
 * Allows adding, removing, and updating collaborator roles
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Share2Icon, UserPlusIcon, TrashIcon, Loader2Icon } from 'lucide-react'
import { toast } from 'sonner'
import type { CollaboratorRoleType } from '@/lib/validations/collaborators'
import { PublicShareControls } from './public-share-controls'

interface Collaborator {
  id: string
  role: string
  user: {
    id: string
    name: string | null
    email: string
    avatar: string | null
    color: string | null
  }
  createdAt: Date
}

interface ShareDialogProps {
  noteId: string
  noteTitle: string
  isOwner: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function ShareDialog({ noteId, noteTitle, isOwner, open: controlledOpen, onOpenChange }: ShareDialogProps) {
  const router = useRouter()
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = onOpenChange || setInternalOpen
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [loading, setLoading] = useState(false)
  const [addingCollaborator, setAddingCollaborator] = useState(false)
  
  // Form state
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<CollaboratorRoleType>('viewer')

  // Load collaborators when dialog opens
  useEffect(() => {
    if (open) {
      loadCollaborators()
    }
  }, [open, noteId])

  const loadCollaborators = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/collaborators?noteId=${noteId}`)
      
      if (!response.ok) {
        throw new Error('Failed to load collaborators')
      }

      const data = await response.json()
      setCollaborators(data.collaborators || [])
    } catch (error) {
      console.error('Error loading collaborators:', error)
      toast.error('Failed to load collaborators')
    } finally {
      setLoading(false)
    }
  }

  const handleAddCollaborator = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.trim()) {
      toast.error('Please enter an email address')
      return
    }

    try {
      setAddingCollaborator(true)

      const response = await fetch('/api/collaborators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteId,
          email: email.trim(),
          role,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add collaborator')
      }

      toast.success(`Added ${email} as ${role}`)
      setEmail('')
      setRole('viewer')
      await loadCollaborators()
      router.refresh()
    } catch (error) {
      console.error('Error adding collaborator:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to add collaborator')
    } finally {
      setAddingCollaborator(false)
    }
  }

  const handleRemoveCollaborator = async (userId: string, userName: string | null) => {
    if (!confirm(`Remove ${userName || 'this user'} from collaborators?`)) {
      return
    }

    try {
      const response = await fetch('/api/collaborators', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteId,
          userId,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to remove collaborator')
      }

      toast.success('Collaborator removed')
      await loadCollaborators()
      router.refresh()
    } catch (error) {
      console.error('Error removing collaborator:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to remove collaborator')
    }
  }

  const handleUpdateRole = async (userId: string, newRole: CollaboratorRoleType) => {
    try {
      const response = await fetch('/api/collaborators', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteId,
          userId,
          role: newRole,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update role')
      }

      toast.success('Role updated')
      await loadCollaborators()
      router.refresh()
    } catch (error) {
      console.error('Error updating role:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update role')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2Icon className="mr-2 h-4 w-4" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Share "{noteTitle}"</DialogTitle>
          <DialogDescription>
            {isOwner
              ? 'Invite people to collaborate on this note'
              : 'View collaborators on this note'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Public sharing controls */}
          <PublicShareControls noteId={noteId} isOwner={isOwner} />

          {/* Add collaborator form (only for owner) */}
          {isOwner && (
            <form onSubmit={handleAddCollaborator} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="colleague@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={addingCollaborator}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={role}
                  onValueChange={(value) => setRole(value as CollaboratorRoleType)}
                  disabled={addingCollaborator}
                >
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Viewer (read-only)</SelectItem>
                    <SelectItem value="editor">Editor (can edit)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={addingCollaborator || !email.trim()}
              >
                {addingCollaborator ? (
                  <>
                    <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <UserPlusIcon className="mr-2 h-4 w-4" />
                    Add Collaborator
                  </>
                )}
              </Button>
            </form>
          )}

          {/* Collaborators list */}
          <div className="space-y-2">
            <Label>
              Collaborators ({collaborators.length})
            </Label>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : collaborators.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No collaborators yet
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {collaborators.map((collaborator) => (
                  <div
                    key={collaborator.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className="h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                        style={{
                          backgroundColor: collaborator.user.color || '#6366f1',
                        }}
                      >
                        {collaborator.user.name?.[0]?.toUpperCase() ||
                          collaborator.user.email[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {collaborator.user.name || 'Unknown'}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {collaborator.user.email}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isOwner ? (
                        <>
                          <Select
                            value={collaborator.role}
                            onValueChange={(value) =>
                              handleUpdateRole(
                                collaborator.user.id,
                                value as CollaboratorRoleType
                              )
                            }
                          >
                            <SelectTrigger className="w-[110px] h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="viewer">Viewer</SelectItem>
                              <SelectItem value="editor">Editor</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleRemoveCollaborator(
                                collaborator.user.id,
                                collaborator.user.name
                              )
                            }
                          >
                            <TrashIcon className="h-4 w-4 text-destructive" />
                          </Button>
                        </>
                      ) : (
                        <Badge variant="secondary" className="capitalize">
                          {collaborator.role}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
