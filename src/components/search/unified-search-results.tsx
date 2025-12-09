"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Folder, FileText, ChevronRight, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { t } from "@/lib/i18n"

/**
 * Unified search results component
 * Displays both folders and notes with icons and paths
 * Validates: Requirements 21.1, 21.2, 21.3
 */

interface FolderResult {
  id: string
  name: string
  parent: {
    id: string
    name: string
  } | null
  _count: {
    children: number
    notes: number
  }
}

interface NoteResult {
  id: string
  title: string
  content: string
  folder: {
    id: string
    name: string
  } | null
  updatedAt: string
  tags: Array<{ id: string; name: string }>
}

interface SearchResults {
  folders: FolderResult[]
  notes: NoteResult[]
  totalCount: number
  currentPage: number
  totalPages: number
  query: string
}

export function UnifiedSearchResults() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const query = searchParams.get('query') || ''
  
  const [results, setResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!query.trim()) {
      setResults(null)
      return
    }

    const fetchResults = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(
          `/api/search?query=${encodeURIComponent(query)}&page=1&pageSize=20`
        )

        if (!response.ok) {
          throw new Error('搜索失败')
        }

        const data = await response.json()
        setResults(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : '搜索失败')
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [query])

  const handleFolderClick = (folderId: string) => {
    router.push(`/folders/${folderId}`)
  }

  const handleNoteClick = (noteId: string) => {
    router.push(`/notes/${noteId}`)
  }

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text

    const parts = text.split(new RegExp(`(${query})`, 'gi'))
    return (
      <>
        {parts.map((part, index) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={index} className="bg-yellow-200 dark:bg-yellow-800">
              {part}
            </mark>
          ) : (
            <span key={index}>{part}</span>
          )
        )}
      </>
    )
  }

  const getFolderPath = (folder: FolderResult): string => {
    const parts: string[] = []
    if (folder.parent) {
      parts.push(folder.parent.name)
    }
    parts.push(folder.name)
    return parts.join(' / ')
  }

  if (!query.trim()) {
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">{error}</p>
      </div>
    )
  }

  if (!results || results.totalCount === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">
          {t('search.noResults')}
        </p>
        <Button
          onClick={() => router.push(`/notes/new?title=${encodeURIComponent(query)}`)}
          variant="outline"
        >
          <FileText className="mr-2 h-4 w-4" />
          创建笔记 "{query}"
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search summary */}
      <div className="text-sm text-muted-foreground">
        找到 {results.totalCount} 个结果
      </div>

      {/* Folders section */}
      {results.folders.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            文件夹 ({results.folders.length})
          </h3>
          <div className="space-y-2">
            {results.folders.map((folder) => (
              <Card
                key={folder.id}
                className="cursor-pointer hover:bg-accent transition-colors"
                onClick={() => handleFolderClick(folder.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Folder className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-base mb-1">
                        {highlightText(folder.name, query)}
                      </h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="truncate">
                          {getFolderPath(folder)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span>{folder._count.children} 个子文件夹</span>
                        <span>{folder._count.notes} 个笔记</span>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Notes section */}
      {results.notes.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            笔记 ({results.notes.length})
          </h3>
          <div className="space-y-2">
            {results.notes.map((note) => (
              <Card
                key={note.id}
                className="cursor-pointer hover:bg-accent transition-colors"
                onClick={() => handleNoteClick(note.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-base mb-1">
                        {highlightText(note.title, query)}
                      </h4>
                      {note.folder && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                          <Folder className="h-3 w-3" />
                          <span className="truncate">{note.folder.name}</span>
                        </div>
                      )}
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {highlightText(
                          note.content.substring(0, 150),
                          query
                        )}
                      </p>
                      {note.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {note.tags.map((tag) => (
                            <Badge key={tag.id} variant="secondary" className="text-xs">
                              {tag.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
