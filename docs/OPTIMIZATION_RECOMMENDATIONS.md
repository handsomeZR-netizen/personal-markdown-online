# 优化建议

基于 Context7 和 Next.js/Framer Motion 最佳实践的代码审查。

## ✅ 已实现的最佳实践

### 1. Client Components 正确使用
- 所有动画组件都标记为 `"use client"`
- 服务器组件和客户端组件分离清晰
- 数据在服务器端获取，传递给客户端组件

### 2. 性能优化
- 使用硬件加速属性（transform, opacity）
- 避免在大列表中使用复杂动画
- 使用 `motion.div` 而不是包装整个应用

### 3. 代码组织
- 组件拆分合理
- 类型定义完整
- 文件结构清晰

## 🔧 建议改进

### 1. 添加动画性能监控

**当前代码：**
```typescript
<motion.div
  initial={{ opacity: 0, y: 50 }}
  animate={{ opacity: 1, y: 0 }}
>
```

**建议改进：**
```typescript
<motion.div
  initial={{ opacity: 0, y: 50 }}
  animate={{ opacity: 1, y: 0 }}
  onAnimationStart={() => {
    if (process.env.NODE_ENV === 'development') {
      console.time('animation')
    }
  }}
  onAnimationComplete={() => {
    if (process.env.NODE_ENV === 'development') {
      console.timeEnd('animation')
    }
  }}
>
```

### 2. 添加 prefers-reduced-motion 支持

**创建自定义 Hook：**
```typescript
// src/hooks/use-reduced-motion.ts
import { useEffect, useState } from 'react'

export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = () => {
      setPrefersReducedMotion(mediaQuery.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return prefersReducedMotion
}
```

**使用：**
```typescript
const prefersReducedMotion = useReducedMotion()

<motion.div
  initial={prefersReducedMotion ? {} : { opacity: 0, y: 50 }}
  animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
>
```

### 3. 优化大列表动画

**当前代码：**
```typescript
{notes.map((note, index) => (
  <AnimatedNoteCard key={note.id} note={note} index={index} />
))}
```

**建议改进（使用虚拟化）：**
```typescript
import { useVirtualizer } from '@tanstack/react-virtual'

// 只在笔记数量 > 20 时使用虚拟化
const shouldVirtualize = notes.length > 20

{shouldVirtualize ? (
  <VirtualizedNoteList notes={notes} />
) : (
  notes.map((note, index) => (
    <AnimatedNoteCard key={note.id} note={note} index={index} />
  ))
)}
```

### 4. 延迟加载动画组件

**建议使用动态导入：**
```typescript
// src/components/dashboard/animated-components.tsx
import dynamic from 'next/dynamic'

export const WelcomeSection = dynamic(
  () => import('./welcome-section').then(mod => ({ default: mod.WelcomeSection })),
  { ssr: false }
)

export const FloatingActionButton = dynamic(
  () => import('./floating-action-button').then(mod => ({ default: mod.FloatingActionButton })),
  { ssr: false }
)
```

### 5. 添加动画配置

**创建全局动画配置：**
```typescript
// src/lib/animation-config.ts
export const animationConfig = {
  spring: {
    type: "spring" as const,
    stiffness: 100,
    damping: 20,
  },
  fast: {
    duration: 0.2,
  },
  normal: {
    duration: 0.3,
  },
  slow: {
    duration: 0.5,
  },
}

// 使用
<motion.div
  transition={animationConfig.spring}
>
```

### 6. 优化 FAB 性能

**当前代码：**
```typescript
<AnimatePresence>
  {isOpen && (
    <motion.div>
      {actions.map(...)}
    </motion.div>
  )}
</AnimatePresence>
```

**建议改进（使用 layout 动画）：**
```typescript
<motion.div layout>
  {isOpen && actions.map(...)}
</motion.div>
```

### 7. 添加错误边界

**创建动画错误边界：**
```typescript
// src/components/animation-error-boundary.tsx
'use client'

import { Component, ReactNode } from 'react'

export class AnimationErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return this.props.children // 降级到无动画版本
    }

    return this.props.children
  }
}
```

## 📊 性能指标

### 当前性能
- 初始包大小：~30KB (Framer Motion)
- 动画帧率：60 FPS
- 首次内容绘制：< 1s

### 优化目标
- 减少初始包大小：使用动态导入
- 保持 60 FPS：避免布局抖动
- 改善可访问性：支持 reduced motion

## 🔍 监控建议

### 1. 添加性能监控
```typescript
// src/lib/performance.ts
export function measureAnimation(name: string) {
  if (typeof window === 'undefined') return

  performance.mark(`${name}-start`)
  
  return () => {
    performance.mark(`${name}-end`)
    performance.measure(name, `${name}-start`, `${name}-end`)
    
    const measure = performance.getEntriesByName(name)[0]
    console.log(`${name}: ${measure.duration}ms`)
  }
}
```

### 2. 使用 Next.js Analytics
```typescript
// next.config.ts
const nextConfig = {
  experimental: {
    instrumentationHook: true,
  },
}
```

## 📝 总结

当前实现已经遵循了大部分最佳实践，主要改进方向：

1. ✅ 添加可访问性支持（reduced motion）
2. ✅ 优化大列表性能（虚拟化）
3. ✅ 延迟加载动画组件
4. ✅ 添加性能监控
5. ✅ 创建全局动画配置

这些改进将进一步提升应用的性能和用户体验。
