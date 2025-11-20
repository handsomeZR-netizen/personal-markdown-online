"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { deleteNote } from "@/lib/actions/notes"
import { toast } from "sonner"
import { t } from "@/lib/i18n"

interface DeleteNoteIconButtonProps {
  noteId: string
}

export function DeleteNoteIconButton({ noteId }: DeleteNoteIconButtonProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    setIsDeleting(true)
    try {
      const result = await deleteNote(noteId)
      if (result.success) {
        toast.success(t('notes.deleteSuccess'))
        router.refresh()
      } else {
        toast.error(result.error || t('notes.deleteError'))
      }
    } catch (error) {
      toast.error(t('notes.deleteError'))
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-destructive min-h-[44px] min-w-[44px]"
          disabled={isDeleting}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent onClick={(e) => e.stopPropagation()} className="max-w-[90vw] sm:max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>{t('notes.deleteConfirm')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('notes.deleteConfirmDescription')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel className="min-h-[44px] m-0">{t('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 min-h-[44px] m-0"
          >
            {isDeleting ? t('common.loading') : t('common.confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
