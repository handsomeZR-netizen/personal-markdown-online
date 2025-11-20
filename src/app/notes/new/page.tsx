import { NoteEditorLazy } from "@/components/notes/note-editor-lazy"
import { t } from "@/lib/i18n"

export default function NewNotePage() {
    return (
        <div className="container mx-auto p-4 max-w-6xl">
            <h1 className="text-2xl font-bold mb-6">{t('notes.createNote')}</h1>
            <NoteEditorLazy />
        </div>
    )
}
