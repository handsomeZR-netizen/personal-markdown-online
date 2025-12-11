# 可调整大小弹窗组件开发指南

本指南总结了 `FeatureDetailDialog` 的实现策略，可复用到其他需要大型可调整弹窗的组件。

## 文件结构

```
src/components/[feature-name]/
├── [feature]-dialog.tsx      # 弹窗组件（含拖拽调整逻辑）
├── [feature]-data.ts         # 数据配置
├── [feature]-cards.tsx       # 触发弹窗的卡片组件
└── index.ts                  # 导出文件
```

## 核心实现要点

### 1. 弹窗定位（解决 Radix Dialog 定位问题）

Radix Dialog 默认样式会被动画类覆盖，需要使用 `!important` 强制居中：

```tsx
<DialogContent 
  style={{ width: dialogWidth }}
  className={cn(
    // 强制居中定位（覆盖 Radix 默认动画样式）
    "!max-w-none !top-[50%] !left-[50%] !-translate-x-1/2 !-translate-y-1/2",
    // 弹窗尺寸
    "h-[85vh] p-0 flex flex-col overflow-hidden",
    // 拖拽时禁用过渡
    isResizing && "select-none !transition-none"
  )}
  // 阻止自动聚焦导致的滚动
  onOpenAutoFocus={(e) => e.preventDefault()}
>
```

### 2. 可拖拽调整宽度

```tsx
// 状态
const [dialogWidth, setDialogWidth] = useState(1152) // 默认宽度
const [isResizing, setIsResizing] = useState(false)

// 宽度限制
const minWidth = 400
const maxWidth = typeof window !== 'undefined' ? window.innerWidth * 0.95 : 1600

// 拖拽处理
const handleMouseDown = useCallback((e: React.MouseEvent, side: 'left' | 'right') => {
  e.preventDefault()
  e.stopPropagation()
  setIsResizing(true)
  
  const startX = e.clientX
  const startWidth = dialogWidth

  const handleMouseMove = (moveEvent: MouseEvent) => {
    moveEvent.preventDefault()
    const deltaX = side === 'right' 
      ? moveEvent.clientX - startX 
      : startX - moveEvent.clientX
    // 双向扩展（乘以2）
    const newWidth = Math.min(maxWidth, Math.max(minWidth, startWidth + deltaX * 2))
    setDialogWidth(newWidth)
  }

  const handleMouseUp = () => {
    setIsResizing(false)
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }

  document.body.style.cursor = 'ew-resize'
  document.body.style.userSelect = 'none'
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}, [dialogWidth, maxWidth])
```

### 3. 拖拽手柄 UI

```tsx
{/* 左侧拖拽手柄 */}
<div
  className="absolute -left-1 top-0 bottom-0 w-3 cursor-ew-resize z-[60] flex items-center justify-center hover:bg-primary/10"
  onMouseDown={(e) => handleMouseDown(e, 'left')}
>
  <div className="w-1 h-20 bg-muted-foreground/30 rounded-full" />
</div>

{/* 右侧拖拽手柄 */}
<div
  className="absolute -right-1 top-0 bottom-0 w-3 cursor-ew-resize z-[60] flex items-center justify-center hover:bg-primary/10"
  onMouseDown={(e) => handleMouseDown(e, 'right')}
>
  <div className="w-1 h-20 bg-muted-foreground/30 rounded-full" />
</div>
```

### 4. 受控打开状态

```tsx
const [isOpen, setIsOpen] = useState(false)

const handleOpenChange = useCallback((open: boolean) => {
  setIsOpen(open)
}, [])

<Dialog open={isOpen} onOpenChange={handleOpenChange}>
```

## 完整组件模板

```tsx
"use client"

import { useState, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface ResizableDialogProps {
  children: React.ReactNode
  trigger: React.ReactNode
  title: string
  defaultWidth?: number
  minWidth?: number
}

export function ResizableDialog({ 
  children, 
  trigger, 
  title,
  defaultWidth = 1152,
  minWidth = 400 
}: ResizableDialogProps) {
  const [dialogWidth, setDialogWidth] = useState(defaultWidth)
  const [isResizing, setIsResizing] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const maxWidth = typeof window !== 'undefined' ? window.innerWidth * 0.95 : 1600

  const handleMouseDown = useCallback((e: React.MouseEvent, side: 'left' | 'right') => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    
    const startX = e.clientX
    const startWidth = dialogWidth

    const handleMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault()
      const deltaX = side === 'right' 
        ? moveEvent.clientX - startX 
        : startX - moveEvent.clientX
      const newWidth = Math.min(maxWidth, Math.max(minWidth, startWidth + deltaX * 2))
      setDialogWidth(newWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.body.style.cursor = 'ew-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [dialogWidth, maxWidth, minWidth])

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent 
        style={{ width: dialogWidth }}
        className={cn(
          "!max-w-none !top-[50%] !left-[50%] !-translate-x-1/2 !-translate-y-1/2",
          "h-[85vh] p-0 flex flex-col overflow-hidden",
          isResizing && "select-none !transition-none"
        )}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {/* 左侧拖拽手柄 */}
        <div
          className="absolute -left-1 top-0 bottom-0 w-3 cursor-ew-resize z-[60] flex items-center justify-center hover:bg-primary/10"
          onMouseDown={(e) => handleMouseDown(e, 'left')}
        >
          <div className="w-1 h-20 bg-muted-foreground/30 rounded-full" />
        </div>
        
        {/* 右侧拖拽手柄 */}
        <div
          className="absolute -right-1 top-0 bottom-0 w-3 cursor-ew-resize z-[60] flex items-center justify-center hover:bg-primary/10"
          onMouseDown={(e) => handleMouseDown(e, 'right')}
        >
          <div className="w-1 h-20 bg-muted-foreground/30 rounded-full" />
        </div>

        <DialogHeader className="p-6 pb-4 flex-shrink-0">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto p-6 pt-0">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

## 常见问题解决

### 问题 1: 弹窗位置不居中

**原因**: Radix Dialog 的动画类 `data-[state=open]:zoom-in-95` 会覆盖 transform

**解决**: 使用 Tailwind `!important` 修饰符强制覆盖
```tsx
className="!top-[50%] !left-[50%] !-translate-x-1/2 !-translate-y-1/2"
```

### 问题 2: 打开弹窗时背景页面跳动

**原因**: Radix Dialog 的滚动锁定机制

**解决**: 
```tsx
onOpenAutoFocus={(e) => e.preventDefault()}
```

### 问题 3: 拖拽时页面滚动

**原因**: 鼠标移动事件触发默认滚动行为

**解决**: 在 `handleMouseMove` 中调用 `moveEvent.preventDefault()`

### 问题 4: 拖拽时文本被选中

**原因**: 鼠标拖动默认会选择文本

**解决**: 
```tsx
document.body.style.userSelect = 'none'
// 拖拽结束后恢复
document.body.style.userSelect = ''
```

## 样式关键点

| 样式 | 作用 |
|------|------|
| `!max-w-none` | 移除默认最大宽度限制 |
| `!top-[50%] !left-[50%]` | 强制定位到视口中心 |
| `!-translate-x-1/2 !-translate-y-1/2` | 居中偏移 |
| `h-[85vh]` | 弹窗高度为视口 85% |
| `z-[60]` | 拖拽手柄层级高于弹窗内容 |
| `select-none !transition-none` | 拖拽时禁用选择和过渡动画 |

## 使用示例

```tsx
import { ResizableDialog } from "@/components/ui/resizable-dialog"
import { Button } from "@/components/ui/button"

export function MyComponent() {
  return (
    <ResizableDialog
      trigger={<Button>打开弹窗</Button>}
      title="我的弹窗"
      defaultWidth={800}
      minWidth={400}
    >
      <div>弹窗内容...</div>
    </ResizableDialog>
  )
}
```
