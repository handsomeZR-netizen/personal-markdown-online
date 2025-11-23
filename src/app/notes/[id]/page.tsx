import { getNote } from "@/lib/actions/notes"
import { notFound } from "next/navigation"
import { MarkdownPreview } from "@/components/notes/markdown-preview"
import { NoteDetailWrapper } from "@/components/notes/note-detail-wrapper"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DeleteNoteButton } from "@/components/notes/delete-note-button"
import { RegenerateSummaryButton } from "@/components/notes/regenerate-summary-button"
import Link from "next/link"
import { Edit, ArrowLeft, Calendar, Tag as TagIcon, FolderOpen, FileText } from "lucide-react"
import { t } from "@/lib/i18n"
import { formatDate } from "@/lib/i18n/date-format"

export default async function NotePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const note = await getNote(id)

    if (!note) {
        notFound()
    }

    return (
        <NoteDetailWrapper noteId={note.id}>
            <div className="container mx-auto p-4 max-w-4xl">
            {/* Header with navigation */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <Link href="/dashboard">
                    <Button variant="ghost" className="min-h-[44px]">
                        <ArrowLeft className="mr-2 h-4 w-4" /> {t('common.back')}
                    </Button>
                </Link>
                <div className="flex gap-2">
                    <Link href={`/notes/${note.id}/edit`} className="flex-1 sm:flex-none">
                        <Button className="w-full sm:w-auto min-h-[44px]">
                            <Edit className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">{t('common.edit')}</span>
                        </Button>
                    </Link>
                    <DeleteNoteButton noteId={note.id} />
                </div>
            </div>

            {/* Note metadata */}
            <div className="mb-6 space-y-4">
                <h1 className="text-3xl font-bold">{note.title}</h1>
                
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{t('notes.createdAt')}: {formatDate(note.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{t('notes.updatedAt')}: {formatDate(note.updatedAt)}</span>
                    </div>
                </div>

                {/* Tags */}
                {note.tags && note.tags.length > 0 && (
                    <div className="flex items-start gap-2">
                        <TagIcon className="h-4 w-4 mt-1 text-muted-foreground" />
                        <div className="flex flex-wrap gap-2">
                            {note.tags.map((tag: { id: string; name: string }) => (
                                <Badge key={tag.id} variant="secondary">
                                    {tag.name}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}

                {/* Category */}
                {note.category && (
                    <div className="flex items-center gap-2">
                        <FolderOpen className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="outline">{note.category.name}</Badge>
                    </div>
                )}

                {/* Summary */}
                {note.summary && (
                    <div className="border-l-4 border-primary pl-4 py-3 bg-muted/30 rounded-r">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium text-muted-foreground">
                                        {t('notes.summary')}
                                    </span>
                                    <Badge variant="secondary" className="text-xs">
                                        AI 生成
                                    </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground italic leading-relaxed">
                                    {note.summary}
                                </p>
                            </div>
                            <RegenerateSummaryButton noteId={note.id} />
                        </div>
                    </div>
                )}
            </div>

            {/* Note content */}
            <article className="prose prose-slate dark:prose-invert max-w-none">
                <MarkdownPreview content={note.content} />
            </article>
        </div>
        </NoteDetailWrapper>
    )
}
