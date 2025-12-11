'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, ChevronRight, Eye, Edit, Loader2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface SharedNote {
  id: string
  title: string
  content: string
  summary: string | null
  updatedAt: string
  role: string
  sharedAt: string
  owner: {
    id: string
    name: string | null
    email: string
    avatar: string | null
    color: string | null
  }
}

export function SharedNotesSection() {
  const [notes, setNotes] = useState<SharedNote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    async function fetchSharedNotes() {
      try {
        const response = await fetch('/api/collaborators/shared-with-me')
        if (!response.ok) {
          throw new Error('Failed to fetch')
        }
        const data = await response.json()
        setNotes(data.notes || [])
      } catch (err) {
        setError('加载失败')
        console.error('Error fetching shared notes:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSharedNotes()
  }, [])

  // Don't render anything if no shared notes
  if (!loading && notes.length === 0) {
    return null
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">共享给我的笔记</h2>
          {!loading && notes.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {notes.length}
            </Badge>
          )}
        </div>
        {notes.length > 3 && (
          <Link href="/notes?filter=shared">
            <Button variant="ghost" size="sm">
              查看全部 <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="text-center py-4 text-muted-foreground text-sm">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.slice(0, 3).map((note) => (
            <Link key={note.id} href={`/notes/${note.id}/edit`}>
              <Card className="h-full hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-primary/50">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base line-clamp-1">
                      {note.title || '无标题'}
                    </CardTitle>
                    <Badge 
                      variant={note.role === 'editor' ? 'default' : 'secondary'}
                      className="shrink-0 text-xs"
                    >
                      {note.role === 'editor' ? (
                        <><Edit className="h-3 w-3 mr-1" />可编辑</>
                      ) : (
                        <><Eye className="h-3 w-3 mr-1" />只读</>
                      )}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {note.summary || note.content?.slice(0, 100) || '暂无内容'}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-5 w-5 rounded-full flex items-center justify-center text-white text-xs"
                        style={{ backgroundColor: note.owner.color || '#6366f1' }}
                      >
                        {note.owner.name?.[0]?.toUpperCase() || note.owner.email[0].toUpperCase()}
                      </div>
                      <span className="truncate max-w-[100px]">
                        {note.owner.name || note.owner.email}
                      </span>
                    </div>
                    <span>
                      {mounted ? formatDistanceToNow(new Date(note.sharedAt), {
                        addSuffix: true,
                        locale: zhCN,
                      }) : ''}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
