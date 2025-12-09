'use client';

/**
 * Webhook Configuration Component
 * 
 * Allows users to configure webhook URLs for note events
 * Validates: Requirements 18.1
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, XCircle, AlertCircle, Webhook } from 'lucide-react';
import { toast } from 'sonner';

interface WebhookLog {
  timestamp: string;
  success: boolean;
  attempts: number;
  error?: string;
}

export function WebhookConfig() {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [savedWebhookUrl, setSavedWebhookUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<WebhookLog | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Load current webhook configuration
  useEffect(() => {
    loadWebhookConfig();
  }, []);

  const loadWebhookConfig = async () => {
    try {
      const response = await fetch('/api/webhooks');
      if (response.ok) {
        const data = await response.json();
        setSavedWebhookUrl(data.webhookUrl);
        setWebhookUrl(data.webhookUrl || '');
      }
    } catch (error) {
      console.error('Failed to load webhook config:', error);
    }
  };

  const validateUrl = (url: string): boolean => {
    if (!url) {
      setValidationError(null);
      return true;
    }

    try {
      const urlObj = new URL(url);
      
      if (urlObj.protocol !== 'https:') {
        setValidationError('Webhook URL 必须使用 HTTPS 协议');
        return false;
      }

      if (urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1') {
        setValidationError('不允许使用 localhost 地址');
        return false;
      }

      setValidationError(null);
      return true;
    } catch {
      setValidationError('无效的 URL 格式');
      return false;
    }
  };

  const handleUrlChange = (value: string) => {
    setWebhookUrl(value);
    validateUrl(value);
    setTestResult(null);
  };

  const handleSave = async () => {
    if (!validateUrl(webhookUrl)) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl: webhookUrl || null }),
      });

      if (response.ok) {
        const data = await response.json();
        setSavedWebhookUrl(data.webhookUrl);
        toast.success('Webhook 配置已成功保存');
      } else {
        const error = await response.json();
        toast.error(error.error || '保存 Webhook 配置失败');
      }
    } catch (error) {
      console.error('Failed to save webhook config:', error);
      toast.error('保存 Webhook 配置失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTest = async () => {
    if (!webhookUrl || !validateUrl(webhookUrl)) {
      toast.error('请输入有效的 Webhook URL');
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/webhooks/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl }),
      });

      const result = await response.json();
      setTestResult(result);

      if (result.success) {
        toast.success('Webhook 测试成功！');
      } else {
        toast.error(`Webhook 测试失败：${result.error}`);
      }
    } catch (error) {
      console.error('Failed to test webhook:', error);
      toast.error('Webhook 测试失败');
      setTestResult({
        timestamp: new Date().toISOString(),
        success: false,
        attempts: 0,
        error: '网络错误',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleRemove = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/webhooks', {
        method: 'DELETE',
      });

      if (response.ok) {
        setSavedWebhookUrl(null);
        setWebhookUrl('');
        setTestResult(null);
        toast.success('Webhook 配置已移除');
      } else {
        toast.error('移除 Webhook 配置失败');
      }
    } catch (error) {
      console.error('Failed to remove webhook config:', error);
      toast.error('移除 Webhook 配置失败');
    } finally {
      setIsLoading(false);
    }
  };

  const hasChanges = webhookUrl !== (savedWebhookUrl || '');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Webhook className="h-5 w-5" />
          <CardTitle>Webhook 集成</CardTitle>
        </div>
        <CardDescription>
          配置 Webhook URL 以在笔记创建、更新或删除时接收通知。
          Webhook 将接收包含笔记事件数据的 JSON 格式 POST 请求。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Webhook URL Input */}
        <div className="space-y-2">
          <Label htmlFor="webhook-url">Webhook URL</Label>
          <Input
            id="webhook-url"
            type="url"
            placeholder="https://your-domain.com/webhook"
            value={webhookUrl}
            onChange={(e) => handleUrlChange(e.target.value)}
            disabled={isLoading || isTesting}
          />
          {validationError && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {validationError}
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            必须是有效的 HTTPS URL。不允许使用 localhost 地址。
          </p>
        </div>

        {/* Current Status */}
        {savedWebhookUrl && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              Webhook 已配置并处于活动状态。您将收到笔记事件的通知。
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleSave}
            disabled={isLoading || isTesting || !hasChanges || !!validationError}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            保存配置
          </Button>

          <Button
            variant="outline"
            onClick={handleTest}
            disabled={isLoading || isTesting || !webhookUrl || !!validationError}
          >
            {isTesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            测试 Webhook
          </Button>

          {savedWebhookUrl && (
            <Button
              variant="destructive"
              onClick={handleRemove}
              disabled={isLoading || isTesting}
            >
              移除 Webhook
            </Button>
          )}
        </div>

        {/* Test Result */}
        {testResult && (
          <Alert variant={testResult.success ? 'default' : 'destructive'}>
            {testResult.success ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <AlertDescription>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {testResult.success ? '测试成功' : '测试失败'}
                  </span>
                  <Badge variant={testResult.success ? 'default' : 'destructive'}>
                    {testResult.attempts} 次尝试
                  </Badge>
                </div>
                {testResult.error && (
                  <p className="text-sm">错误：{testResult.error}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {new Date(testResult.timestamp).toLocaleString('zh-CN')}
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Webhook Events Info */}
        <div className="rounded-lg border p-4 space-y-2">
          <h4 className="font-medium text-sm">Webhook 事件</h4>
          <p className="text-sm text-muted-foreground">
            您的 Webhook 将接收以下事件的 POST 请求：
          </p>
          <ul className="text-sm space-y-1 ml-4">
            <li className="flex items-center gap-2">
              <Badge variant="outline">note.created</Badge>
              <span className="text-muted-foreground">当创建新笔记时</span>
            </li>
            <li className="flex items-center gap-2">
              <Badge variant="outline">note.updated</Badge>
              <span className="text-muted-foreground">当笔记被修改时</span>
            </li>
            <li className="flex items-center gap-2">
              <Badge variant="outline">note.deleted</Badge>
              <span className="text-muted-foreground">当笔记被删除时</span>
            </li>
          </ul>
        </div>

        {/* Payload Example */}
        <div className="rounded-lg border p-4 space-y-2">
          <h4 className="font-medium text-sm">负载示例</h4>
          <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
{`{
  "event": "note.created",
  "noteId": "clx1234567890",
  "title": "我的笔记标题",
  "userId": "user_123",
  "userName": "张三",
  "timestamp": "2024-01-01T12:00:00.000Z"
}`}
          </pre>
        </div>

        {/* Retry Policy */}
        <div className="rounded-lg border p-4 space-y-2">
          <h4 className="font-medium text-sm">投递与重试策略</h4>
          <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
            <li>Webhook 投递超时时间为 10 秒</li>
            <li>失败的投递最多重试 3 次</li>
            <li>重试延迟呈指数增长（5秒、10秒、15秒）</li>
            <li>所有投递尝试都会被记录以便调试</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
