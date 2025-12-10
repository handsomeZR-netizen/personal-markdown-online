import { NoteEditorLazy } from "@/components/notes/note-editor-lazy"
import { t } from "@/lib/i18n"
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function NewNotePage() {
    const session = await auth()
    
    if (!session?.user?.id) {
        redirect('/login')
    }

    return (
        <div className="container mx-auto p-4 max-w-6xl">
            <h1 className="text-2xl font-bold mb-6">{t('notes.createNote')}</h1>
            <NoteEditorLazy userId={session.user.id} />
        </div>
    )
}
