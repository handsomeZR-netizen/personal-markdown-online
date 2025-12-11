"use client"

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Keyboard } from 'lucide-react'
import { t } from '@/lib/i18n'

type ShortcutCategory = {
  title: string
  shortcuts: Array<{
    keys: string[]
    description: string
  }>
}

const shortcutCategories: ShortcutCategory[] = [
  {
    title: '全局快捷键',
    shortcuts: [
      {
        keys: ['Ctrl', 'S'],
        description: '保存笔记',
      },
      {
        keys: ['Ctrl', 'K'],
        description: '聚焦搜索框',
      },
      {
        keys: ['Esc'],
        description: '关闭对话框',
      },
    ],
  },
  {
    title: '编辑器快捷键',
    shortcuts: [
      {
        keys: ['Ctrl', 'B'],
        description: '加粗文本',
      },
      {
        keys: ['Ctrl', 'I'],
        description: '斜体文本',
      },
      {
        keys: ['Ctrl', 'L'],
        description: '插入链接',
      },
    ],
  },
]

function KeyBadge({ keyName }: { keyName: string }) {
  return (
    <kbd className="px-2 py-1 text-xs font-semibold text-foreground bg-muted border border-border rounded">
      {keyName}
    </kbd>
  )
}

export function KeyboardShortcutsHelp() {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch by only rendering Dialog after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  // Render placeholder button during SSR
  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className="gap-2">
        <Keyboard className="h-4 w-4" />
        <span className="hidden sm:inline">快捷键</span>
      </Button>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Keyboard className="h-4 w-4" />
          <span className="hidden sm:inline">快捷键</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            键盘快捷键
          </DialogTitle>
          <DialogDescription>
            使用这些快捷键可以更高效地使用笔记应用
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          {shortcutCategories.map((category, categoryIndex) => (
            <div key={categoryIndex} className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground">
                {category.title}
              </h3>
              <div className="space-y-2">
                {category.shortcuts.map((shortcut, shortcutIndex) => (
                  <div
                    key={shortcutIndex}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-sm">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <span key={keyIndex} className="flex items-center gap-1">
                          <KeyBadge keyName={key} />
                          {keyIndex < shortcut.keys.length - 1 && (
                            <span className="text-muted-foreground text-xs">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground">
            <strong>提示：</strong> 在 Mac 上，使用 Cmd 键代替 Ctrl 键
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
