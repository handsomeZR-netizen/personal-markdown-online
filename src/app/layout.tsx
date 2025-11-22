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

export const metadata: Metadata = {
  title: t('common.appName'),
  description: "一个简单的笔记管理应用",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth()
  
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="font-sans antialiased bg-background">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
        >
          <NetworkStatusProvider>
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
              <main id="main-content" className="min-h-screen" role="main">
                {children}
              </main>
              <Toaster />
            </KeyboardShortcutsProvider>
          </NetworkStatusProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
