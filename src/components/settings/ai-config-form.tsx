'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Check, AlertCircle, Eye, EyeOff, Sparkles } from 'lucide-react';
import { AIProvider, AIConfig, DEFAULT_CONFIGS, getAIConfig, saveAIConfig, testAIConfig } from '@/lib/ai/config';

export function AIConfigForm() {
  const [mounted, setMounted] = useState(false);
  const [provider, setProvider] = useState<AIProvider>('deepseek');
  const [apiKey, setApiKey] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [model, setModel] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 加载保存的配置
  useEffect(() => {
    setMounted(true);
    const config = getAIConfig();
    
    if (config && config.apiKey && config.apiKey.trim() !== '') {
      setProvider(config.provider);
      setApiKey(config.apiKey);
      setApiUrl(config.apiUrl);
      setModel(config.model);
    } else {
      // 使用默认配置
      const defaultConfig = DEFAULT_CONFIGS.deepseek;
      setApiUrl(defaultConfig.apiUrl);
      setModel(defaultConfig.model);
      setApiKey('');
    }
  }, []);

  // 避免水合不匹配
  if (!mounted) {
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>AI API 配置</CardTitle>
          <CardDescription>加载中...</CardDescription>
        </CardHeader>
        <CardContent className="h-96 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // 切换提供商时更新默认值
  const handleProviderChange = (newProvider: AIProvider) => {
    setProvider(newProvider);
    const defaultConfig = DEFAULT_CONFIGS[newProvider];
    setApiUrl(defaultConfig.apiUrl);
    setModel(defaultConfig.model);
  };

  // 测试配置
  const handleTest = async () => {
    if (!apiKey.trim()) {
      toast.error('请输入API Key');
      return;
    }

    setIsTesting(true);
    const config: AIConfig = { provider, apiKey, apiUrl, model };
    
    try {
      const result = await testAIConfig(config);
      if (result.success) {
        toast.success('API配置测试成功！');
      } else {
        toast.error(`测试失败: ${result.error}`);
      }
    } catch (error) {
      toast.error('测试失败，请检查配置');
    } finally {
      setIsTesting(false);
    }
  };

  // 保存配置
  const handleSave = async () => {
    if (!apiKey.trim()) {
      toast.error('请输入API Key');
      return;
    }

    if (!apiUrl.trim()) {
      toast.error('请输入API URL');
      return;
    }

    if (!model.trim()) {
      toast.error('请输入模型名称');
      return;
    }

    setIsSaving(true);
    const config: AIConfig = { provider, apiKey, apiUrl, model };
    
    try {
      saveAIConfig(config);
      toast.success('配置已保存！');
    } catch (error) {
      toast.error('保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  // 重置为默认配置
  const handleReset = () => {
    const defaultConfig = DEFAULT_CONFIGS[provider];
    setApiUrl(defaultConfig.apiUrl);
    setModel(defaultConfig.model);
    setApiKey('');
    toast.info('已重置为默认配置');
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>AI API 配置</CardTitle>
        <CardDescription>
          配置AI服务提供商和API密钥，用于标签建议、摘要生成等功能
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* API 配置说明 */}
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900 mb-1">
                🔑 配置您的 AI API
              </h4>
              <p className="text-sm text-blue-700 leading-relaxed">
                要使用 AI 功能（标签建议、格式优化等），您需要配置自己的 API Key。
                我们推荐使用 DeepSeek API，性价比高且效果好。
              </p>
            </div>
          </div>
        </div>
        {/* 提供商选择 */}
        <div className="space-y-2">
          <Label htmlFor="provider">AI 提供商</Label>
          <Select value={provider} onValueChange={handleProviderChange}>
            <SelectTrigger id="provider">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="deepseek">DeepSeek</SelectItem>
              <SelectItem value="openai">OpenAI</SelectItem>
              <SelectItem value="custom">自定义</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* API Key */}
        <div className="space-y-2">
          <Label htmlFor="apiKey">API Key</Label>
          <div className="relative">
            <Input
              id="apiKey"
              type={showApiKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700"
            >
              {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            {provider === 'deepseek' && '在 DeepSeek 官网获取: https://platform.deepseek.com'}
            {provider === 'openai' && '在 OpenAI 官网获取: https://platform.openai.com'}
            {provider === 'custom' && '输入你的自定义API密钥'}
          </p>
        </div>

        {/* API URL */}
        <div className="space-y-2">
          <Label htmlFor="apiUrl">API URL</Label>
          <Input
            id="apiUrl"
            type="url"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            placeholder="https://api.example.com/v1"
          />
        </div>

        {/* 模型名称 */}
        <div className="space-y-2">
          <Label htmlFor="model">模型名称</Label>
          <Input
            id="model"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="deepseek-chat"
          />
          <p className="text-xs text-muted-foreground">
            {provider === 'deepseek' && '推荐: deepseek-chat'}
            {provider === 'openai' && '推荐: gpt-3.5-turbo 或 gpt-4'}
            {provider === 'custom' && '输入你的模型名称'}
          </p>
        </div>

        {/* 操作按钮 */}
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={handleTest}
            disabled={isTesting || !apiKey.trim()}
            variant="outline"
          >
            {isTesting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                测试中...
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 mr-2" />
                测试连接
              </>
            )}
          </Button>

          <Button
            onClick={handleSave}
            disabled={isSaving || !apiKey.trim()}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                保存配置
              </>
            )}
          </Button>

          <Button
            onClick={handleReset}
            variant="ghost"
          >
            重置默认
          </Button>
        </div>

        {/* 提示信息 */}
        <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-4">
          <p className="text-sm text-neutral-600 mb-2">
            <strong>安全说明：</strong>
          </p>
          <ul className="text-sm text-neutral-600 space-y-1 list-disc list-inside">
            <li>您的 API Key 保存在浏览器本地，不会上传到服务器</li>
            <li>API Key 仅在您的浏览器中使用，开发者无法获取</li>
            <li>建议定期更换 API Key 以确保安全</li>
            <li>如果不再使用，可以在浏览器中清除本地存储</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
