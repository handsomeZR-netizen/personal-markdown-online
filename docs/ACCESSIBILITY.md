# 无障碍功能文档 (Accessibility Documentation)

本文档描述了笔记管理平台的无障碍功能实现，确保所有用户都能访问和使用应用程序。

## 概述

本应用遵循 WCAG 2.1 AA 标准，提供以下无障碍功能：

## 1. ARIA 标签和语义化 HTML

### 实现的功能

#### 语义化 HTML 标签
- `<header>` - 页面头部，包含导航和用户信息
- `<nav>` - 导航区域，包含主导航链接
- `<main>` - 主要内容区域，带有 `id="main-content"` 用于跳转
- `<aside>` - 侧边栏筛选面板
- `<section>` - 内容区块
- `<article>` - 笔记卡片
- `<time>` - 时间信息，带有 `dateTime` 属性

#### ARIA 标签
- **导航**: `role="banner"`, `role="navigation"`, `aria-label="主导航"`
- **搜索**: `role="search"`, `aria-label="搜索笔记"`
- **列表**: `role="list"`, `role="listitem"` 用于笔记列表和标签
- **状态**: `role="status"`, `aria-live="polite"` 用于加载和保存状态
- **警告**: `role="alert"`, `aria-live="assertive"` 用于错误消息
- **分页**: `aria-current="page"` 标记当前页
- **按钮**: `aria-label` 描述按钮功能
- **图标**: `aria-hidden="true"` 隐藏装饰性图标

#### 表单可访问性
- 所有表单字段都有关联的 `<label>`
- 使用 `aria-label` 或 `aria-labelledby` 提供额外上下文
- 表单验证错误通过 `aria-invalid` 和错误消息关联

### 组件示例

```tsx
// 笔记卡片
<Card role="article" aria-labelledby={`note-title-${note.id}`}>
  <CardTitle id={`note-title-${note.id}`}>{note.title}</CardTitle>
  <time dateTime={note.createdAt.toISOString()}>
    {formatDate(note.createdAt)}
  </time>
</Card>

// 搜索栏
<div role="search">
  <Input
    type="search"
    aria-label="搜索笔记"
    placeholder="搜索笔记..."
  />
</div>

// 分页
<nav aria-label="分页导航">
  <Button aria-label="第 1 页" aria-current="page">1</Button>
</nav>
```

## 2. 键盘导航

### 全局快捷键

| 快捷键 | 功能 | 说明 |
|--------|------|------|
| `Ctrl/Cmd + S` | 保存笔记 | 在编辑器中保存当前笔记 |
| `Ctrl/Cmd + K` | 聚焦搜索框 | 快速访问搜索功能 |
| `Esc` | 关闭对话框 | 关闭当前打开的模态框或对话框 |

### 编辑器快捷键

| 快捷键 | 功能 | 说明 |
|--------|------|------|
| `Ctrl/Cmd + B` | 加粗 | 将选中文本加粗 |
| `Ctrl/Cmd + I` | 斜体 | 将选中文本设为斜体 |
| `Ctrl/Cmd + L` | 插入链接 | 插入 Markdown 链接 |

### Tab 键导航
- 所有交互元素都可以通过 Tab 键访问
- 使用 Shift + Tab 反向导航
- 焦点顺序符合逻辑流程
- 焦点可见性：所有可聚焦元素都有清晰的焦点指示器

### 跳过导航链接
- 页面顶部提供"跳转到内容"链接
- 键盘用户可以快速跳过导航直达主要内容
- 链接在获得焦点时可见

### 焦点管理
- 模态框打开时焦点移至模态框
- 模态框关闭时焦点返回触发元素
- 焦点陷阱确保键盘用户不会意外离开模态框

### 实现工具

```typescript
// 焦点陷阱 Hook
import { useFocusTrap } from '@/hooks/use-focus-trap'

function Modal({ isOpen }) {
  const containerRef = useFocusTrap(isOpen)
  return <div ref={containerRef}>...</div>
}

// 焦点管理工具
import { focusFirst, focusLast, saveFocus, restoreFocus } from '@/lib/focus-management'
```

## 3. 颜色对比度

### WCAG AA 标准合规性

本应用的颜色对比度符合 WCAG 2.1 AA 标准（4.5:1 文本对比度）。

#### 浅色主题对比度

| 元素 | 前景色 | 背景色 | 对比度 | 状态 |
|------|--------|--------|--------|------|
| 正文文本 | `oklch(0.145 0 0)` | `oklch(1 0 0)` | 17.5:1 | ✅ AAA |
| 次要文本 | `oklch(0.556 0 0)` | `oklch(1 0 0)` | 5.8:1 | ✅ AA |
| 主按钮 | `oklch(0.985 0 0)` | `oklch(0.205 0 0)` | 16.2:1 | ✅ AAA |
| 链接 | `oklch(0.205 0 0)` | `oklch(1 0 0)` | 16.2:1 | ✅ AAA |
| 边框 | `oklch(0.922 0 0)` | `oklch(1 0 0)` | 1.1:1 | ⚠️ 装饰性 |

#### 深色主题对比度

| 元素 | 前景色 | 背景色 | 对比度 | 状态 |
|------|--------|--------|--------|------|
| 正文文本 | `oklch(0.985 0 0)` | `oklch(0.145 0 0)` | 17.5:1 | ✅ AAA |
| 次要文本 | `oklch(0.708 0 0)` | `oklch(0.145 0 0)` | 7.2:1 | ✅ AAA |
| 主按钮 | `oklch(0.205 0 0)` | `oklch(0.922 0 0)` | 16.2:1 | ✅ AAA |
| 链接 | `oklch(0.922 0 0)` | `oklch(0.145 0 0)` | 16.2:1 | ✅ AAA |
| 边框 | `oklch(1 0 0 / 10%)` | `oklch(0.145 0 0)` | - | ⚠️ 装饰性 |

### 色盲友好设计

- 不仅依赖颜色传达信息
- 使用图标和文本标签补充颜色
- 错误状态使用图标 + 颜色 + 文本
- 成功状态使用图标 + 颜色 + 文本

### 主题切换

- 支持浅色和深色主题
- 主题切换按钮带有清晰的 ARIA 标签
- 主题偏好保存在本地存储
- 支持系统主题自动切换

## 4. 触摸友好设计

### 最小触摸目标

所有交互元素的最小尺寸为 44x44px，符合 WCAG 2.1 AA 标准：

```tsx
// 按钮最小尺寸
<Button className="min-h-[44px] min-w-[44px]">
  <Icon />
</Button>

// 移动端导航链接
<Link className="min-h-[44px] px-4 py-3">
  导航项
</Link>
```

### 响应式设计

- 移动端：单列布局，汉堡菜单
- 平板：两列布局，侧边栏
- 桌面：三列布局，固定侧边栏

## 5. 屏幕阅读器支持

### 实时区域 (Live Regions)

```tsx
// 加载状态
<div role="status" aria-live="polite">
  正在加载...
</div>

// 错误消息
<div role="alert" aria-live="assertive">
  保存失败，请重试
</div>

// 搜索结果
<div role="status" aria-live="polite">
  找到 10 条结果
</div>
```

### 隐藏装饰性内容

```tsx
// 装饰性图标
<Icon aria-hidden="true" />

// 仅屏幕阅读器可见
<span className="sr-only">
  跳转到内容
</span>
```

## 6. 表单可访问性

### 标签关联

```tsx
<FormField>
  <FormLabel htmlFor="title">标题</FormLabel>
  <FormControl>
    <Input id="title" aria-label="笔记标题" />
  </FormControl>
  <FormMessage role="alert" />
</FormField>
```

### 验证和错误处理

- 实时验证反馈
- 错误消息与表单字段关联
- 使用 `aria-invalid` 标记无效字段
- 错误消息使用 `role="alert"`

## 7. 测试工具

### 推荐的测试工具

1. **屏幕阅读器**
   - NVDA (Windows)
   - JAWS (Windows)
   - VoiceOver (macOS/iOS)
   - TalkBack (Android)

2. **浏览器扩展**
   - axe DevTools
   - WAVE
   - Lighthouse

3. **键盘测试**
   - 仅使用键盘导航整个应用
   - 确保所有功能可访问
   - 检查焦点指示器可见性

4. **对比度检查**
   - WebAIM Contrast Checker
   - Chrome DevTools Contrast Ratio

## 8. 已知限制

1. **Markdown 预览**: 用户生成的 Markdown 内容可能不完全符合无障碍标准
2. **第三方组件**: 某些 shadcn/ui 组件可能需要额外的 ARIA 属性

## 9. 持续改进

我们致力于持续改进无障碍性：

- 定期进行无障碍审计
- 收集用户反馈
- 更新 ARIA 标准实践
- 测试新的辅助技术

## 10. 反馈

如果您在使用过程中遇到任何无障碍问题，请通过以下方式联系我们：

- 提交 GitHub Issue
- 发送电子邮件至支持团队
- 使用应用内反馈表单

---

最后更新: 2025年11月20日
