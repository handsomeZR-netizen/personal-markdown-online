'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { OfflineSettings, ConflictStrategy } from '@/types/offline';
import { OfflineSettingsManager } from '@/lib/offline/settings-manager';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Save, RotateCcw, HelpCircle } from 'lucide-react';
import Link from 'next/link';

export default function OfflineSettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<OfflineSettings>(
    OfflineSettingsManager.getSettings()
  );
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // 加载设置
    const loadedSettings = OfflineSettingsManager.getSettings();
    setSettings(loadedSettings);
  }, []);

  const handleSettingChange = <K extends keyof OfflineSettings>(
    key: K,
    value: OfflineSettings[K]
  ) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      OfflineSettingsManager.saveSettings(settings);
      setHasChanges(false);
      toast.success('设置已保存');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('保存设置失败');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    try {
      OfflineSettingsManager.resetSettings();
      const defaultSettings = OfflineSettingsManager.getSettings();
      setSettings(defaultSettings);
      setHasChanges(false);
      toast.success('设置已重置为默认值');
    } catch (error) {
      console.error('Failed to reset settings:', error);
      toast.error('重置设置失败');
    }
  };

  const getConflictStrategyLabel = (strategy: ConflictStrategy): string => {
    switch (strategy) {
      case 'use-local':
        return '使用本地版本';
      case 'use-remote':
        return '使用服务器版本';
      case 'manual-merge':
        return '手动合并（推荐）';
      default:
        return strategy;
    }
  };

  const getConflictStrategyDescription = (strategy: ConflictStrategy): string => {
    switch (strategy) {
      case 'use-local':
        return '发生冲突时，自动保留本地修改的版本';
      case 'use-remote':
        return '发生冲突时，自动使用服务器上的版本';
      case 'manual-merge':
        return '发生冲突时，显示对比界面让你手动选择';
      default:
        return '';
    }
  };

  const getDraftIntervalLabel = (interval: number): string => {
    const seconds = interval / 1000;
    return `${seconds} 秒`;
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回
        </Button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-800">离线功能设置</h1>
            <p className="text-neutral-600 mt-2">
              配置离线编辑、自动同步和冲突处理选项
            </p>
          </div>
          
          <div className="flex gap-2">
            <Link href="/help/offline">
              <Button variant="outline" size="sm">
                <HelpCircle className="h-4 w-4 mr-2" />
                帮助
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={isSaving}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              重置
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? '保存中...' : '保存设置'}
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* 离线模式 */}
        <Card>
          <CardHeader>
            <CardTitle>离线模式</CardTitle>
            <CardDescription>
              启用后，你可以在没有网络连接时创建和编辑笔记
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="offline-mode">启用离线模式</Label>
                <p className="text-sm text-neutral-500">
                  离线时自动将数据保存到本地，网络恢复后自动同步
                </p>
              </div>
              <Switch
                id="offline-mode"
                checked={settings.offlineModeEnabled}
                onCheckedChange={(checked: boolean) =>
                  handleSettingChange('offlineModeEnabled', checked)
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* 自动同步 */}
        <Card>
          <CardHeader>
            <CardTitle>自动同步</CardTitle>
            <CardDescription>
              网络恢复时自动同步离线期间的所有更改
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-sync">启用自动同步</Label>
                <p className="text-sm text-neutral-500">
                  关闭后需要手动点击同步按钮来同步数据
                </p>
              </div>
              <Switch
                id="auto-sync"
                checked={settings.autoSyncEnabled}
                onCheckedChange={(checked: boolean) =>
                  handleSettingChange('autoSyncEnabled', checked)
                }
                disabled={!settings.offlineModeEnabled}
              />
            </div>
          </CardContent>
        </Card>

        {/* 冲突解决策略 */}
        <Card>
          <CardHeader>
            <CardTitle>冲突解决策略</CardTitle>
            <CardDescription>
              当本地数据与服务器数据不一致时的处理方式
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="conflict-strategy">默认策略</Label>
              <Select
                value={settings.conflictResolutionStrategy}
                onValueChange={(value) =>
                  handleSettingChange('conflictResolutionStrategy', value as ConflictStrategy)
                }
                disabled={!settings.offlineModeEnabled}
              >
                <SelectTrigger id="conflict-strategy">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual-merge">
                    {getConflictStrategyLabel('manual-merge')}
                  </SelectItem>
                  <SelectItem value="use-local">
                    {getConflictStrategyLabel('use-local')}
                  </SelectItem>
                  <SelectItem value="use-remote">
                    {getConflictStrategyLabel('use-remote')}
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-neutral-500">
                {getConflictStrategyDescription(settings.conflictResolutionStrategy)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 草稿自动保存 */}
        <Card>
          <CardHeader>
            <CardTitle>草稿自动保存</CardTitle>
            <CardDescription>
              编辑笔记时自动保存草稿的时间间隔
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="draft-interval">保存间隔</Label>
              <Select
                value={settings.draftAutoSaveInterval.toString()}
                onValueChange={(value) =>
                  handleSettingChange('draftAutoSaveInterval', parseInt(value))
                }
              >
                <SelectTrigger id="draft-interval">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1000">
                    {getDraftIntervalLabel(1000)}
                  </SelectItem>
                  <SelectItem value="3000">
                    {getDraftIntervalLabel(3000)} (推荐)
                  </SelectItem>
                  <SelectItem value="5000">
                    {getDraftIntervalLabel(5000)}
                  </SelectItem>
                  <SelectItem value="10000">
                    {getDraftIntervalLabel(10000)}
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-neutral-500">
                停止输入后等待指定时间自动保存草稿
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 说明信息 */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="space-y-2 text-sm text-blue-900">
              <p className="font-medium">💡 使用提示：</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>离线模式会占用浏览器存储空间，建议定期清理缓存</li>
                <li>自动同步会在网络恢复后 5 秒自动触发</li>
                <li>推荐使用"手动合并"策略以避免数据丢失</li>
                <li>草稿保存间隔越短，性能开销越大</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
