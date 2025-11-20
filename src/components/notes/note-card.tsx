import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit, Trash2 } from "lucide-react"
import { deleteNote } from "@/lib/actions/notes"
import { t } from "@/lib/i18n"
import { formatDate } from "@/lib/i18n/date-format"

type NoteCardProps = {
    note: {
        id: string
        title: string
        content: string
        summary?: string | null
        createdAt: Date
        updatedAt: Date
        tags: Array<{ id: string; name: string }>
        category: { id: string; name: string } | null
    }
}

export function NoteCard({ note }: NoteCardProps) {
    // 使用 AI 生成的摘要，如果没有则取前150个字符
    const summary = note.summary || (note.content.length > 150 
        ? note.content.substring(0, 150) + '...' 
        : note.content)

    return (
        <Card className="flex flex-col hover:shadow-lg transition-shadow" role="article" aria-labelledby={`note-title-${note.id}`}>
            <Link href={`/notes/${note.id}`} className="flex-1 cursor-pointer" aria-label={`查看笔记: ${note.title}`}>
                <CardHeader>
                    <CardTitle id={`note-title-${note.id}`} className="truncate">{note.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <p className="text-muted-foreground line-clamp-3 text-sm">
                        {summary}
                    </p>
                    
                    {/* 标签 */}
                    {note.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1" role="list" aria-label="标签">
                            {note.tags.map((tag) => (
                                <Badge key={tag.id} variant="secondary" className="text-xs" role="listitem">
                                    {tag.name}
                                </Badge>
                            ))}
                        </div>
                    )}
                    
                    {/* 分类 */}
                    {note.category && (
                        <Badge variant="outline" className="text-xs w-fit" aria-label={`分类: ${note.category.name}`}>
                            {note.category.name}
                        </Badge>
                    )}
                </CardContent>
            </Link>
            <CardFooter className="flex justify-between items-center pt-4 border-t">
                <div className="flex flex-col text-xs text-muted-foreground" aria-label="笔记时间信息">
                    <time className="hidden sm:inline" dateTime={note.createdAt.toISOString()}>
                        {t('notes.createdAt')}: {formatDate(note.createdAt)}
                    </time>
                    <time dateTime={note.updatedAt.toISOString()}>
                        {t('notes.updatedAt')}: {formatDate(note.updatedAt)}
                    </time>
                </div>
                <div className="flex gap-2" role="group" aria-label="笔记操作">
                    <Link href={`/notes/${note.id}`}>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            title={t('notes.editNote')}
                            aria-label={t('notes.editNote')}
                            className="min-h-[44px] min-w-[44px]"
                        >
                            <Edit className="h-4 w-4" aria-hidden="true" />
                        </Button>
                    </Link>
                    <form action={async () => {
                        "use server"
                        await deleteNote(note.id)
                    }}>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive min-h-[44px] min-w-[44px]"
                            title={t('notes.deleteNote')}
                            aria-label={t('notes.deleteNote')}
                        >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </Button>
                    </form>
                </div>
            </CardFooter>
        </Card>
    )
}
