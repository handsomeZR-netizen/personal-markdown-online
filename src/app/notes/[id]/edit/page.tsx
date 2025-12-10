"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { NoteEditorLazy } from "@/components/notes/note-editor-lazy"
import { notFound, useParams, useRouter } from "next/navigation"
import { t } from "@/lib/i18n"
import { offlineStorageService } from "@/lib/offline/offline-storage-service"
import { getNote } from "@/lib/actions/notes"
import { Loader2 } from "lucide-react"
import { useNetworkStatus } from "@/contexts/network-status-context"

type Note = {
    id: string
    title: string
    content: string
    tags?: Array<{ id: string; name: string }>
    categoryId?: string | null
}

export default function EditNotePage() {
    const params = useParams()
    const router = useRouter()
    const id = params.id as string
    const { isOnline } = useNetworkStatus()
    const { data: session, status } = useSession()
    const [note, setNote] = useState<Note | null>(null)
    const [loading, setLoading] = useState(true)
    const [notFoundError, setNotFoundError] = useState(false)

    // 如果未登录，重定向到登录页
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login')
        }
    }, [status, router])

    useEffect(() => {
        async function loadNote() {
            if (status !== 'authenticated') return
            
            try {
                setLoading(true)
                
                // 优先从本地加载
                const localNote = await offlineStorageService.getNote(id)
                
                if (localNote) {
                    // 转换本地笔记格式为编辑器需要的格式
                    setNote({
                        id: localNote.id,
                        title: localNote.title,
                        content: localNote.content,
                        tags: localNote.tags.map((name, index) => ({ 
                            id: `tag-${index}`, 
                            name 
                        })),
                        categoryId: localNote.categoryId || null,
                    })
                    setLoading(false)
                    return
                }
                
                // 如果本地没有且在线，从服务器获取
                if (isOnline) {
                    const serverNote = await getNote(id)
                    if (serverNote) {
                        setNote(serverNote)
                    } else {
                        setNotFoundError(true)
                    }
                } else {
                    // 离线且本地没有数据
                    setNotFoundError(true)
                }
            } catch (error) {
                console.error('加载笔记失败:', error)
                setNotFoundError(true)
            } finally {
                setLoading(false)
            }
        }

        loadNote()
    }, [id, isOnline, status])

    if (status === 'loading' || loading) {
        return (
            <div className="container mx-auto p-4 max-w-6xl">
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </div>
        )
    }

    if (notFoundError || !note) {
        notFound()
    }

    return (
        <div className="container mx-auto p-4 max-w-6xl">
            <h1 className="text-2xl font-bold mb-6">{t('notes.editNote')}</h1>
            <NoteEditorLazy note={note} userId={session?.user?.id} />
        </div>
    )
}
