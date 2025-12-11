import { Suspense } from "react"
import { getNotes } from "@/lib/actions/notes"
import { getTags } from "@/lib/actions/tags"
import { getCategories } from "@/lib/actions/categories"
import { getFolders } from "@/lib/actions/folders"
import { getUserPreferences } from "@/lib/actions/preferences"
import { NoteCard } from "@/components/notes/note-card"
import { Pagination } from "@/components/pagination"
import { SortSelector } from "@/components/sort-selector"
import { SearchBar } from "@/components/search-bar"
import { FilterPanel } from "@/components/filters/filter-panel"
import { MobileFilterDrawer } from "@/components/filters/mobile-filter-drawer"
import { PullToRefresh } from "@/components/pull-to-refresh"
import { FolderSidebar } from "@/components/notes/folder-sidebar"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"
import { t } from "@/lib/i18n"
import type { SortBy, SortOrder } from "@/lib/sorting"

// 文件夹树形结构构建函数
interface FolderNode {
  id: string
  name: string
  parentId: string | null
  noteCount?: number
  children?: FolderNode[]
}

function buildFolderTree(folders: any[]): FolderNode[] {
  const folderMap = new Map<string, FolderNode>()
  const rootFolders: FolderNode[] = []

  // 第一遍：创建所有节点
  folders.forEach((folder) => {
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

  return rootFolders
}

function SortSelectorFallback() {
    return (
        <div className="flex items-center gap-2">
            <div className="h-10 w-32 animate-pulse rounded-md bg-muted" />
            <div className="h-10 w-10 animate-pulse rounded-md bg-muted" />
        </div>
    )
}

function SearchBarFallback() {
    return <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
}

function FilterPanelFallback() {
    return (
        <div className="space-y-4">
            <div className="h-6 w-20 animate-pulse rounded bg-muted" />
            <div className="h-32 w-full animate-pulse rounded-md bg-muted" />
        </div>
    )
}

function FolderSidebarFallback() {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="h-5 w-16 animate-pulse rounded bg-muted" />
                <div className="h-8 w-8 animate-pulse rounded bg-muted" />
            </div>
            <div className="space-y-2">
                <div className="h-8 w-full animate-pulse rounded bg-muted" />
                <div className="h-8 w-full animate-pulse rounded bg-muted" />
                <div className="h-8 w-3/4 animate-pulse rounded bg-muted" />
            </div>
        </div>
    )
}

function PaginationFallback() {
    return (
        <div className="flex justify-center gap-2">
            <div className="h-10 w-10 animate-pulse rounded-md bg-muted" />
            <div className="h-10 w-10 animate-pulse rounded-md bg-muted" />
            <div className="h-10 w-10 animate-pulse rounded-md bg-muted" />
        </div>
    )
}

type SearchParams = {
    page?: string
    sortBy?: 'createdAt' | 'updatedAt' | 'title'
    sortOrder?: 'asc' | 'desc'
    query?: string
    tagIds?: string
    categoryId?: string
    ownership?: 'all' | 'mine' | 'shared'
}

export default async function NotesPage({
    searchParams,
}: {
    searchParams: Promise<SearchParams>
}) {
    const params = await searchParams
    const page = Number(params.page) || 1
    const sortBy = params.sortBy || 'createdAt'
    const sortOrder = params.sortOrder || 'desc'
    const query = params.query
    const tagIds = params.tagIds ? params.tagIds.split(',') : undefined
    const categoryId = params.categoryId || undefined
    const ownership = params.ownership || 'all'

    // 并行获取笔记、标签、分类、文件夹和用户偏好
    const [
        notesData,
        tagsResult,
        categoriesResult,
        foldersResult,
        userPrefs
    ] = await Promise.all([
        getNotes({
            page,
            sortBy,
            sortOrder,
            query,
            ownership,
        }),
        getTags(),
        getCategories(),
        getFolders(),
        getUserPreferences().catch(() => ({ sortBy: 'updatedAt' as SortBy, sortOrder: 'desc' as SortOrder }))
    ])

    // 安全解构，提供默认值
    const { 
        notes = [], 
        totalCount = 0, 
        totalPages = 0, 
        currentPage = 1 
    } = notesData || {}
    
    const tags = (tagsResult?.success ? tagsResult.data : []) as Array<{ id: string; name: string }>
    const categories = (categoriesResult?.success ? categoriesResult.data : []) as Array<{ id: string; name: string }>
    const folderTree = foldersResult?.success ? buildFolderTree(foldersResult.data || []) : []

    return (
        <PullToRefresh>
            <div className="container mx-auto p-4">
                {/* 头部 */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold">{t('notes.myNotes')}</h1>
                    <p className="text-sm sm:text-base text-muted-foreground mt-1">
                        {t('pagination.showing')} {notes.length} {t('pagination.items')}
                        {totalCount > 0 && ` ${t('pagination.of_total')} ${totalCount} ${t('pagination.items')}`}
                    </p>
                </div>
                <Link href="/notes/new" className="w-full sm:w-auto">
                    <Button className="w-full sm:w-auto min-h-[44px]" aria-label={t('notes.newNote')}>
                        <Plus className="mr-2 h-4 w-4" aria-hidden="true" /> {t('notes.newNote')}
                    </Button>
                </Link>
            </div>

            {/* 搜索栏 */}
            <div className="mb-6">
                <Suspense fallback={<SearchBarFallback />}>
                    <SearchBar />
                </Suspense>
            </div>

            {/* 移动端筛选按钮 */}
            <div className="mb-4 md:hidden">
                <Suspense fallback={<div className="h-11 w-full animate-pulse rounded-md bg-muted" />}>
                    <MobileFilterDrawer tags={tags} categories={categories} />
                </Suspense>
            </div>

            {/* 主内容区域 - 文件夹、筛选面板和笔记列表 */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* 左侧文件夹和筛选面板 - 桌面端显示 */}
                <aside className="hidden lg:block lg:col-span-3 xl:col-span-2" aria-label="侧边栏">
                    <div className="sticky top-20 space-y-6">
                        <div className="border rounded-lg p-4 bg-card">
                            <FolderSidebar initialFolders={folderTree} />
                        </div>
                        <FilterPanel tags={tags} categories={categories} />
                    </div>
                </aside>

                {/* 右侧笔记列表 */}
                <section className="lg:col-span-9 xl:col-span-10 space-y-6">
                    {/* 排序选择器 */}
                    <SortSelector 
                        baseUrl="/notes" 
                        initialSortBy={userPrefs.sortBy as SortBy}
                        initialSortOrder={userPrefs.sortOrder as SortOrder}
                    />

                    {/* 笔记列表 */}
                    {notes.length > 0 ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" role="list" aria-label="笔记列表">
                                {notes.map((note) => (
                                    <NoteCard key={note.id} note={note} />
                                ))}
                            </div>
                            
                            {/* 分页 */}
                            <Suspense fallback={<PaginationFallback />}>
                                <Pagination 
                                    currentPage={currentPage} 
                                    totalPages={totalPages}
                                    baseUrl="/notes"
                                />
                            </Suspense>
                        </>
                    ) : (
                        <div className="text-center mt-10 space-y-2" role="status" aria-live="polite">
                            <p className="text-muted-foreground text-lg">
                                {query || tagIds || categoryId ? t('search.noResults') : t('notes.noNotes')}
                            </p>
                            <p className="text-muted-foreground text-sm">
                                {query || tagIds || categoryId ? t('search.noResultsDescription') : t('notes.noNotesDescription')}
                            </p>
                        </div>
                    )}
                </section>
            </div>
        </div>
        </PullToRefresh>
    )
}
