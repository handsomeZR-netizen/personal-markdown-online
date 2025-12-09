'use client';

import { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TooltipStep {
  id: string;
  target: string;
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  highlight?: boolean;
}

interface OnboardingTooltipsProps {
  steps: TooltipStep[];
  onComplete?: () => void;
  onSkip?: () => void;
  storageKey: string;
}

export function OnboardingTooltips({
  steps,
  onComplete,
  onSkip,
  storageKey,
}: OnboardingTooltipsProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    // Check if user has already seen this onboarding
    const hasSeenOnboarding = localStorage.getItem(storageKey);
    if (!hasSeenOnboarding) {
      setIsVisible(true);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!isVisible || currentStep >= steps.length) return;

    const step = steps[currentStep];
    const targetElement = document.querySelector(step.target);

    if (targetElement) {
      const rect = targetElement.getBoundingClientRect();
      const tooltipPosition = calculatePosition(rect, step.position || 'bottom');
      setPosition(tooltipPosition);

      // Highlight target element
      if (step.highlight) {
        targetElement.classList.add('onboarding-highlight');
      }

      // Scroll into view
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    return () => {
      if (targetElement && step.highlight) {
        targetElement.classList.remove('onboarding-highlight');
      }
    };
  }, [currentStep, isVisible, steps]);

  const calculatePosition = (
    rect: DOMRect,
    position: 'top' | 'bottom' | 'left' | 'right'
  ) => {
    const offset = 16;
    const tooltipWidth = 320;
    const tooltipHeight = 200;

    switch (position) {
      case 'top':
        return {
          top: rect.top - tooltipHeight - offset,
          left: rect.left + rect.width / 2 - tooltipWidth / 2,
        };
      case 'bottom':
        return {
          top: rect.bottom + offset,
          left: rect.left + rect.width / 2 - tooltipWidth / 2,
        };
      case 'left':
        return {
          top: rect.top + rect.height / 2 - tooltipHeight / 2,
          left: rect.left - tooltipWidth - offset,
        };
      case 'right':
        return {
          top: rect.top + rect.height / 2 - tooltipHeight / 2,
          left: rect.right + offset,
        };
      default:
        return {
          top: rect.bottom + offset,
          left: rect.left + rect.width / 2 - tooltipWidth / 2,
        };
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem(storageKey, 'true');
    setIsVisible(false);
    onSkip?.();
  };

  const handleComplete = () => {
    localStorage.setItem(storageKey, 'true');
    setIsVisible(false);
    onComplete?.();
  };

  if (!isVisible || currentStep >= steps.length) return null;

  const step = steps[currentStep];

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={handleSkip} />

      {/* Tooltip */}
      <div
        className="fixed z-50 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {step.title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              步骤 {currentStep + 1} / {steps.length}
            </p>
          </div>
          <button
            onClick={handleSkip}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="关闭引导"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mb-4">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {step.content}
          </p>
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex gap-1">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-1 flex-1 rounded-full ${
                  index <= currentStep
                    ? 'bg-blue-500'
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            className="text-gray-600 dark:text-gray-400"
          >
            跳过引导
          </Button>

          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevious}
                className="flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                上一步
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleNext}
              className="flex items-center gap-1"
            >
              {currentStep < steps.length - 1 ? (
                <>
                  下一步
                  <ChevronRight className="w-4 h-4" />
                </>
              ) : (
                '完成'
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Styles */}
      <style jsx global>{`
        .onboarding-highlight {
          position: relative;
          z-index: 45;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5);
          border-radius: 4px;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%,
          100% {
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.3);
          }
        }
      `}</style>
    </>
  );
}

// Predefined onboarding tours
export const collaborationOnboarding: TooltipStep[] = [
  {
    id: 'collab-1',
    target: '[data-onboarding="share-button"]',
    title: '分享笔记',
    content: '点击这里可以邀请团队成员协作编辑笔记，或生成公开分享链接。',
    position: 'bottom',
    highlight: true,
  },
  {
    id: 'collab-2',
    target: '[data-onboarding="presence-avatars"]',
    title: '在线协作者',
    content: '这里显示当前正在查看或编辑笔记的团队成员。悬停可查看详细信息。',
    position: 'bottom',
    highlight: true,
  },
  {
    id: 'collab-3',
    target: '[data-onboarding="editor-content"]',
    title: '实时同步',
    content: '开始输入内容，您的修改会在 100 毫秒内同步给其他协作者。您也能看到他们的光标位置。',
    position: 'top',
    highlight: true,
  },
  {
    id: 'collab-4',
    target: '[data-onboarding="version-history"]',
    title: '版本历史',
    content: '点击这里可以查看笔记的所有历史版本，并恢复到任意版本。',
    position: 'bottom',
    highlight: true,
  },
];

export const folderOnboarding: TooltipStep[] = [
  {
    id: 'folder-1',
    target: '[data-onboarding="folder-tree"]',
    title: '文件夹树',
    content: '在这里可以看到所有文件夹和笔记的层级结构。支持无限层级嵌套。',
    position: 'right',
    highlight: true,
  },
  {
    id: 'folder-2',
    target: '[data-onboarding="create-folder"]',
    title: '创建文件夹',
    content: '点击这里可以创建新文件夹，组织您的笔记。',
    position: 'right',
    highlight: true,
  },
  {
    id: 'folder-3',
    target: '[data-onboarding="folder-item"]',
    title: '拖拽移动',
    content: '您可以拖拽笔记或文件夹到其他文件夹中，快速重新组织结构。',
    position: 'right',
    highlight: true,
  },
  {
    id: 'folder-4',
    target: '[data-onboarding="breadcrumbs"]',
    title: '面包屑导航',
    content: '这里显示当前笔记在文件夹层级中的位置，点击可快速跳转到父级文件夹。',
    position: 'bottom',
    highlight: true,
  },
];

export const mobileGestureOnboarding: TooltipStep[] = [
  {
    id: 'gesture-1',
    target: '[data-onboarding="mobile-edge"]',
    title: '侧边栏手势',
    content: '从屏幕左边缘向右滑动可以打开侧边栏，查看文件夹和笔记列表。',
    position: 'right',
    highlight: false,
  },
  {
    id: 'gesture-2',
    target: '[data-onboarding="note-list"]',
    title: '下拉刷新',
    content: '在笔记列表顶部向下拉动可以刷新，获取最新内容。',
    position: 'bottom',
    highlight: true,
  },
  {
    id: 'gesture-3',
    target: '[data-onboarding="note-card"]',
    title: '滑动操作',
    content: '在笔记卡片上向左滑动可以显示快捷操作按钮（编辑、删除）。',
    position: 'top',
    highlight: true,
  },
  {
    id: 'gesture-4',
    target: '[data-onboarding="bottom-nav"]',
    title: '底部导航',
    content: '使用底部导航栏可以快速切换笔记、搜索、新建和目录功能。',
    position: 'top',
    highlight: true,
  },
];
