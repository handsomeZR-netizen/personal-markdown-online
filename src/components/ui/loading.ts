/**
 * 加载动画系统统一导出
 * 
 * 从这个文件导入所有加载相关的组件和 Hooks
 */

// 组件
export {
  CreativeLoader,
  LoadingOverlay,
  ButtonLoader,
  type LoaderVariant,
} from './creative-loader';

export {
  LoadingButton,
  AsyncButton,
  type LoadingButtonProps,
} from './loading-button';

export {
  withLoading,
  LoadingContainer,
  InlineLoader,
} from './with-loading';

// 点击加载组件
export {
  ClickLoader,
  ClickLoadingProvider,
  useClickLoading,
  ClickableWithLoader,
  type ClickLoaderVariant,
} from './click-loader';

// 交互式加载组件
export {
  InteractiveLoader,
  CardLoader,
  ListItemLoader,
  ButtonLoaderWrapper,
  IconButtonLoader,
} from './interactive-loader';

// Hooks
export {
  LoadingProvider,
  useLoading,
  useLoadingAction,
} from '@/hooks/use-loading';

export {
  useSmartLoading,
  useLoadingStates,
  useDebouncedLoading,
  useBatchProgress,
  useAutoRetry,
  usePolling,
} from '@/hooks/use-smart-loading';

// 工具函数
export {
  withMinLoadingTime,
  withTimeout,
  withRetry,
  withProgress,
  debounceLoading,
  throttleLoading,
  withConcurrencyLimit,
  smartLoading,
  createLoadingManager,
  createCachedLoader,
  LoadingStateManager,
} from '@/lib/utils/loading-helpers';

// 配置
export {
  loadingConfig,
  getLoaderVariant,
  getLoadingMessage,
  shouldShowLoading,
  applyUserPreferences,
  type LoadingScenario,
  type LoadingMessage,
} from '@/config/loading.config';
