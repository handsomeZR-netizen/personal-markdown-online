import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Header } from "@/components/header";
import { t } from "@/lib/i18n";
import { ThemeProvider } from "@/components/theme-provider";
import { KeyboardShortcutsProvider } from "@/components/keyboard-shortcuts-provider";
import { SkipToContent } from "@/components/skip-to-content";

export const metadata: Metadata = {
  title: t('common.appName'),
  description: "一个简单的笔记管理应用",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
        >
          <KeyboardShortcutsProvider>
            <SkipToContent />
            <Header />
            <main id="main-content" className="min-h-screen" role="main">
              {children}
            </main>
            <Toaster />
          </KeyboardShortcutsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
