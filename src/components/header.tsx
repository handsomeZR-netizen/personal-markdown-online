import Link from "next/link"
import { Button } from "@/components/ui/button"
import { auth, signOut } from "@/auth"
import { LogOut, User, Sparkles, FileText, Plus, Home, Settings, Grid, HelpCircle } from "lucide-react"
import { t } from "@/lib/i18n"
import { MobileNav } from "@/components/mobile-nav"
import { ThemeToggle } from "@/components/theme-toggle"
import { KeyboardShortcutsHelp } from "@/components/keyboard-shortcuts-help"
import { SearchBar } from "@/components/search-bar"
import { Suspense } from "react"

/**
 * 全局Header组件
 * Global header with logo, navigation, search, user info, and theme toggle
 */
export async function Header() {
    const session = await auth()

    return (
        <header className="border-b border-border sticky top-0 bg-background/70 backdrop-blur-xl backdrop-saturate-150 z-50 shadow-sm transition-all duration-300 supports-[backdrop-filter]:bg-background/60 dark:border-border" role="banner">
            <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between gap-4">
                    {/* Logo和标题 */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {session?.user && <MobileNav />}
                        <Link 
                            href="/dashboard" 
                            className="text-xl font-bold hover:opacity-80 transition-opacity flex items-center gap-2" 
                            aria-label={t('navigation.home')}
                        >
                            <FileText className="h-6 w-6" aria-hidden="true" />
                            <span className="hidden sm:inline">{t('common.appName')}</span>
                        </Link>
                    </div>

                    {session?.user ? (
                        <>
                            {/* 桌面端导航链接 - 仅在桌面端显示 (Requirements 13.1, 13.4) */}
                            <nav className="hidden lg:flex items-center gap-1" aria-label="主导航">
                                <Link href="/dashboard">
                                    <Button variant="ghost" size="sm" aria-label={t('navigation.dashboard')}>
                                        <Home className="h-4 w-4 mr-2" aria-hidden="true" />
                                        {t('navigation.dashboard')}
                                    </Button>
                                </Link>
                                <Link href="/notes">
                                    <Button variant="ghost" size="sm" aria-label={t('navigation.notes')}>
                                        <FileText className="h-4 w-4 mr-2" aria-hidden="true" />
                                        {t('navigation.notes')}
                                    </Button>
                                </Link>
                                <Link href="/notes/new">
                                    <Button variant="ghost" size="sm" aria-label={t('notes.newNote')}>
                                        <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
                                        {t('notes.newNote')}
                                    </Button>
                                </Link>
                                <Link href="/features">
                                    <Button variant="ghost" size="sm" aria-label="功能导航">
                                        <Grid className="h-4 w-4 mr-2" aria-hidden="true" />
                                        功能
                                    </Button>
                                </Link>
                                <Link href="/ai">
                                    <Button variant="ghost" size="sm" aria-label={t('ai.aiFeatures')}>
                                        <Sparkles className="h-4 w-4 mr-2" aria-hidden="true" />
                                        {t('ai.aiFeatures')}
                                    </Button>
                                </Link>
                                <Link href="/help">
                                    <Button variant="ghost" size="sm" aria-label="帮助">
                                        <HelpCircle className="h-4 w-4 mr-2" aria-hidden="true" />
                                        帮助
                                    </Button>
                                </Link>
                                <Link href="/settings">
                                    <Button variant="ghost" size="sm" aria-label="设置">
                                        <Settings className="h-4 w-4 mr-2" aria-hidden="true" />
                                        设置
                                    </Button>
                                </Link>
                            </nav>

                            {/* 搜索栏 - 在桌面端显示 */}
                            <div className="hidden md:block flex-1 max-w-md">
                                <Suspense fallback={<div className="h-10 w-full bg-muted/20 animate-pulse rounded-md" />}>
                                    <SearchBar />
                                </Suspense>
                            </div>

                            {/* 用户信息和操作 */}
                            <nav className="flex items-center gap-2 flex-shrink-0" aria-label="用户操作">
                                <KeyboardShortcutsHelp />
                                <div className="hidden lg:flex items-center gap-2 text-sm text-muted-foreground" aria-label="用户信息">
                                    <User className="h-4 w-4" aria-hidden="true" />
                                    <span>{session.user.email}</span>
                                </div>
                                <ThemeToggle />
                                <form
                                    action={async () => {
                                        "use server"
                                        await signOut({ redirectTo: "/login" })
                                    }}
                                >
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="min-h-[44px] md:min-h-0" 
                                        aria-label={t('auth.logout')}
                                    >
                                        <LogOut className="h-4 w-4 md:mr-2" aria-hidden="true" />
                                        <span className="hidden lg:inline">{t('auth.logout')}</span>
                                    </Button>
                                </form>
                            </nav>
                        </>
                    ) : (
                        <nav className="flex gap-2 flex-shrink-0" aria-label="主导航">
                            <ThemeToggle />
                            <Link href="/login">
                                <Button variant="ghost" size="sm" className="min-h-[44px] md:min-h-0" aria-label={t('auth.login')}>
                                    {t('auth.login')}
                                </Button>
                            </Link>
                            <Link href="/register">
                                <Button size="sm" className="min-h-[44px] md:min-h-0" aria-label={t('auth.register')}>
                                    {t('auth.register')}
                                </Button>
                            </Link>
                        </nav>
                    )}
                </div>

                {/* 移动端搜索栏 - 在移动端显示在第二行 */}
                {session?.user && (
                    <div className="md:hidden mt-3">
                        <Suspense fallback={<div className="h-10 w-full bg-muted/20 animate-pulse rounded-md" />}>
                            <SearchBar />
                        </Suspense>
                    </div>
                )}
            </div>
        </header>
    )
}
