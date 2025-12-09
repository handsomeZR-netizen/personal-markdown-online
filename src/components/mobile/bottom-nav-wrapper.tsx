"use client"

import { usePathname } from "next/navigation"
import { BottomNav } from "./bottom-nav"
import { useEffect, useState } from "react"

/**
 * BottomNav 包装器组件
 * Handles visibility logic for bottom navigation
 * 
 * Features:
 * - Hides in edit mode (Requirements 13.5)
 * - Shows only on mobile devices
 * - Maintains scroll position
 * - Animated hide/show transitions
 */

export function BottomNavWrapper() {
  const pathname = usePathname()
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    // 检测编辑模式：当路径包含 /edit 或正在查看单个笔记时隐藏
    const isEditMode = 
      pathname.includes("/edit") || 
      (pathname.startsWith("/notes/") && 
       pathname !== "/notes" && 
       pathname !== "/notes/new" &&
       !pathname.includes("?"))

    // 检测编辑器焦点
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement
      // 如果焦点在编辑器内（Tiptap 编辑器或 textarea），隐藏底部导航
      if (
        target.closest('.tiptap') || 
        target.closest('.ProseMirror') ||
        target.tagName === 'TEXTAREA' ||
        (target.tagName === 'INPUT' && target.getAttribute('type') === 'text')
      ) {
        setHidden(true)
      }
    }

    const handleFocusOut = (e: FocusEvent) => {
      const target = e.target as HTMLElement
      // 延迟检查，确保焦点真的离开了编辑区域
      setTimeout(() => {
        const activeElement = document.activeElement as HTMLElement
        const isInEditor = 
          activeElement?.closest('.tiptap') || 
          activeElement?.closest('.ProseMirror') ||
          activeElement?.tagName === 'TEXTAREA' ||
          (activeElement?.tagName === 'INPUT' && activeElement?.getAttribute('type') === 'text')
        
        if (!isInEditor && !isEditMode) {
          setHidden(false)
        }
      }, 100)
    }

    // 初始状态
    setHidden(isEditMode)

    // 添加焦点事件监听器
    document.addEventListener('focusin', handleFocusIn)
    document.addEventListener('focusout', handleFocusOut)

    return () => {
      document.removeEventListener('focusin', handleFocusIn)
      document.removeEventListener('focusout', handleFocusOut)
    }
  }, [pathname])

  return <BottomNav hidden={hidden} />
}
