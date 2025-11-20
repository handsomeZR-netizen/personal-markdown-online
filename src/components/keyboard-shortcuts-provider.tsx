"use client"

import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export function KeyboardShortcutsProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Listen for dialog state changes
  useEffect(() => {
    const checkDialogState = () => {
      // Check if any dialog or modal is open
      const dialogs = document.querySelectorAll('[role="dialog"], [role="alertdialog"]')
      setIsDialogOpen(dialogs.length > 0)
    }

    // Check initially
    checkDialogState()

    // Use MutationObserver to detect when dialogs are added/removed
    const observer = new MutationObserver(checkDialogState)
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })

    return () => observer.disconnect()
  }, [])

  useKeyboardShortcuts([
    // Ctrl/Cmd + S: 保存笔记 (handled in note editor)
    {
      key: 's',
      ctrl: true,
      callback: (e) => {
        // This will be handled by the note editor component
        // We just prevent the default browser save dialog
        e.preventDefault()
      },
    },
    // Ctrl/Cmd + K: 聚焦搜索框
    {
      key: 'k',
      ctrl: true,
      callback: (e) => {
        e.preventDefault()
        const searchInput = document.querySelector('input[type="search"], input[placeholder*="搜索"]') as HTMLInputElement
        if (searchInput) {
          searchInput.focus()
          searchInput.select()
        }
      },
    },
    // Esc: 关闭对话框
    {
      key: 'Escape',
      callback: (e) => {
        if (isDialogOpen) {
          // Find and click the close button or overlay
          const closeButton = document.querySelector('[role="dialog"] button[aria-label*="关闭"], [role="dialog"] button[aria-label*="Close"]') as HTMLButtonElement
          const overlay = document.querySelector('[data-radix-dialog-overlay]') as HTMLElement
          
          if (closeButton) {
            closeButton.click()
          } else if (overlay) {
            overlay.click()
          }
        }
      },
      preventDefault: false,
    },
  ])

  return <>{children}</>
}
