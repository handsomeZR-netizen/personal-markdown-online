import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { PullToRefresh } from "@/components/pull-to-refresh"
import { WelcomeSection } from "@/components/dashboard/welcome-section"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { AnimatedNoteCard } from "@/components/dashboard/animated-note-card"
import { FloatingActionButton } from "@/components/dashboard/floating-action-button"
import Link from "next/link"
import { Plus } from "lucide-react"
import { Search } from "@/components/search"
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

    // 并行获取数据
    const [notes, tagCount, categoryCount] = await Promise.all([
        prisma.note.findMany({
            where: {
                userId: session.user.id,
                ...(query && {
                    OR: [
                        { title: { contains: query } },
                        { content: { contains: query } },
                    ],
                }),
            },
            orderBy: {
                updatedAt: "desc",
            },
            take: 6, // 只显示最近 6 篇
        }),
        prisma.tag.count(),
        prisma.category.count(),
    ])

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
