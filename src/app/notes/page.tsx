import { getNotes } from "@/lib/actions/notes"
import { getTags } from "@/lib/actions/tags"
import { getCategories } from "@/lib/actions/categories"
import { NoteCard } from "@/components/notes/note-card"
import { Pagination } from "@/components/pagination"
import { SortSelector } from "@/components/sort-selector"
import { SearchBar } from "@/components/search-bar"
import { FilterPanel } from "@/components/filters/filter-panel"
import { MobileFilterDrawer } from "@/components/filters/mobile-filter-drawer"
import { PullToRefresh } from "@/components/pull-to-refresh"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"
import { t } from "@/lib/i18n"

type SearchParams = {
    page?: string
    sortBy?: 'createdAt' | 'updatedAt' | 'title'
    sortOrder?: 'asc' | 'desc'
    query?: string
    tagIds?: string
    categoryId?: string
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

    // 并行获取笔记、标签和分类
    const [
        notesData,
        tagsResult,
        categoriesResult
    ] = await Promise.all([
        getNotes({
            page,
            sortBy,
            sortOrder,
            query,
        }),
        getTags(),
        getCategories()
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
                <SearchBar />
            </div>

            {/* 移动端筛选按钮 */}
            <div className="mb-4 md:hidden">
                <MobileFilterDrawer tags={tags} categories={categories} />
            </div>

            {/* 主内容区域 - 筛选面板和笔记列表 */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* 左侧筛选面板 - 桌面端显示 */}
                <aside className="hidden lg:block lg:col-span-3 xl:col-span-2" aria-label="筛选面板">
                    <div className="sticky top-20">
                        <FilterPanel tags={tags} categories={categories} />
                    </div>
                </aside>

                {/* 右侧笔记列表 */}
                <section className="lg:col-span-9 xl:col-span-10 space-y-6">
                    {/* 排序选择器 */}
                    <SortSelector baseUrl="/notes" />

                    {/* 笔记列表 */}
                    {notes.length > 0 ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" role="list" aria-label="笔记列表">
                                {notes.map((note) => (
                                    <NoteCard key={note.id} note={note} />
                                ))}
                            </div>
                            
                            {/* 分页 */}
                            <Pagination 
                                currentPage={currentPage} 
                                totalPages={totalPages}
                                baseUrl="/notes"
                            />
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
