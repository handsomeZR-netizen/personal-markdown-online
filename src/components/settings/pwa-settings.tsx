'use client';

import { useState } from 'react';
import { Download, RefreshCw, Trash2, CheckCircle, XCircle, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePWA, useServiceWorker } from '@/hooks/use-pwa';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export function PWASettings() {
  const { isInstallable, isInstalled, installPWA } = usePWA();
  const { isSupported, isRegistered, updateServiceWorker, unregisterServiceWorker } = useServiceWorker();
  const [isInstalling, setIsInstalling] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUnregistering, setIsUnregistering] = useState(false);

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      const success = await installPWA();
      if (success) {
        toast.success('应用已成功安装到主屏幕');
      } else {
        toast.error('安装已取消');
      }
    } catch (error) {
      toast.error('安装失败，请重试');
    } finally {
      setIsInstalling(false);
    }
  };

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      await updateServiceWorker();
      toast.success('Service Worker 已更新');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      toast.error('更新失败，请重试');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUnregister = async () => {
    setIsUnregistering(true);
    try {
      const success = await unregisterServiceWorker();
      if (success) {
        toast.success('Service Worker 已卸载');
        // Clear all caches
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map(name => caches.delete(name)));
        }
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast.error('卸载失败');
      }
    } catch (error) {
      toast.error('卸载失败，请重试');
    } finally {
      setIsUnregistering(false);
    }
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            PWA 设置
          </CardTitle>
          <CardDescription>
            您的浏览器不支持 PWA 功能
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            请使用现代浏览器（Chrome、Edge、Safari 等）以获得完整的 PWA 体验。
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            PWA 设置
          </CardTitle>
          <CardDescription>
            管理渐进式 Web 应用（PWA）功能
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Installation Status */}
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-3">
              {isInstalled ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-muted-foreground" />
              )}
              <div>
                <p className="font-medium text-sm">安装状态</p>
                <p className="text-xs text-muted-foreground">
                  {isInstalled ? '已安装到主屏幕' : '未安装'}
                </p>
              </div>
            </div>
            {isInstallable && !isInstalled && (
              <Button
                onClick={handleInstall}
                disabled={isInstalling}
                size="sm"
              >
                <Download className="w-4 h-4 mr-2" />
                {isInstalling ? '安装中...' : '立即安装'}
              </Button>
            )}
          </div>

          {/* Service Worker Status */}
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-3">
              {isRegistered ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-muted-foreground" />
              )}
              <div>
                <p className="font-medium text-sm">Service Worker</p>
                <p className="text-xs text-muted-foreground">
                  {isRegistered ? '已激活' : '未激活'}
                </p>
              </div>
            </div>
            {isRegistered && (
              <div className="flex gap-2">
                <Button
                  onClick={handleUpdate}
                  disabled={isUpdating}
                  size="sm"
                  variant="outline"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {isUpdating ? '更新中...' : '更新'}
                </Button>
              </div>
            )}
          </div>

          {/* Features */}
          <div className="space-y-2">
            <p className="text-sm font-medium">PWA 功能</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                离线访问缓存的笔记
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                快速启动和加载
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                自动后台更新
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                原生应用体验
              </li>
            </ul>
          </div>

          {/* Danger Zone */}
          {isRegistered && (
            <div className="pt-4 border-t">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={isUnregistering}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {isUnregistering ? '卸载中...' : '卸载 Service Worker'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>确认卸载？</AlertDialogTitle>
                    <AlertDialogDescription>
                      这将卸载 Service Worker 并清除所有缓存。
                      您将失去离线访问功能，页面将重新加载。
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>取消</AlertDialogCancel>
                    <AlertDialogAction onClick={handleUnregister}>
                      确认卸载
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
