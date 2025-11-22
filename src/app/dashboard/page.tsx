import { auth } from "@/auth"
import { getUserNotes } from "@/lib/supabase-notes"
import { Button } from "@/components/ui/button"
import { PullToRefresh } from "@/components/pull-to-refresh"
import { WelcomeSection } from "@/components/dashboard/welcome-section"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { AnimatedNoteCard } from "@/components/dashboard/animated-note-card"
import { FloatingActionButton } from "@/components/dashboard/floating-action-button"
import Link from "next/link"
import { t } from "@/lib/i18n"

export default async function DashboardPage({
    searchParams,
}: {
    searchParams: Promise<{ query?: string }>
}) {
    const session = await auth()
    if (!session?.user?.id) return null

    const params = await searchParams
    const query = params.query || ""

    // 使用 Supabase SDK 获取数据
    const { data: allNotes, error } = await getUserNotes(session.user.id)
    
    if (error) {
        console.error("获取笔记失败:", error)
        return (
            <div className="container mx-auto p-4 max-w-7xl">
                <div className="text-center mt-10 text-red-500">
                    加载笔记失败，请刷新页面重试
                </div>
            </div>
        )
    }

    // 过滤和排序笔记
    let notes = allNotes || []
    
    // 如果有搜索查询，过滤笔记
    if (query) {
        notes = notes.filter(note => 
            note.title.toLowerCase().includes(query.toLowerCase()) ||
            note.content.toLowerCase().includes(query.toLowerCase())
        )
    }
    
    // 只显示最近 6 篇
    notes = notes.slice(0, 6)

    // 统计数据（简化版，因为我们没有迁移 Tag 和 Category 的查询）
    const tagCount = 0
    const categoryCount = 0
    const recentNoteDate = notes[0]?.updatedAt

    return (
        <PullToRefresh>
            <div className="container mx-auto p-4 max-w-7xl bg-background min-h-screen pt-8">
                {/* 欢迎区域 */}
                <WelcomeSection 
                    userName={session.user.name} 
                    noteCount={notes.length}
                />

                {/* 统计卡片 */}
                {notes.length > 0 && (
                    <StatsCards
                        noteCount={notes.length}
                        tagCount={tagCount}
                        categoryCount={categoryCount}
                        recentNoteDate={recentNoteDate}
                    />
                )}



                {/* 最近笔记 */}
                {notes.length > 0 && (
                    <div className="mb-4">
                        <div className="flex justify-between items-end mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-foreground mb-1">最近编辑</h2>
                                <p className="text-sm text-muted-foreground">继续刚才的工作</p>
                            </div>
                            <Link href="/notes">
                                <Button variant="ghost" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                                    查看全部
                                </Button>
                            </Link>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {notes.map((note, index) => (
                                <AnimatedNoteCard 
                                    key={note.id} 
                                    note={note} 
                                    index={index}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {notes.length === 0 && query && (
                    <div className="text-center mt-10 text-muted-foreground">
                        {t('search.noResults')}
                    </div>
                )}

                {/* 浮动操作按钮 */}
                <FloatingActionButton />
            </div>
        </PullToRefresh>
    )
}

