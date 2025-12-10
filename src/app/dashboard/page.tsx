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
import { Grid, Sparkles, FileText } from "lucide-react"

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

    // 统计数据 - 从笔记中提取实际数据
    const allNotesData = allNotes || []
    const totalNoteCount = allNotesData.length
    
    // 计算唯一标签数（如果笔记有 tags 字段）
    const uniqueTags = new Set<string>()
    const uniqueCategories = new Set<string>()
    
    allNotesData.forEach(note => {
      // 处理标签
      if ((note as any).tags && Array.isArray((note as any).tags)) {
        (note as any).tags.forEach((tag: any) => {
          if (tag?.name) uniqueTags.add(tag.name)
          else if (typeof tag === 'string') uniqueTags.add(tag)
        })
      }
      // 处理分类
      if ((note as any).categoryId) {
        uniqueCategories.add((note as any).categoryId)
      }
    })
    
    const tagCount = uniqueTags.size
    const categoryCount = uniqueCategories.size
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
                {totalNoteCount > 0 && (
                    <StatsCards
                        noteCount={totalNoteCount}
                        tagCount={tagCount}
                        categoryCount={categoryCount}
                        recentNoteDate={recentNoteDate}
                    />
                )}

                {/* 功能快捷入口 */}
                <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* 主要功能卡片 */}
                    <Link href="/features" className="group">
                        <div className="p-6 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-lg border border-primary/20 hover:border-primary/40 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] h-full">
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                    <Grid className="h-5 w-5 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold mb-1 group-hover:text-primary transition-colors">全部功能</h3>
                                    <p className="text-sm text-muted-foreground">
                                        探索所有可用功能
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Link>

                    {/* AI 功能 */}
                    <Link href="/ai" className="group">
                        <div className="p-6 bg-gradient-to-br from-violet-500/10 via-violet-500/5 to-transparent rounded-lg border border-violet-500/20 hover:border-violet-500/40 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] h-full">
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-violet-500/10 group-hover:bg-violet-500/20 transition-colors">
                                    <Sparkles className="h-5 w-5 text-violet-500" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold mb-1 group-hover:text-violet-500 transition-colors">AI 助手</h3>
                                    <p className="text-sm text-muted-foreground">
                                        智能摘要、标签生成
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Link>

                    {/* 模板 */}
                    <Link href="/templates" className="group">
                        <div className="p-6 bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-transparent rounded-lg border border-indigo-500/20 hover:border-indigo-500/40 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] h-full">
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-indigo-500/10 group-hover:bg-indigo-500/20 transition-colors">
                                    <FileText className="h-5 w-5 text-indigo-500" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold mb-1 group-hover:text-indigo-500 transition-colors">笔记模板</h3>
                                    <p className="text-sm text-muted-foreground">
                                        快速创建结构化笔记
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Link>
                </div>



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

