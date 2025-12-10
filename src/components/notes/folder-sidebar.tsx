"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FolderPlus, ChevronRight, ChevronDown, Folder, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { createFolder, getFolders } from "@/lib/actions/folders"
import { useRouter } from "next/navigation"

interface FolderNode {
  id: string
  name: string
  parentId: string | null
  noteCount?: number
  children?: FolderNode[]
}

export function FolderSidebar() {
  const router = useRouter()
  const [folders, setFolders] = useState<FolderNode[]>([])
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [isCreating, setIsCreating] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFolders()
  }, [])

  const loadFolders = async () => {
    setLoading(true)
    try {
      const result = await getFolders()
      if (result?.success && result.data) {
        // 构建树形结构
        const folderMap = new Map<string, FolderNode>()
        const rootFolders: FolderNode[] = []

        // 第一遍：创建所有节点
        result.data.forEach((folder: any) => {
          folderMap.set(folder.id, {
            id: folder.id,
            name: folder.name,
            parentId: folder.parentId,
            noteCount: folder._count?.notes || 0,
            children: []
          })
        })

        // 第二遍：建立父子关系
        folderMap.forEach((folder) => {
          if (folder.parentId) {
            const parent = folderMap.get(folder.parentId)
            if (parent) {
              parent.children = parent.children || []
              parent.children.push(folder)
            }
          } else {
            rootFolders.push(folder)
          }
        })

        setFolders(rootFolders)
      } else {
        // Handle error case or unauthorized - set empty folders
        if (result?.error && result.error !== '未授权') {
          console.error('加载文件夹失败:', result.error)
        }
        setFolders([])
      }
    } catch (error) {
      console.error('加载文件夹失败:', error)
      setFolders([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast.error('请输入文件夹名称')
      return
    }

    try {
      const result = await createFolder({ name: newFolderName })
      if (result.success) {
        toast.success('文件夹创建成功')
        setNewFolderName("")
        setIsCreating(false)
        loadFolders()
      } else {
        toast.error(result.error || '创建失败')
      }
    } catch (error) {
      console.error('创建文件夹失败:', error)
      toast.error('创建文件夹失败')
    }
  }

  const toggleExpanded = (folderId: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(folderId)) {
        next.delete(folderId)
      } else {
        next.add(folderId)
      }
      return next
    })
  }

  const handleFolderClick = (folderId: string) => {
    router.push(`/notes?folderId=${folderId}`)
  }

  const renderFolder = (folder: FolderNode, level: number = 0) => {
    const isExpanded = expandedIds.has(folder.id)
    const hasChildren = folder.children && folder.children.length > 0

    return (
      <div key={folder.id}>
        <div
          className={cn(
            "flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer transition-colors",
            "group"
          )}
          style={{ paddingLeft: `${level * 12 + 8}px` }}
        >
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleExpanded(folder.id)
              }}
              className="p-0.5 hover:bg-accent-foreground/10 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          ) : (
            <div className="w-5" />
          )}
          
          <div
            className="flex items-center gap-2 flex-1 min-w-0"
            onClick={() => handleFolderClick(folder.id)}
          >
            <Folder className="h-4 w-4 flex-shrink-0 text-primary" />
            <span className="text-sm truncate flex-1">{folder.name}</span>
            {folder.noteCount !== undefined && folder.noteCount > 0 && (
              <span className="text-xs text-muted-foreground">
                {folder.noteCount}
              </span>
            )}
          </div>
        </div>

        {isExpanded && hasChildren && (
          <div>
            {folder.children!.map(child => renderFolder(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">文件夹</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCreating(!isCreating)}
          className="h-8 w-8 p-0"
        >
          <FolderPlus className="h-4 w-4" />
        </Button>
      </div>

      {isCreating && (
        <div className="space-y-2">
          <Input
            placeholder="文件夹名称"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCreateFolder()
              } else if (e.key === 'Escape') {
                setIsCreating(false)
                setNewFolderName("")
              }
            }}
            autoFocus
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleCreateFolder}
              className="flex-1"
            >
              创建
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setIsCreating(false)
                setNewFolderName("")
              }}
              className="flex-1"
            >
              取消
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-0.5">
        {loading ? (
          <div className="text-sm text-muted-foreground py-4 text-center">
            加载中...
          </div>
        ) : folders.length === 0 ? (
          <div className="text-sm text-muted-foreground py-4 text-center">
            暂无文件夹
          </div>
        ) : (
          folders.map(folder => renderFolder(folder))
        )}
      </div>

      <div className="pt-4 border-t">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/notes')}
          className="w-full justify-start"
        >
          <FileText className="h-4 w-4 mr-2" />
          所有笔记
        </Button>
      </div>
    </div>
  )
}
