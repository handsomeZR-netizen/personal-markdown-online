import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import { getNote, getNotes } from "@/lib/actions/notes"
import { t } from "@/lib/i18n"
import { NoteEditorLazy } from "@/components/notes/note-editor-lazy"

interface EditNotePageProps {
    params: Promise<{ id: string }>
}

export default async function EditNotePage({ params }: EditNotePageProps) {
    const session = await auth()
    
    if (!session?.user?.id) {
        redirect('/login')
    }

    const { id } = await params
    
    // 并行获取当前笔记和最近笔记
    const [note, { notes: allRecentNotes }] = await Promise.all([
        getNote(id),
        getNotes({
            page: 1,
            pageSize: 4, // 获取4篇，排除当前笔记后还有3篇
            sortBy: 'updatedAt',
            sortOrder: 'desc'
        })
    ])

    if (!note) {
        notFound()
    }

    // 排除当前正在编辑的笔记，只显示其他最近笔记
    const recentNotes = allRecentNotes
        .filter(n => n.id !== id)
        .slice(0, 3)
        .map(n => ({
            id: n.id,
            title: n.title,
            updatedAt: n.updatedAt
        }))

    return (
        <div className="container mx-auto p-4 max-w-6xl">
            <h1 className="text-2xl font-bold mb-6">{t('notes.editNote')}</h1>
            <NoteEditorLazy 
                note={{
                    id: note.id,
                    title: note.title,
                    content: note.content,
                    tags: note.tags,
                    categoryId: note.categoryId,
                }} 
                userId={session.user.id}
                recentNotes={recentNotes}
            />
        </div>
    )
}
