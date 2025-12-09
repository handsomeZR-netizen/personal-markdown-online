"use client"

import { useState, useEffect } from "react"
import { formatDistanceToNow } from "date-fns"
import { zhCN } from "date-fns/locale"
import { Clock, User, RotateCcw, Eye, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { getNoteVersionHistory, getVersionById, restoreToVersion } from "@/lib/actions/versions"

interface NoteVersion {
  id: string
  noteId: string
  content: string
  title: string
  userId: string
  createdAt: Date
  userName?: string | null
  userEmail?: string
}

interface VersionHistoryProps {
  noteId: string
  trigger?: React.ReactNode
}

export function VersionHistory({ noteId, trigger }: VersionHistoryProps) {
  const [open, setOpen] = useState(false)
  const [versions, setVersions] = useState<NoteVersion[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedVersion, setSelectedVersion] = useState<NoteVersion | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false)
  const [versionToRestore, setVersionToRestore] = useState<NoteVersion | null>(null)
  const [restoring, setRestoring] = useState(false)

  useEffect(() => {
    if (open) {
      loadVersions()
    }
  }, [open, noteId])

  const loadVersions = async () => {
    setLoading(true)
    try {
      const result = await getNoteVersionHistory(noteId)
      if (result.success && result.data) {
        // Convert date strings to Date objects
        const versionsWithDates = result.data.map(v => ({
          ...v,
          createdAt: new Date(v.createdAt),
        }))
        setVersions(versionsWithDates)
      } else {
        toast.error(result.error || "Failed to load version history")
      }
    } catch (error) {
      toast.error("Failed to load version history")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewVersion = async (version: NoteVersion) => {
    setSelectedVersion(version)
    setPreviewOpen(true)
  }

  const handleRestoreClick = (version: NoteVersion) => {
    setVersionToRestore(version)
    setRestoreDialogOpen(true)
  }

  const handleRestoreConfirm = async () => {
    if (!versionToRestore) return

    setRestoring(true)
    try {
      const result = await restoreToVersion(noteId, versionToRestore.id)
      if (result.success) {
        toast.success("Version restored successfully")
        setRestoreDialogOpen(false)
        setOpen(false)
        // Reload the page to show the restored content
        window.location.reload()
      } else {
        toast.error(result.error || "Failed to restore version")
      }
    } catch (error) {
      toast.error("Failed to restore version")
      console.error(error)
    } finally {
      setRestoring(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="outline" size="sm">
              <Clock className="h-4 w-4 mr-2" />
              Version History
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Version History</DialogTitle>
            <DialogDescription>
              View and restore previous versions of this note. The most recent 50 versions are kept.
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-start gap-3 p-3 border rounded-lg">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No version history yet</p>
              <p className="text-sm mt-1">Versions are created when you make significant changes</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-2">
                {versions.map((version, index) => (
                  <div
                    key={version.id}
                    className="flex items-start gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm truncate">
                          {version.userName || version.userEmail || 'Unknown User'}
                        </p>
                        {index === 0 && (
                          <Badge variant="secondary" className="text-xs">
                            Latest
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-1 truncate">
                        {version.title}
                      </p>
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>
                          {formatDistanceToNow(version.createdAt, {
                            addSuffix: true,
                            locale: zhCN,
                          })}
                        </span>
                        <span className="text-muted-foreground/50">•</span>
                        <span>{version.content.length} characters</span>
                      </div>
                    </div>

                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewVersion(version)}
                        title="View this version"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRestoreClick(version)}
                        title="Restore this version"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Version Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Version Preview</DialogTitle>
            <DialogDescription>
              {selectedVersion && (
                <>
                  Saved {formatDistanceToNow(selectedVersion.createdAt, { addSuffix: true, locale: zhCN })} by{" "}
                  {selectedVersion.userName || selectedVersion.userEmail || 'Unknown User'}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedVersion && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">{selectedVersion.title}</h3>
              </div>
              
              <ScrollArea className="h-[400px] border rounded-lg p-4">
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <pre className="whitespace-pre-wrap font-sans text-sm">
                    {selectedVersion.content}
                  </pre>
                </div>
              </ScrollArea>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setPreviewOpen(false)}>
                  Close
                </Button>
                <Button onClick={() => {
                  setPreviewOpen(false)
                  handleRestoreClick(selectedVersion)
                }}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Restore This Version
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Version?</AlertDialogTitle>
            <AlertDialogDescription>
              This will restore the note to the selected version. The current version will be saved in history before restoring.
              {versionToRestore && (
                <div className="mt-3 p-3 bg-muted rounded-lg text-sm">
                  <p className="font-medium text-foreground mb-1">
                    {versionToRestore.title}
                  </p>
                  <p className="text-muted-foreground">
                    Saved {formatDistanceToNow(versionToRestore.createdAt, { addSuffix: true, locale: zhCN })}
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={restoring}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestoreConfirm} disabled={restoring}>
              {restoring ? "Restoring..." : "Restore"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
