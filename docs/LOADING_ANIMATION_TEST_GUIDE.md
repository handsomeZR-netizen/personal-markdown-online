# 加载动画测试指南

## 概述

本文档介绍了优化后的加载动画系统及其测试方法。

## 新增组件

### 1. ClickLoader - 点击加载器

8种点击反馈动画效果：

| 变体 | 描述 | 适用场景 |
|------|------|----------|
| `ripple` | 水波纹扩散 | 按钮点击、卡片点击 |
| `pulse` | 脉冲闪烁 | 状态指示、心跳效果 |
| `spinner` | 旋转圆环 | 通用加载 |
| `dots` | 跳动点 | 按钮内加载 |
| `progress` | 进度条 | 线性进度 |
| `bounce` | 弹跳 | 活泼的加载效果 |
| `morph` | 形变 | 创意加载 |
| `glow` | 发光 | 高亮加载 |

```tsx
import { ClickLoader, ClickLoadingProvider, useClickLoading } from '@/components/ui/click-loader';

// 基础使用
<ClickLoader variant="spinner" size="md" />

// 带上下文的使用
<ClickLoadingProvider>
  <YourComponent />
</ClickLoadingProvider>

// 在组件中使用 hook
const { withClickLoading, isLoading } = useClickLoading();
await withClickLoading('action-key', async () => {
  // 异步操作
});
```

### 2. InteractiveLoader - 交互式加载器

带有点击反馈效果的容器组件：

```tsx
import { InteractiveLoader, CardLoader, ListItemLoader } from '@/components/ui/interactive-loader';

// 交互式容器 - 带水波纹效果
<InteractiveLoader onClick={handleClick} loaderVariant="ripple">
  <div>点击我</div>
</InteractiveLoader>

// 卡片加载效果
<CardLoader isLoading={loading} loadingMessage="加载中...">
  <CardContent />
</CardLoader>

// 列表项加载效果
<ListItemLoader isLoading={loading} index={0}>
  <ListItem />
</ListItemLoader>
```

### 3. ButtonLoaderWrapper & IconButtonLoader

按钮加载包装器：

```tsx
import { ButtonLoaderWrapper, IconButtonLoader } from '@/components/ui/interactive-loader';

// 按钮包装器
<ButtonLoaderWrapper onClick={async () => await saveData()}>
  保存
</ButtonLoaderWrapper>

// 图标按钮
<IconButtonLoader
  icon={<Heart />}
  onClick={async () => await toggleFavorite()}
  title="收藏"
/>
```

## 测试页面

访问 `/test-loading` 页面进行交互式测试。

### 测试内容

1. **创意加载器** - 6种动画变体展示
2. **点击加载器** - 8种点击反馈效果
3. **交互式加载** - 卡片、列表项加载效果
4. **按钮加载** - 各种按钮加载状态
5. **场景测试** - 真实使用场景模拟

## 单元测试

运行测试：

```bash
npm run test -- --run src/components/ui/__tests__/loading-components.test.tsx
```

### 测试覆盖

- ✅ CreativeLoader (5 tests)
- ✅ LoadingOverlay (4 tests)
- ✅ ButtonLoader (2 tests)
- ✅ ClickLoader (4 tests)
- ✅ ClickLoadingProvider (3 tests)
- ✅ LoadingButton (5 tests)
- ✅ AsyncButton (3 tests)
- ✅ LoadingContainer (3 tests)
- ✅ InlineLoader (3 tests)
- ✅ CardLoader (3 tests)
- ✅ ListItemLoader (3 tests)
- ✅ ButtonLoaderWrapper (3 tests)
- ✅ IconButtonLoader (3 tests)
- ✅ InteractiveLoader (3 tests)

**总计: 47 个测试全部通过**

## 使用示例

### 笔记卡片点击加载

```tsx
import { CardLoader } from '@/components/ui/interactive-loader';

function NoteCard({ note }) {
  const [loading, setLoading] = useState(false);
  
  const handleClick = async () => {
    setLoading(true);
    await router.push(`/notes/${note.id}`);
    setLoading(false);
  };
  
  return (
    <CardLoader isLoading={loading} loadingMessage="正在打开笔记...">
      <Card onClick={handleClick}>
        <CardTitle>{note.title}</CardTitle>
        <CardContent>{note.content}</CardContent>
      </Card>
    </CardLoader>
  );
}
```

### 删除按钮加载

```tsx
import { IconButtonLoader } from '@/components/ui/interactive-loader';
import { Trash2 } from 'lucide-react';

function DeleteButton({ onDelete }) {
  return (
    <IconButtonLoader
      icon={<Trash2 className="w-4 h-4" />}
      onClick={async () => {
        if (confirm('确定删除?')) {
          await onDelete();
        }
      }}
      title="删除"
    />
  );
}
```

### 表单提交加载

```tsx
import { LoadingButton } from '@/components/ui/loading-button';

function SubmitForm() {
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async () => {
    setLoading(true);
    await submitForm();
    setLoading(false);
  };
  
  return (
    <LoadingButton
      loading={loading}
      onClick={handleSubmit}
      loaderVariant="orbit"
    >
      提交
    </LoadingButton>
  );
}
```

## 配置选项

在 `src/config/loading.config.ts` 中可以自定义：

- 默认动画变体
- 不同场景的推荐动画
- 时间配置（最小加载时间、超时等）
- 重试配置
- UI 配置（模糊背景、消息显示等）

## 性能优化

1. **最小加载时间** - 避免闪烁，默认 300ms
2. **GPU 加速** - 使用 transform 和 opacity 动画
3. **懒加载** - 动画组件按需加载
4. **防抖/节流** - 避免频繁触发

## 无障碍支持

- 所有加载状态都有 `aria-live` 属性
- 加载按钮在加载时自动禁用
- 支持键盘导航
- 提供加载消息文本
