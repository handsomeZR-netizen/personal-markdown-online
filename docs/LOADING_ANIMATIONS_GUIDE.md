# 加载动画使用指南

## 概述

我们为应用添加了一套有趣且独特的加载动画系统，基于 shadcn/ui 和 Framer Motion 构建。这些动画不仅美观，而且易于使用和自定义。

## 可用的动画变体

### 1. Orbit（轨道旋转）⭐ 推荐
- 三个彩色小球围绕中心旋转
- 最有趣和独特的动画
- 适合：主要操作、全局加载

### 2. Pulse（脉冲波纹）
- 从中心向外扩散的波纹效果
- 适合：数据同步、网络请求

### 3. Dots（跳跃点）
- 四个点依次跳跃
- 适合：按钮内加载、小空间

### 4. Wave（波浪）
- 五个竖条形成波浪效果
- 适合：音频处理、数据加载

### 5. Bounce（弹跳方块）
- 旋转变形的方块
- 适合：文件上传、处理中

### 6. Flip（翻转卡片）
- 3D 翻转效果
- 适合：切换视图、刷新数据

## 使用方法

### 方法 1: 全局加载覆盖层

适用于需要阻止用户操作的全屏加载。

```tsx
import { useLoading } from '@/hooks/use-loading';

function MyComponent() {
  const { showLoading, hideLoading } = useLoading();

  const handleSave = async () => {
    showLoading('正在保存笔记...', 'orbit');
    try {
      await saveNote();
    } finally {
      hideLoading();
    }
  };

  return <button onClick={handleSave}>保存</button>;
}
```

### 方法 2: withLoading 包装器

自动处理加载状态的便捷方法。

```tsx
import { useLoadingAction } from '@/hooks/use-loading';

function MyComponent() {
  const { withLoading } = useLoadingAction();

  const handleSave = async () => {
    await withLoading(
      async () => {
        await saveNote();
      },
      '正在保存笔记...',
      'pulse'
    );
  };

  return <button onClick={handleSave}>保存</button>;
}
```

### 方法 3: LoadingButton 组件

带加载状态的按钮组件。

```tsx
import { LoadingButton } from '@/components/ui/loading-button';

function MyComponent() {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await doSomething();
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoadingButton
      loading={loading}
      loaderVariant="dots"
      onClick={handleClick}
    >
      保存
    </LoadingButton>
  );
}
```

### 方法 4: AsyncButton 组件

自动管理加载状态的异步按钮。

```tsx
import { AsyncButton } from '@/components/ui/loading-button';

function MyComponent() {
  return (
    <AsyncButton
      onClick={async () => {
        await saveNote();
      }}
      loaderVariant="wave"
      successMessage="保存成功！"
      errorMessage="保存失败"
    >
      保存笔记
    </AsyncButton>
  );
}
```

### 方法 5: LoadingContainer 组件

包装任何内容并显示加载状态。

```tsx
import { LoadingContainer } from '@/components/ui/with-loading';

function MyComponent() {
  const [loading, setLoading] = useState(true);

  return (
    <LoadingContainer
      isLoading={loading}
      variant="orbit"
      message="加载笔记列表..."
    >
      <NoteList />
    </LoadingContainer>
  );
}
```

### 方法 6: 覆盖层模式

在现有内容上显示加载覆盖层。

```tsx
import { LoadingContainer } from '@/components/ui/with-loading';

function MyComponent() {
  const [loading, setLoading] = useState(false);

  return (
    <LoadingContainer
      isLoading={loading}
      variant="pulse"
      message="正在刷新..."
      overlay={true}
    >
      <NoteList />
    </LoadingContainer>
  );
}
```

### 方法 7: 内联加载指示器

在文本旁边显示小型加载动画。

```tsx
import { InlineLoader } from '@/components/ui/with-loading';

function MyComponent() {
  return (
    <div>
      <InlineLoader variant="dots" message="正在同步..." />
    </div>
  );
}
```

## 实际应用示例

### 示例 1: 保存笔记

```tsx
import { AsyncButton } from '@/components/ui/loading-button';
import { saveNote } from '@/lib/actions/notes';

function NoteEditor({ noteId, content }) {
  return (
    <AsyncButton
      onClick={async () => {
        await saveNote(noteId, content);
      }}
      loaderVariant="orbit"
      successMessage="笔记已保存"
    >
      保存
    </AsyncButton>
  );
}
```

### 示例 2: 删除确认

```tsx
import { useLoading } from '@/hooks/use-loading';
import { deleteNote } from '@/lib/actions/notes';

function DeleteButton({ noteId }) {
  const { showLoading, hideLoading } = useLoading();

  const handleDelete = async () => {
    if (!confirm('确定要删除吗？')) return;
    
    showLoading('正在删除...', 'bounce');
    try {
      await deleteNote(noteId);
    } finally {
      hideLoading();
    }
  };

  return <button onClick={handleDelete}>删除</button>;
}
```

### 示例 3: 数据列表加载

```tsx
import { LoadingContainer } from '@/components/ui/with-loading';
import { useEffect, useState } from 'react';

function NoteList() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotes().then(data => {
      setNotes(data);
      setLoading(false);
    });
  }, []);

  return (
    <LoadingContainer
      isLoading={loading}
      variant="wave"
      message="加载笔记列表..."
    >
      {notes.map(note => (
        <NoteCard key={note.id} note={note} />
      ))}
    </LoadingContainer>
  );
}
```

### 示例 4: 表单提交

```tsx
import { LoadingButton } from '@/components/ui/loading-button';
import { useState } from 'react';

function LoginForm() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="email" />
      <input type="password" />
      <LoadingButton
        type="submit"
        loading={loading}
        loaderVariant="pulse"
        loadingText="登录中..."
      >
        登录
      </LoadingButton>
    </form>
  );
}
```

## 最佳实践

### 1. 选择合适的动画变体

- **快速操作（< 1秒）**: 使用 `dots` 或 `wave`
- **中等操作（1-3秒）**: 使用 `orbit` 或 `pulse`
- **长时间操作（> 3秒）**: 使用 `bounce` 或 `flip`

### 2. 提供有意义的消息

```tsx
// ❌ 不好
showLoading('加载中...');

// ✅ 好
showLoading('正在保存笔记...');
showLoading('正在上传图片...');
showLoading('正在同步数据...');
```

### 3. 避免加载闪烁

对于快速操作，使用最小加载时间：

```tsx
const [loading, setLoading] = useState(false);

const handleQuickAction = async () => {
  setLoading(true);
  const startTime = Date.now();
  
  await quickAction();
  
  // 确保至少显示 300ms
  const elapsed = Date.now() - startTime;
  if (elapsed < 300) {
    await new Promise(resolve => setTimeout(resolve, 300 - elapsed));
  }
  
  setLoading(false);
};
```

### 4. 组合使用

```tsx
function ComplexOperation() {
  const { withLoading } = useLoadingAction();
  const [uploading, setUploading] = useState(false);

  return (
    <div>
      {/* 全局加载 */}
      <AsyncButton
        onClick={() => withLoading(
          async () => await saveAll(),
          '正在保存所有更改...',
          'orbit'
        )}
      >
        保存全部
      </AsyncButton>

      {/* 局部加载 */}
      <LoadingButton
        loading={uploading}
        loaderVariant="bounce"
        onClick={async () => {
          setUploading(true);
          await uploadImage();
          setUploading(false);
        }}
      >
        上传图片
      </LoadingButton>
    </div>
  );
}
```

## 查看演示

访问 `/loading-demo` 页面查看所有动画效果的实时演示和交互式示例。

## 性能考虑

- 所有动画使用 CSS transforms 和 Framer Motion，性能优异
- 动画在 GPU 上运行，不会阻塞主线程
- 支持暗色模式
- 响应式设计，适配所有屏幕尺寸

## 自定义样式

你可以通过 className 属性自定义样式：

```tsx
<CreativeLoader
  variant="orbit"
  size="md"
  className="my-custom-class"
  message="自定义消息"
/>
```

## 无障碍支持

所有加载组件都包含适当的 ARIA 属性：

- `role="status"`
- `aria-live="polite"`
- `aria-busy="true"`

## 故障排查

### 问题：加载动画不显示

确保已在根布局中添加 `LoadingProvider`：

```tsx
// app/layout.tsx
import { LoadingProvider } from '@/hooks/use-loading';

export default function RootLayout({ children }) {
  return (
    <LoadingProvider>
      {children}
    </LoadingProvider>
  );
}
```

### 问题：动画卡顿

检查是否有大量的重渲染或复杂的计算阻塞了主线程。

### 问题：TypeScript 错误

确保已安装所有必要的类型定义：

```bash
npm install --save-dev @types/react @types/react-dom
```

## 更多资源

- [Framer Motion 文档](https://www.framer.com/motion/)
- [shadcn/ui 文档](https://ui.shadcn.com/)
- [React 性能优化](https://react.dev/learn/render-and-commit)
