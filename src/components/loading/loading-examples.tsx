'use client';

import { useState } from 'react';
import { CreativeLoader, LoaderVariant } from '@/components/ui/creative-loader';
import { LoadingButton, AsyncButton } from '@/components/ui/loading-button';
import { useLoading, useLoadingAction } from '@/hooks/use-loading';

/**
 * 加载动画使用示例组件
 * 
 * 这个组件展示了所有可用的加载动画变体和使用方式
 */
export function LoadingExamples() {
  const [selectedVariant, setSelectedVariant] = useState<LoaderVariant>('orbit');
  const { showLoading, hideLoading } = useLoading();
  const { withLoading } = useLoadingAction();

  const variants: LoaderVariant[] = ['orbit', 'pulse', 'dots', 'wave', 'bounce', 'flip'];

  // 模拟异步操作
  const simulateAsync = (duration: number = 2000) => {
    return new Promise((resolve) => setTimeout(resolve, duration));
  };

  // 示例1: 使用全局加载状态
  const handleGlobalLoading = async () => {
    showLoading('正在处理...', selectedVariant);
    await simulateAsync();
    hideLoading();
  };

  // 示例2: 使用 withLoading 包装器
  const handleWithLoading = async () => {
    await withLoading(
      () => simulateAsync(),
      '正在保存笔记...',
      selectedVariant
    );
  };

  return (
    <div className="space-y-8 p-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">加载动画示例</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          选择一个加载动画变体，然后点击按钮查看效果
        </p>
      </div>

      {/* 变体选择器 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">选择动画风格</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {variants.map((variant) => (
            <button
              key={variant}
              onClick={() => setSelectedVariant(variant)}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedVariant === variant
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="h-16 flex items-center justify-center mb-2">
                <CreativeLoader variant={variant} size="sm" />
              </div>
              <p className="text-sm font-medium capitalize text-center">{variant}</p>
            </button>
          ))}
        </div>
      </div>

      {/* 预览区域 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">预览</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">小尺寸</p>
            <CreativeLoader variant={selectedVariant} size="sm" />
          </div>
          <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">中尺寸</p>
            <CreativeLoader variant={selectedVariant} size="md" />
          </div>
          <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">大尺寸</p>
            <CreativeLoader variant={selectedVariant} size="lg" />
          </div>
        </div>
      </div>

      {/* 按钮示例 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">按钮加载状态</h3>
        <div className="flex flex-wrap gap-4">
          <LoadingButton
            onClick={handleGlobalLoading}
            loaderVariant={selectedVariant}
          >
            全局加载
          </LoadingButton>

          <LoadingButton
            onClick={handleWithLoading}
            loaderVariant={selectedVariant}
            variant="outline"
          >
            包装器加载
          </LoadingButton>

          <AsyncButton
            onClick={() => simulateAsync()}
            loaderVariant={selectedVariant}
            variant="secondary"
            successMessage="操作成功！"
          >
            自动加载按钮
          </AsyncButton>
        </div>
      </div>

      {/* 使用说明 */}
      <div className="space-y-4 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h3 className="text-lg font-semibold">使用方法</h3>
        <div className="space-y-4 text-sm">
          <div>
            <h4 className="font-medium mb-2">1. 全局加载覆盖层</h4>
            <pre className="bg-white dark:bg-gray-900 p-3 rounded overflow-x-auto">
{`const { showLoading, hideLoading } = useLoading();

showLoading('正在加载...', 'orbit');
// 执行异步操作
hideLoading();`}
            </pre>
          </div>

          <div>
            <h4 className="font-medium mb-2">2. 使用 withLoading 包装器</h4>
            <pre className="bg-white dark:bg-gray-900 p-3 rounded overflow-x-auto">
{`const { withLoading } = useLoadingAction();

await withLoading(
  async () => {
    // 你的异步操作
  },
  '正在保存...',
  'pulse'
);`}
            </pre>
          </div>

          <div>
            <h4 className="font-medium mb-2">3. 加载按钮</h4>
            <pre className="bg-white dark:bg-gray-900 p-3 rounded overflow-x-auto">
{`<LoadingButton
  loading={isLoading}
  loaderVariant="dots"
  onClick={handleClick}
>
  保存
</LoadingButton>`}
            </pre>
          </div>

          <div>
            <h4 className="font-medium mb-2">4. 自动加载按钮</h4>
            <pre className="bg-white dark:bg-gray-900 p-3 rounded overflow-x-auto">
{`<AsyncButton
  onClick={async () => {
    await saveNote();
  }}
  loaderVariant="wave"
  successMessage="保存成功！"
>
  保存笔记
</AsyncButton>`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
