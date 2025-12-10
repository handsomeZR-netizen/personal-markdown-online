# 加载系统导入参考

## 快速导入

### 方式 1: 统一导入（推荐）

```tsx
// 从统一入口导入所有内容
import {
  // 组件
  CreativeLoader,
  LoadingButton,
  AsyncButton,
  LoadingContainer,
  InlineLoader,
  
  // Hooks
  useLoading,
  useLoadingAction,
  useSmartLoading,
  
  // 配置
  getLoaderVariant,
  getLoadingMessage,
} from '@/components/ui/loading';
```

### 方式 2: 按需导入

```tsx
// 只导入需要的组件
import { AsyncButton } from '@/components/ui/loading-button';
import { useLoading } from '@/hooks/use-loading';
import { CreativeLoader } from '@/components/ui/creative-loader';
```

## 完整导入清单

### 核心组件

```tsx
// 创意加载动画
import {
  CreativeLoader,      // 主加载动画组件
  LoadingOverlay,      // 全屏加载覆盖层
  ButtonLoader,        // 按钮内小型加载器
  type LoaderVariant,  // 动画变体类型
} from '@/components/ui/creative-loader';

// 加载按钮
import {
  LoadingButton,           // 带加载状态的按钮
  AsyncButton,             // 自动处理异步的按钮
  type LoadingButtonProps, // 按钮属性类型
} from '@/components/ui/loading-button';

// 加载容器
import {
  withLoading,        // HOC：为组件添加加载状态
  LoadingContainer,   // 容器组件
  InlineLoader,       // 内联加载指示器
} from '@/components/ui/with-loading';
```

### Hooks

```tsx
// 基础加载 Hooks
import {
  LoadingProvider,    // Provider 组件（已在 layout.tsx 中）
  useLoading,         // 全局加载状态
  useLoadingAction,   // withLoading 包装器
} from '@/hooks/use-loading';

// 高级加载 Hooks
import {
  useSmartLoading,      // 智能加载（带重试、超时）
  useLoadingStates,     // 多状态管理
  useDebouncedLoading,  // 防抖加载
  useBatchProgress,     // 批量操作进度
  useAutoRetry,         // 自动重试
  usePolling,           // 轮询加载
} from '@/hooks/use-smart-loading';
```

### 工具函数

```tsx
// 加载辅助函数
import {
  withMinLoadingTime,      // 确保最小加载时间
  withTimeout,             // 带超时
  withRetry,               // 重试机制
  withProgress,            // 进度跟踪
  debounceLoading,         // 防抖
  throttleLoading,         // 节流
  withConcurrencyLimit,    // 并发控制
  smartLoading,            // 智能加载
  createLoadingManager,    // 创建加载管理器
  createCachedLoader,      // 缓存加载器
  LoadingStateManager,     // 加载状态管理类
} from '@/lib/utils/loading-helpers';
```

### 配置

```tsx
// 加载配置
import {
  loadingConfig,           // 完整配置对象
  getLoaderVariant,        // 获取场景对应的动画
  getLoadingMessage,       // 获取操作对应的消息
  shouldShowLoading,       // 判断是否显示加载
  applyUserPreferences,    // 应用用户偏好
  type LoadingScenario,    // 场景类型
  type LoadingMessage,     // 消息类型
} from '@/config/loading.config';
```

## 使用示例

### 示例 1: 最简单的用法

```tsx
import { AsyncButton } from '@/components/ui/loading';

<AsyncButton onClick={async () => await save()}>
  保存
</AsyncButton>
```

### 示例 2: 全局加载

```tsx
import { useLoading } from '@/components/ui/loading';

const { showLoading, hideLoading } = useLoading();

showLoading('处理中...', 'orbit');
await doSomething();
hideLoading();
```

### 示例 3: 智能加载

```tsx
import { useSmartLoading, getLoaderVariant } from '@/components/ui/loading';

const { loading, execute } = useSmartLoading({
  minTime: 300,
  maxTime: 10000,
  retries: 3,
});

await execute(async () => {
  return await fetchData();
});
```

### 示例 4: 批量操作

```tsx
import { useBatchProgress, LoadingButton } from '@/components/ui/loading';

const { progress, loading, execute } = useBatchProgress();

<LoadingButton loading={loading}>
  处理 {progress.current}/{progress.total}
</LoadingButton>
```

### 示例 5: 使用配置

```tsx
import {
  AsyncButton,
  getLoaderVariant,
  getLoadingMessage,
} from '@/components/ui/loading';

<AsyncButton
  onClick={async () => await save()}
  loaderVariant={getLoaderVariant('save')}
  loadingText={getLoadingMessage('saving')}
>
  保存
</AsyncButton>
```

## 类型定义

### LoaderVariant

```tsx
type LoaderVariant = 'dots' | 'pulse' | 'orbit' | 'wave' | 'bounce' | 'flip';
```

### LoadingButtonProps

```tsx
interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loaderVariant?: LoaderVariant;
  loadingText?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}
```

### LoadingScenario

```tsx
type LoadingScenario = 
  | 'save'
  | 'delete'
  | 'list'
  | 'sync'
  | 'upload'
  | 'button'
  | 'refresh'
  | 'search';
```

## 推荐的导入模式

### 对于简单场景

```tsx
// 只需要按钮
import { AsyncButton } from '@/components/ui/loading-button';

// 只需要全局加载
import { useLoading } from '@/hooks/use-loading';
```

### 对于复杂场景

```tsx
// 统一导入
import {
  AsyncButton,
  LoadingButton,
  useLoading,
  useSmartLoading,
  LoadingContainer,
  getLoaderVariant,
} from '@/components/ui/loading';
```

### 对于类型定义

```tsx
import type {
  LoaderVariant,
  LoadingButtonProps,
  LoadingScenario,
} from '@/components/ui/loading';
```

## Tree-shaking 优化

所有导出都支持 tree-shaking，只会打包你实际使用的代码：

```tsx
// ✅ 好 - 只打包 AsyncButton
import { AsyncButton } from '@/components/ui/loading';

// ✅ 也好 - 直接导入
import { AsyncButton } from '@/components/ui/loading-button';

// ❌ 避免 - 导入整个模块
import * as Loading from '@/components/ui/loading';
```

## 常见导入组合

### 组合 1: 表单提交

```tsx
import { LoadingButton, useLoading } from '@/components/ui/loading';
```

### 组合 2: 数据列表

```tsx
import { LoadingContainer, InlineLoader } from '@/components/ui/loading';
```

### 组合 3: 复杂操作

```tsx
import {
  useLoading,
  useSmartLoading,
  useBatchProgress,
  AsyncButton,
} from '@/components/ui/loading';
```

### 组合 4: 自定义加载

```tsx
import {
  CreativeLoader,
  type LoaderVariant,
  loadingConfig,
} from '@/components/ui/loading';
```

## 迁移指南

### 从旧的导入方式迁移

**之前：**
```tsx
import { LoadingSpinner } from '@/components/loading/upload-indicator';
import { LoadingOverlay } from '@/components/loading/upload-indicator';
```

**现在：**
```tsx
import { CreativeLoader, LoadingOverlay } from '@/components/ui/loading';
```

## 更多资源

- 完整文档：`doc/LOADING_ANIMATIONS_GUIDE.md`
- 快速入门：`doc/LOADING_QUICK_START.md`
- 使用示例：`src/components/examples/loading-usage-example.tsx`
- 在线演示：`/loading-demo`
