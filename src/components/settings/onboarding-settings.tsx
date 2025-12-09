'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useOnboarding } from '@/hooks/use-onboarding';
import { CheckCircle2, Circle, Play, RotateCcw } from 'lucide-react';

export function OnboardingSettings() {
  const {
    startTour,
    resetTour,
    resetAllTours,
    hasCompletedTour,
  } = useOnboarding();

  const tours = [
    {
      id: 'collaboration' as const,
      title: '协作功能',
      description: '学习如何与团队成员实时协作编辑笔记',
      icon: '👥',
    },
    {
      id: 'folders' as const,
      title: '文件夹组织',
      description: '了解如何使用文件夹树组织和管理笔记',
      icon: '📁',
    },
    {
      id: 'mobile-gestures' as const,
      title: '移动端手势',
      description: '掌握移动端的滑动手势和快捷操作',
      icon: '👆',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>引导教程</CardTitle>
        <CardDescription>
          重新查看功能引导，或重置所有教程进度
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {tours.map((tour) => {
          const completed = hasCompletedTour(tour.id);
          
          return (
            <div
              key={tour.id}
              className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">{tour.icon}</div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {tour.title}
                    </h3>
                    {completed ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <Circle className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {tour.description}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => startTour(tour.id)}
                  className="flex items-center gap-1"
                >
                  <Play className="w-4 h-4" />
                  {completed ? '重新查看' : '开始'}
                </Button>
                
                {completed && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => resetTour(tour.id)}
                    className="flex items-center gap-1"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}

        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            onClick={resetAllTours}
            className="w-full"
          >
            重置所有教程
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
