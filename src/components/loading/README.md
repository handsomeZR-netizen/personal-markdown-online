# Loading Components

这个目录包含所有与加载状态相关的组件。

## 组件列表

### 现有组件

- `upload-indicator.tsx` - 文件上传进度指示器
- `note-list-skeleton.tsx` - 笔记列表骨架屏
- `folder-tree-skeleton.tsx` - 文件夹树骨架屏

### 新增组件

- `loading-examples.tsx` - 加载动画使用示例和演示

## 新的加载系统

我们添加了一套全新的创意加载动画系统！

### 核心组件位置

- `src/components/ui/creative-loader.tsx` - 创意加载动画
- `src/components/ui/loading-button.tsx` - 加载按钮
- `src/components/ui/with-loading.tsx` - 加载容器

### 快速使用

```tsx
// 1. 简单按钮加载
import { AsyncButton } from '@/components/ui/loading-button';

<AsyncButton onClick={async () => await save()} loaderVariant="orbit">
  保存
</AsyncButton>

// 2. 全局加载
import { useLoading } from '@/hooks/use-loading';

const { showLoading, hideLoading } = useLoading();
showLoading('处理中...', 'orbit');

// 3. 容器加载
import { LoadingContainer } from '@/components/ui/with-loading';

<LoadingContainer isLoading={loading} variant="wave">
  <Content />
</LoadingContainer>
```

### 查看演示

访问 `/loading-demo` 查看所有动画效果的实时演示。

### 完整文档

- 快速入门：`doc/LOADING_QUICK_START.md`
- 完整指南：`doc/LOADING_ANIMATIONS_GUIDE.md`
- 系统总结：`doc/LOADING_SYSTEM_SUMMARY.md`

## 迁移指南

### 从旧的 LoadingSpinner 迁移

**之前：**
```tsx
import { LoadingSpinner } from '@/components/loading/upload-indicator';
<LoadingSpinner size="md" />
```

**现在：**
```tsx
import { CreativeLoader } from '@/components/ui/creative-loader';
<CreativeLoader variant="orbit" size="md" />
```

### 从旧的 LoadingOverlay 迁移

**之前：**
```tsx
import { LoadingOverlay } from '@/components/loading/upload-indicator';
<LoadingOverlay message="加载中..." />
```

**现在：**
```tsx
import { useLoading } from '@/hooks/use-loading';
const { showLoading, hideLoading } = useLoading();
showLoading('加载中...', 'orbit');
```

## 推荐使用

对于新功能，推荐使用新的加载系统：

1. **按钮操作** → `AsyncButton` 或 `LoadingButton`
2. **全屏加载** → `useLoading` Hook
3. **区域加载** → `LoadingContainer`
4. **内联加载** → `InlineLoader`

旧的组件（LoadingSpinner、LoadingOverlay）仍然可用，但新的系统提供了更好的用户体验和更多功能。
