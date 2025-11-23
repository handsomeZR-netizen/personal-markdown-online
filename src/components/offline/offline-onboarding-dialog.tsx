'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  CloudOff, 
  RefreshCw, 
  Shield, 
  Zap,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

const ONBOARDING_KEY = 'offline-onboarding-completed';

export function OfflineOnboardingDialog() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [enableOffline, setEnableOffline] = useState(true);
  const [enableAutoSync, setEnableAutoSync] = useState(true);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    // Check if user has already seen the onboarding
    const hasSeenOnboarding = localStorage.getItem(ONBOARDING_KEY);
    if (!hasSeenOnboarding) {
      // Show dialog after a short delay
      const timer = setTimeout(() => {
        setOpen(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleComplete = () => {
    if (typeof window === 'undefined') return;
    
    // Save settings
    const settings = {
      offlineEnabled: enableOffline,
      autoSyncEnabled: enableAutoSync,
    };
    localStorage.setItem('offline-settings', JSON.stringify(settings));
    
    // Mark onboarding as completed
    localStorage.setItem(ONBOARDING_KEY, 'true');
    
    setOpen(false);
  };

  const handleSkip = () => {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setOpen(false);
  };

  const totalSteps = 3;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[600px]">
        {step === 1 && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl">欢迎使用离线功能！</DialogTitle>
              <DialogDescription className="text-base">
                现在您可以在没有网络连接的情况下继续使用笔记应用
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              <div className="grid gap-4">
                <div className="flex gap-4 p-4 border rounded-lg bg-muted/50">
                  <CloudOff className="h-8 w-8 text-orange-500 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">离线工作</h4>
                    <p className="text-sm text-muted-foreground">
                      在没有网络时创建和编辑笔记，所有内容都保存在本地
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4 p-4 border rounded-lg bg-muted/50">
                  <RefreshCw className="h-8 w-8 text-blue-500 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">自动同步</h4>
                    <p className="text-sm text-muted-foreground">
                      网络恢复后，系统会自动将本地更改同步到服务器
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4 p-4 border rounded-lg bg-muted/50">
                  <Shield className="h-8 w-8 text-green-500 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">数据安全</h4>
                    <p className="text-sm text-muted-foreground">
                      所有数据都安全地存储在您的浏览器中，不会丢失
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="flex justify-between sm:justify-between">
              <Button variant="ghost" onClick={handleSkip}>
                跳过
              </Button>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {step} / {totalSteps}
                </span>
                <Button onClick={() => setStep(2)}>
                  下一步
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </DialogFooter>
          </>
        )}

        {step === 2 && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl">工作原理</DialogTitle>
              <DialogDescription className="text-base">
                了解离线功能如何保护您的数据
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-semibold flex-shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">实时检测网络状态</h4>
                    <p className="text-sm text-muted-foreground">
                      系统会自动检测您的网络连接状态，并在界面上显示相应的提示
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-semibold flex-shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">本地保存所有更改</h4>
                    <p className="text-sm text-muted-foreground">
                      离线时的所有操作都会保存到浏览器的本地数据库中
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-semibold flex-shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">智能同步队列</h4>
                    <p className="text-sm text-muted-foreground">
                      所有离线操作都会加入同步队列，按顺序等待同步
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-semibold flex-shrink-0">
                    4
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">自动同步到服务器</h4>
                    <p className="text-sm text-muted-foreground">
                      网络恢复后，系统会自动将所有更改上传到服务器
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex gap-2">
                  <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      提示
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      即使关闭浏览器，您的离线数据也会保留。只要不清除浏览器数据，所有内容都是安全的。
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="flex justify-between sm:justify-between">
              <Button variant="ghost" onClick={() => setStep(1)}>
                上一步
              </Button>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {step} / {totalSteps}
                </span>
                <Button onClick={() => setStep(3)}>
                  下一步
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </DialogFooter>
          </>
        )}

        {step === 3 && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl">快速设置</DialogTitle>
              <DialogDescription className="text-base">
                根据您的需求配置离线功能
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label htmlFor="enable-offline" className="text-base font-semibold">
                      启用离线模式
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      允许在没有网络时创建和编辑笔记
                    </p>
                  </div>
                  <Switch
                    id="enable-offline"
                    checked={enableOffline}
                    onCheckedChange={setEnableOffline}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label htmlFor="enable-auto-sync" className="text-base font-semibold">
                      自动同步
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      网络恢复后自动同步离线更改
                    </p>
                  </div>
                  <Switch
                    id="enable-auto-sync"
                    checked={enableAutoSync}
                    onCheckedChange={setEnableAutoSync}
                  />
                </div>
              </div>

              <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-900 dark:text-green-100">
                      推荐设置
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      我们建议启用这两个选项以获得最佳体验。您可以随时在设置中更改这些选项。
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <Link href="/help/offline" className="text-sm text-primary hover:underline">
                  了解更多关于离线功能
                </Link>
              </div>
            </div>

            <DialogFooter className="flex justify-between sm:justify-between">
              <Button variant="ghost" onClick={() => setStep(2)}>
                上一步
              </Button>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {step} / {totalSteps}
                </span>
                <Button onClick={handleComplete}>
                  完成设置
                  <CheckCircle2 className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
