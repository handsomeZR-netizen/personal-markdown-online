import { getNote } from "@/lib/actions/notes"
import { NoteEditorLazy } from "@/components/notes/note-editor-lazy"
import { notFound } from "next/navigation"
import { t } from "@/lib/i18n"

export default async function EditNotePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const note = await getNote(id)

    if (!note) {
        notFound()
    }

    return (
        <div className="container mx-auto p-4 max-w-6xl">
            <h1 className="text-2xl font-bold mb-6">{t('notes.editNote')}</h1>
            <NoteEditorLazy note={note} />
        </div>
    )
}
