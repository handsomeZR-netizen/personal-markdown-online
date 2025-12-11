import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Header } from "@/components/header";
import { t } from "@/lib/i18n";
import { ThemeProvider } from "@/components/theme-provider";
import { KeyboardShortcutsProvider } from "@/components/keyboard-shortcuts-provider";
import { SkipToContent } from "@/components/skip-to-content";
import { CacheCleanup } from "@/components/cache-cleanup";
import { auth } from "@/auth";
import { NetworkStatusProvider } from "@/contexts/network-status-context";
import { NetworkStatusIndicator } from "@/components/offline/network-status-indicator";
import { SyncProgressBar } from "@/components/offline/sync-progress-bar";
import { StorageWarning } from "@/components/offline/storage-warning";
import { DataRecovery } from "@/components/offline/data-recovery";
import { UnloadWarning } from "@/components/offline/unload-warning";
import { OfflineOnboardingDialog } from "@/components/offline/offline-onboarding-dialog";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";
import { BottomNavWrapper } from "@/components/mobile/bottom-nav-wrapper";
import { LoadingProvider } from "@/hooks/use-loading";
import { TopLoadingBar } from "@/components/top-loading-bar";
import { WallpaperBackground } from "@/components/wallpaper-background";

export const metadata: Metadata = {
  title: t('common.appName'),
  description: "一个简单的笔记管理应用",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "知识库",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "团队协作知识库",
    title: t('common.appName'),
    description: "实时协作的团队文档平台",
  },
  twitter: {
    card: "summary",
    title: t('common.appName'),
    description: "实时协作的团队文档平台",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth()
  
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes" />
        <meta name="theme-color" content="#6366f1" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className="font-sans antialiased bg-background relative">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
        >
          <LoadingProvider>
            <NetworkStatusProvider>
            <WallpaperBackground />
            <TopLoadingBar />
            <DataRecovery userId={session?.user?.id} />
            <UnloadWarning userId={session?.user?.id} />
            <OfflineOnboardingDialog />
            <NetworkStatusIndicator />
            <SyncProgressBar />
            <StorageWarning />
            <KeyboardShortcutsProvider>
              <CacheCleanup userId={session?.user?.id || null} />
              <SkipToContent />
              <Header />
              <main id="main-content" className="min-h-screen pb-20 lg:pb-0" role="main">
                {children}
              </main>
              <BottomNavWrapper />
              <PWAInstallPrompt />
              <Toaster />
            </KeyboardShortcutsProvider>
          </NetworkStatusProvider>
          </LoadingProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
