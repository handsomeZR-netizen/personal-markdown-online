import { LoaderVariant } from '@/components/ui/creative-loader';

/**
 * 加载动画配置
 * 
 * 在这里自定义应用的默认加载动画设置
 */

export const loadingConfig = {
  // 默认动画变体
  defaultVariant: 'orbit' as LoaderVariant,

  // 不同场景的推荐动画
  variants: {
    // 保存操作
    save: 'orbit' as LoaderVariant,
    
    // 删除操作
    delete: 'bounce' as LoaderVariant,
    
    // 加载列表
    list: 'wave' as LoaderVariant,
    
    // 同步数据
    sync: 'pulse' as LoaderVariant,
    
    // 上传文件
    upload: 'flip' as LoaderVariant,
    
    // 按钮内加载
    button: 'dots' as LoaderVariant,
    
    // 刷新操作
    refresh: 'flip' as LoaderVariant,
    
    // 搜索操作
    search: 'wave' as LoaderVariant,
  },

  // 时间配置（毫秒）
  timing: {
    // 最小加载时间，避免闪烁
    minLoadingTime: 300,
    
    // 最大加载时间，超时提示
    maxLoadingTime: 30000,
    
    // 防抖延迟
    debounceDelay: 300,
    
    // 节流间隔
    throttleInterval: 1000,
    
    // 重试延迟
    retryDelay: 1000,
  },

  // 重试配置
  retry: {
    // 最大重试次数
    maxRetries: 3,
    
    // 是否启用指数退避
    exponentialBackoff: true,
  },

  // 消息配置
  messages: {
    // 默认加载消息
    default: '加载中...',
    
    // 常用操作消息
    saving: '正在保存...',
    deleting: '正在删除...',
    loading: '正在加载...',
    syncing: '正在同步...',
    uploading: '正在上传...',
    processing: '正在处理...',
    searching: '正在搜索...',
    
    // 错误消息
    timeout: '操作超时，请重试',
    error: '操作失败，请重试',
    networkError: '网络错误，请检查连接',
  },

  // UI 配置
  ui: {
    // 是否启用模糊背景
    blurBackground: true,
    
    // 是否显示加载消息
    showMessage: true,
    
    // 默认尺寸
    defaultSize: 'md' as 'sm' | 'md' | 'lg',
    
    // 是否启用动画
    enableAnimations: true,
  },

  // 性能配置
  performance: {
    // 是否启用 GPU 加速
    useGPU: true,
    
    // 是否减少动画（低性能设备）
    reduceMotion: false,
  },
};

/**
 * 获取场景对应的加载动画
 */
export function getLoaderVariant(scenario: keyof typeof loadingConfig.variants): LoaderVariant {
  return loadingConfig.variants[scenario] || loadingConfig.defaultVariant;
}

/**
 * 获取操作对应的加载消息
 */
export function getLoadingMessage(action: keyof typeof loadingConfig.messages): string {
  return loadingConfig.messages[action] || loadingConfig.messages.default;
}

/**
 * 检查是否应该显示加载动画
 * 基于操作预计时长
 */
export function shouldShowLoading(estimatedDuration: number): boolean {
  return estimatedDuration >= loadingConfig.timing.minLoadingTime;
}

/**
 * 根据用户偏好调整配置
 */
export function applyUserPreferences(preferences: {
  reduceMotion?: boolean;
  preferredVariant?: LoaderVariant;
}) {
  if (preferences.reduceMotion !== undefined) {
    loadingConfig.performance.reduceMotion = preferences.reduceMotion;
  }
  
  if (preferences.preferredVariant) {
    loadingConfig.defaultVariant = preferences.preferredVariant;
  }
}

/**
 * 导出类型
 */
export type LoadingScenario = keyof typeof loadingConfig.variants;
export type LoadingMessage = keyof typeof loadingConfig.messages;
