# 性能优化指南

## 问题诊断

根据 Chrome DevTools 性能分析，发现以下问题：

| 指标 | 优化前 | 问题 |
|------|--------|------|
| DOM 节点数 | 779 → 32,275 | 节点爆炸 |
| JS 堆内存 | 6.8 MB → 39.1 MB | 内存激增 |
| 事件监听器 | 431 → 2,185 | 监听器过多 |
| Scripting | 2,167 ms | 脚本执行慢 |
| Rendering | 1,982 ms | 渲染耗时高 |

## 优化方案

### 1. 前端渲染优化

#### 虚拟滚动 (Virtual Scrolling)

使用 `react-window` 实现虚拟滚动，只渲染可见区域的笔记卡片。

```tsx
// 使用方式
import { VirtualizedNoteGrid } from '@/components/notes/virtualized-note-grid';

<VirtualizedNoteGrid notes={notes} />
```

**效果**：DOM 节点从 30,000+ 降至 ~100 个

#### 优化后的笔记卡片

`OptimizedNoteCard` 组件优化点：
- 使用 `React.memo` 避免不必要的重渲染
- 移除 `framer-motion` 动画（改用 CSS 动画）
- 移除 `TooltipProvider`（改用原生 `title` 属性）
- 移除 IndexedDB 同步状态检查（延迟加载）
- 使用事件委托减少事件监听器

#### 智能渲染策略

`NotesListClient` 组件根据数据量自动选择渲染策略：
- 少量笔记（<50）：直接渲染
- 大量笔记（>=50）：使用虚拟滚动

### 2. 后端数据优化

#### 数据库级分页

优化前：加载全部数据到内存，然后在内存中分页
优化后：使用 Prisma 的 `skip` 和 `take` 实现数据库级分页

```typescript
// 优化后的查询
const notes = await prisma.note.findMany({
  where: baseWhere,
  orderBy: { [sortBy]: sortOrder },
  skip: (page - 1) * pageSize,
  take: pageSize,
  select: {
    // 只选择需要的字段
    id: true,
    title: true,
    content: true,
    // ...
  }
})
```

**效果**：
- 减少数据传输量 90%+
- 减少服务器内存占用
- 加快响应速度

#### 并行查询

使用 `Promise.all` 并行执行计数和分页查询：

```typescript
const [totalCount, notes, collaborations] = await Promise.all([
  prisma.note.count({ where: baseWhere }),
  prisma.note.findMany({ ... }),
  prisma.collaborator.findMany({ ... })
])
```

### 3. 事件委托

将事件处理从每个卡片移到父容器，减少事件监听器数量：

```tsx
// 父组件统一处理
const handleNavigate = useCallback((noteId: string) => {
  router.push(`/notes/${noteId}`);
}, [router]);

// 传递给子组件
<OptimizedNoteCard 
  note={note}
  onNavigate={handleNavigate}
  onDelete={handleDelete}
/>
```

## 新增组件

| 组件 | 路径 | 用途 |
|------|------|------|
| `OptimizedNoteCard` | `src/components/notes/optimized-note-card.tsx` | 轻量级笔记卡片 |
| `VirtualizedNoteGrid` | `src/components/notes/virtualized-note-grid.tsx` | 虚拟滚动网格 |
| `NotesListClient` | `src/components/notes/notes-list-client.tsx` | 智能笔记列表 |

## 依赖

```bash
npm install react-window react-virtualized-auto-sizer
npm install -D @types/react-window @types/react-virtualized-auto-sizer
```

## 预期效果

| 指标 | 优化前 | 优化后 |
|------|--------|--------|
| DOM 节点数 | 32,275 | ~100-200 |
| JS 堆内存 | 39.1 MB | ~10 MB |
| 事件监听器 | 2,185 | ~100 |
| 首次渲染 | 4+ 秒 | <1 秒 |
| 滚动流畅度 | 卡顿 | 60 FPS |

## 使用建议

1. **大量数据场景**：使用 `VirtualizedNoteGrid`
2. **少量数据场景**：使用 `PaginatedNotesList`
3. **移动端**：使用 `VirtualizedNoteList`（单列）

## 后续优化方向

1. **图片懒加载**：使用 `IntersectionObserver` 延迟加载图片
2. **骨架屏**：在数据加载时显示骨架屏
3. **缓存策略**：使用 SWR 或 React Query 缓存数据
4. **Web Worker**：将搜索/过滤逻辑移到 Web Worker
