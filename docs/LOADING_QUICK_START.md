# 加载动画快速入门

## 5 分钟快速集成

### 步骤 1: 确认 LoadingProvider 已添加

检查 `src/app/layout.tsx` 是否已包含 `LoadingProvider`（已完成✅）

### 步骤 2: 选择使用场景

#### 场景 A: 按钮点击后的异步操作

**之前的代码：**
```tsx
<button onClick={async () => {
  await saveNote();
}}>
  保存
</button>
```

**更新后（方案 1 - 最简单）：**
```tsx
import { AsyncButton } from '@/components/ui/loading-button';

<AsyncButton
  onClick={async () => {
    await saveNote();
  }}
  loaderVariant="orbit"
>
  保存
</AsyncButton>
```

**更新后（方案 2 - 更多控制）：**
```tsx
import { LoadingButton } from '@/components/ui/loading-button';
import { useState } from 'react';

const [loading, setLoading] = useState(false);

<LoadingButton
  loading={loading}
  loaderVariant="dots"
  onClick={async () => {
    setLoading(true);
    try {
      await saveNote();
    } finally {
      setLoading(false);
    }
  }}
>
  保存
</LoadingButton>
```

#### 场景 B: 全屏加载（阻止用户操作）

```tsx
import { useLoading } from '@/hooks/use-loading';

function MyComponent() {
  const { showLoading, hideLoading } = useLoading();

  const handleDelete = async () => {
    showLoading('正在删除...', 'bounce');
    try {
      await deleteNote();
    } finally {
      hideLoading();
    }
  };
}
```

#### 场景 C: 列表/内容区域加载

```tsx
import { LoadingContainer } from '@/components/ui/with-loading';

function NoteList() {
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    fetchNotes().then(data => {
      setNotes(data);
      setLoading(false);
    });
  }, []);

  return (
    <LoadingContainer isLoading={loading} variant="wave">
      {notes.map(note => <NoteCard key={note.id} note={note} />)}
    </LoadingContainer>
  );
}
```

## 推荐的动画选择

| 操作类型 | 推荐动画 | 原因 |
|---------|---------|------|
| 保存/更新 | `orbit` | 视觉吸引力强，表示处理中 |
| 删除 | `bounce` | 动态感强，引起注意 |
| 加载列表 | `wave` | 流畅，适合数据流 |
| 同步数据 | `pulse` | 波纹效果表示数据传输 |
| 按钮内加载 | `dots` | 小巧，不占空间 |
| 上传文件 | `flip` | 独特，表示转换过程 |

## 常见模式

### 模式 1: 表单提交

```tsx
import { AsyncButton } from '@/components/ui/loading-button';

<form onSubmit={(e) => {
  e.preventDefault();
  // AsyncButton 会自动处理
}}>
  <input name="title" />
  <AsyncButton
    type="submit"
    onClick={async () => {
      await submitForm();
    }}
    loaderVariant="orbit"
    successMessage="提交成功！"
  >
    提交
  </AsyncButton>
</form>
```

### 模式 2: 确认对话框

```tsx
import { useLoading } from '@/hooks/use-loading';

const { showLoading, hideLoading } = useLoading();

const handleDelete = async () => {
  if (!confirm('确定删除？')) return;
  
  showLoading('正在删除...', 'bounce');
  await deleteItem();
  hideLoading();
};
```

### 模式 3: 多步骤操作

```tsx
import { useLoadingAction } from '@/hooks/use-loading';

const { withLoading } = useLoadingAction();

const handleComplexOperation = async () => {
  await withLoading(
    async () => {
      await step1();
      await step2();
      await step3();
    },
    '正在处理，请稍候...',
    'orbit'
  );
};
```

## 实际改造示例

### 改造前：普通按钮

```tsx
// src/components/notes/note-card.tsx
export function NoteCard({ note }) {
  const handleDelete = async () => {
    await deleteNote(note.id);
  };

  return (
    <div>
      <h3>{note.title}</h3>
      <button onClick={handleDelete}>删除</button>
    </div>
  );
}
```

### 改造后：带加载动画

```tsx
// src/components/notes/note-card.tsx
import { AsyncButton } from '@/components/ui/loading-button';

export function NoteCard({ note }) {
  return (
    <div>
      <h3>{note.title}</h3>
      <AsyncButton
        onClick={async () => {
          await deleteNote(note.id);
        }}
        loaderVariant="bounce"
        variant="destructive"
        size="sm"
      >
        删除
      </AsyncButton>
    </div>
  );
}
```

## 测试你的集成

1. 访问 `/loading-demo` 查看所有动画效果
2. 选择你喜欢的动画变体
3. 在你的组件中应用
4. 测试加载状态是否正常显示

## 需要帮助？

- 查看完整文档：`doc/LOADING_ANIMATIONS_GUIDE.md`
- 查看示例代码：`src/components/loading/loading-examples.tsx`
- 访问演示页面：`http://localhost:3000/loading-demo`

## 下一步

现在你可以：
1. 更新现有的按钮组件
2. 为异步操作添加加载状态
3. 改善用户体验
4. 让应用看起来更专业

开始改造你的第一个组件吧！🚀
