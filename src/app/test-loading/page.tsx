'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CreativeLoader, 
  LoadingOverlay, 
  ButtonLoader,
  type LoaderVariant 
} from '@/components/ui/creative-loader';
import { 
  ClickLoader, 
  ClickLoadingProvider, 
  useClickLoading,
  ClickableWithLoader,
  type ClickLoaderVariant 
} from '@/components/ui/click-loader';
import {
  InteractiveLoader,
  CardLoader,
  ListItemLoader,
  ButtonLoaderWrapper,
  IconButtonLoader,
} from '@/components/ui/interactive-loader';
import { LoadingButton, AsyncButton } from '@/components/ui/loading-button';
import { LoadingContainer, InlineLoader } from '@/components/ui/with-loading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, 
  Pause, 
  RefreshCw, 
  Download, 
  Upload, 
  Trash2, 
  Save, 
  Send,
  Heart,
  Star,
  Share2,
  Copy,
  Check,
  X,
  Settings,
  Search,
  Plus,
  Minus,
  Edit,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';

// 模拟异步操作
const simulateAsync = (ms: number = 2000) => 
  new Promise(resolve => setTimeout(resolve, ms));

export default function TestLoadingPage() {
  return (
    <ClickLoadingProvider>
      <div className="container mx-auto py-8 px-4 space-y-12">
        <header className="text-center space-y-4">
          <h1 className="text-4xl font-bold">加载动画测试中心</h1>
          <p className="text-muted-foreground text-lg">
            点击各个组件测试不同的加载动画效果
          </p>
        </header>

        <Tabs defaultValue="creative" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="creative">创意加载器</TabsTrigger>
            <TabsTrigger value="click">点击加载器</TabsTrigger>
            <TabsTrigger value="interactive">交互式加载</TabsTrigger>
            <TabsTrigger value="buttons">按钮加载</TabsTrigger>
            <TabsTrigger value="scenarios">场景测试</TabsTrigger>
          </TabsList>

          <TabsContent value="creative" className="mt-6">
            <CreativeLoaderSection />
          </TabsContent>

          <TabsContent value="click" className="mt-6">
            <ClickLoaderSection />
          </TabsContent>

          <TabsContent value="interactive" className="mt-6">
            <InteractiveLoaderSection />
          </TabsContent>

          <TabsContent value="buttons" className="mt-6">
            <ButtonLoaderSection />
          </TabsContent>

          <TabsContent value="scenarios" className="mt-6">
            <ScenarioTestSection />
          </TabsContent>
        </Tabs>
      </div>
    </ClickLoadingProvider>
  );
}

// 创意加载器展示
function CreativeLoaderSection() {
  const variants: LoaderVariant[] = ['dots', 'pulse', 'orbit', 'wave', 'bounce', 'flip'];
  const sizes: Array<'sm' | 'md' | 'lg'> = ['sm', 'md', 'lg'];
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayVariant, setOverlayVariant] = useState<LoaderVariant>('orbit');

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>创意加载动画变体</CardTitle>
          <CardDescription>6种不同风格的加载动画</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {variants.map(variant => (
              <div 
                key={variant} 
                className="flex flex-col items-center gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => {
                  setOverlayVariant(variant);
                  setShowOverlay(true);
                  setTimeout(() => setShowOverlay(false), 3000);
                }}
              >
                <CreativeLoader variant={variant} size="md" />
                <Badge variant="outline">{variant}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>尺寸对比</CardTitle>
          <CardDescription>同一动画的不同尺寸</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-center gap-12">
            {sizes.map(size => (
              <div key={size} className="flex flex-col items-center gap-4">
                <CreativeLoader variant="orbit" size={size} />
                <Badge>{size}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>带消息的加载器</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 border rounded-lg">
              <CreativeLoader variant="orbit" size="md" message="正在加载数据..." />
            </div>
            <div className="p-6 border rounded-lg">
              <CreativeLoader variant="wave" size="md" message="正在同步中..." />
            </div>
            <div className="p-6 border rounded-lg">
              <CreativeLoader variant="pulse" size="md" message="请稍候..." />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 全屏覆盖层 */}
      <AnimatePresence>
        {showOverlay && (
          <LoadingOverlay variant={overlayVariant} message={`${overlayVariant} 加载中...`} />
        )}
      </AnimatePresence>
    </div>
  );
}

// 点击加载器展示
function ClickLoaderSection() {
  const variants: ClickLoaderVariant[] = ['ripple', 'pulse', 'spinner', 'dots', 'progress', 'bounce', 'morph', 'glow'];
  const { withClickLoading, isLoading } = useClickLoading();

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>点击加载动画变体</CardTitle>
          <CardDescription>8种点击反馈动画效果</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {variants.map(variant => (
              <div 
                key={variant}
                className="flex flex-col items-center gap-3 p-4 border rounded-lg"
              >
                <div className="h-12 flex items-center justify-center">
                  <ClickLoader variant={variant} size="md" />
                </div>
                <Badge variant="secondary">{variant}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>点击测试</CardTitle>
          <CardDescription>点击按钮触发加载动画</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {variants.map(variant => (
              <Button
                key={variant}
                variant="outline"
                className="h-16 relative"
                disabled={isLoading(`click-${variant}`)}
                onClick={() => {
                  withClickLoading(`click-${variant}`, async () => {
                    await simulateAsync(1500);
                    toast.success(`${variant} 加载完成!`);
                  });
                }}
              >
                {isLoading(`click-${variant}`) ? (
                  <ClickLoader variant={variant} size="sm" />
                ) : (
                  <span>测试 {variant}</span>
                )}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>尺寸变体</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-8">
            {(['xs', 'sm', 'md', 'lg'] as const).map(size => (
              <div key={size} className="flex flex-col items-center gap-2">
                <ClickLoader variant="spinner" size={size} />
                <Badge variant="outline">{size}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// 交互式加载器展示
function InteractiveLoaderSection() {
  const [cardLoading, setCardLoading] = useState<string | null>(null);
  const [listLoading, setListLoading] = useState<number | null>(null);

  const handleCardClick = async (id: string) => {
    setCardLoading(id);
    await simulateAsync(2000);
    setCardLoading(null);
    toast.success(`卡片 ${id} 加载完成`);
  };

  const handleListClick = async (index: number) => {
    setListLoading(index);
    await simulateAsync(1500);
    setListLoading(null);
    toast.success(`列表项 ${index + 1} 操作完成`);
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>交互式容器</CardTitle>
          <CardDescription>点击卡片触发水波纹和加载效果</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['A', 'B', 'C'].map(id => (
              <InteractiveLoader
                key={id}
                onClick={() => handleCardClick(id)}
                className="p-6 border rounded-lg"
                loaderVariant="ripple"
              >
                <div className="space-y-2">
                  <h3 className="font-semibold">卡片 {id}</h3>
                  <p className="text-sm text-muted-foreground">
                    点击此卡片查看水波纹效果和加载动画
                  </p>
                </div>
              </InteractiveLoader>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>卡片加载效果</CardTitle>
          <CardDescription>带进度条的卡片加载</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {['笔记1', '笔记2'].map((title, i) => (
              <CardLoader
                key={i}
                isLoading={cardLoading === `card-${i}`}
                onClick={() => handleCardClick(`card-${i}`)}
                className="border"
                loadingMessage="正在加载笔记..."
              >
                <div className="p-6 space-y-3">
                  <h3 className="font-semibold text-lg">{title}</h3>
                  <p className="text-muted-foreground">
                    这是一个示例笔记卡片，点击查看加载效果。
                  </p>
                  <div className="flex gap-2">
                    <Badge>标签1</Badge>
                    <Badge variant="secondary">标签2</Badge>
                  </div>
                </div>
              </CardLoader>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>列表项加载效果</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg divide-y">
            {['项目一', '项目二', '项目三', '项目四', '项目五'].map((item, i) => (
              <ListItemLoader
                key={i}
                index={i}
                isLoading={listLoading === i}
                onClick={() => handleListClick(i)}
                className="p-4 hover:bg-accent/50"
              >
                <div className="flex items-center justify-between">
                  <span>{item}</span>
                  <Badge variant="outline">点击测试</Badge>
                </div>
              </ListItemLoader>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


// 按钮加载器展示
function ButtonLoaderSection() {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const setLoading = (key: string, loading: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: loading }));
  };

  const handleAsyncClick = async (key: string, duration: number = 2000) => {
    setLoading(key, true);
    await simulateAsync(duration);
    setLoading(key, false);
    toast.success(`${key} 操作完成!`);
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>LoadingButton 组件</CardTitle>
          <CardDescription>内置加载状态的按钮</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <LoadingButton
              loading={loadingStates['save']}
              onClick={() => handleAsyncClick('save')}
              loaderVariant="dots"
            >
              <Save className="w-4 h-4 mr-2" />
              保存
            </LoadingButton>

            <LoadingButton
              loading={loadingStates['delete']}
              onClick={() => handleAsyncClick('delete')}
              variant="destructive"
              loaderVariant="dots"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              删除
            </LoadingButton>

            <LoadingButton
              loading={loadingStates['upload']}
              onClick={() => handleAsyncClick('upload', 3000)}
              variant="outline"
              loaderVariant="dots"
            >
              <Upload className="w-4 h-4 mr-2" />
              上传
            </LoadingButton>

            <LoadingButton
              loading={loadingStates['download']}
              onClick={() => handleAsyncClick('download', 2500)}
              variant="secondary"
              loaderVariant="dots"
            >
              <Download className="w-4 h-4 mr-2" />
              下载
            </LoadingButton>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AsyncButton 组件</CardTitle>
          <CardDescription>自动管理加载状态的异步按钮</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <AsyncButton
              onClick={async () => {
                await simulateAsync(2000);
              }}
              onSuccess={() => toast.success('发送成功!')}
              loaderVariant="dots"
            >
              <Send className="w-4 h-4 mr-2" />
              发送消息
            </AsyncButton>

            <AsyncButton
              onClick={async () => {
                await simulateAsync(1500);
              }}
              onSuccess={() => toast.success('刷新成功!')}
              variant="outline"
              loaderVariant="dots"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              刷新数据
            </AsyncButton>

            <AsyncButton
              onClick={async () => {
                await simulateAsync(1000);
                throw new Error('模拟错误');
              }}
              onError={() => toast.error('操作失败!')}
              variant="destructive"
              loaderVariant="dots"
            >
              <X className="w-4 h-4 mr-2" />
              模拟失败
            </AsyncButton>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ButtonLoaderWrapper 组件</CardTitle>
          <CardDescription>包装式按钮加载效果</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <ButtonLoaderWrapper
              onClick={async () => {
                await simulateAsync(2000);
                toast.success('操作完成!');
              }}
            >
              <Check className="w-4 h-4 mr-2" />
              确认操作
            </ButtonLoaderWrapper>

            <ButtonLoaderWrapper
              variant="outline"
              onClick={async () => {
                await simulateAsync(1500);
                toast.success('复制成功!');
              }}
            >
              <Copy className="w-4 h-4 mr-2" />
              复制内容
            </ButtonLoaderWrapper>

            <ButtonLoaderWrapper
              variant="ghost"
              onClick={async () => {
                await simulateAsync(1000);
                toast.success('分享成功!');
              }}
            >
              <Share2 className="w-4 h-4 mr-2" />
              分享
            </ButtonLoaderWrapper>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>IconButtonLoader 组件</CardTitle>
          <CardDescription>图标按钮加载效果</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <IconButtonLoader
              icon={<Heart className="w-5 h-5" />}
              onClick={async () => {
                await simulateAsync(1000);
                toast.success('已收藏!');
              }}
              title="收藏"
            />

            <IconButtonLoader
              icon={<Star className="w-5 h-5" />}
              onClick={async () => {
                await simulateAsync(1000);
                toast.success('已标星!');
              }}
              title="标星"
            />

            <IconButtonLoader
              icon={<Edit className="w-5 h-5" />}
              onClick={async () => {
                await simulateAsync(1500);
                toast.success('编辑模式!');
              }}
              title="编辑"
            />

            <IconButtonLoader
              icon={<Settings className="w-5 h-5" />}
              onClick={async () => {
                await simulateAsync(2000);
                toast.success('设置已保存!');
              }}
              title="设置"
            />

            <IconButtonLoader
              icon={<Search className="w-5 h-5" />}
              onClick={async () => {
                await simulateAsync(1200);
                toast.success('搜索完成!');
              }}
              title="搜索"
            />

            <IconButtonLoader
              icon={<Plus className="w-5 h-5" />}
              onClick={async () => {
                await simulateAsync(800);
                toast.success('已添加!');
              }}
              title="添加"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// 场景测试
function ScenarioTestSection() {
  const [isListLoading, setIsListLoading] = useState(false);
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isProgressLoading, setIsProgressLoading] = useState(false);

  const simulateListLoad = async () => {
    setIsListLoading(true);
    await simulateAsync(2500);
    setIsListLoading(false);
    toast.success('列表加载完成!');
  };

  const simulateFormSubmit = async () => {
    setIsFormLoading(true);
    await simulateAsync(2000);
    setIsFormLoading(false);
    toast.success('表单提交成功!');
  };

  const simulatePageLoad = async () => {
    setIsPageLoading(true);
    await simulateAsync(3000);
    setIsPageLoading(false);
  };

  const simulateProgressLoad = async () => {
    setIsProgressLoading(true);
    setProgress(0);
    for (let i = 0; i <= 100; i += 10) {
      setProgress(i);
      await simulateAsync(300);
    }
    setIsProgressLoading(false);
    toast.success('进度完成!');
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>列表加载场景</CardTitle>
          <CardDescription>模拟笔记列表加载</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={simulateListLoad} disabled={isListLoading}>
            {isListLoading ? '加载中...' : '加载列表'}
          </Button>
          
          <LoadingContainer
            isLoading={isListLoading}
            variant="wave"
            message="正在加载笔记列表..."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="p-4 border rounded-lg">
                  <h4 className="font-medium">笔记 {i}</h4>
                  <p className="text-sm text-muted-foreground">这是笔记内容预览...</p>
                </div>
              ))}
            </div>
          </LoadingContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>表单提交场景</CardTitle>
          <CardDescription>模拟表单提交加载</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4 max-w-md">
            <div className="space-y-2">
              <label className="text-sm font-medium">标题</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border rounded-md"
                placeholder="输入标题"
                disabled={isFormLoading}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">内容</label>
              <textarea 
                className="w-full px-3 py-2 border rounded-md min-h-[100px]"
                placeholder="输入内容"
                disabled={isFormLoading}
              />
            </div>
            <LoadingButton
              loading={isFormLoading}
              onClick={simulateFormSubmit}
              loaderVariant="orbit"
              loadingText="提交中..."
            >
              提交表单
            </LoadingButton>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>进度加载场景</CardTitle>
          <CardDescription>带进度显示的加载</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={simulateProgressLoad} disabled={isProgressLoading}>
            {isProgressLoading ? `加载中 ${progress}%` : '开始加载'}
          </Button>
          
          {isProgressLoading && (
            <div className="space-y-2">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                正在处理... {progress}%
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>全屏加载场景</CardTitle>
          <CardDescription>页面级别的加载覆盖</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={simulatePageLoad}>
            触发全屏加载 (3秒)
          </Button>
        </CardContent>
      </Card>

      <AnimatePresence>
        {isPageLoading && (
          <LoadingOverlay variant="orbit" message="页面加载中，请稍候..." />
        )}
      </AnimatePresence>

      <Card>
        <CardHeader>
          <CardTitle>内联加载指示器</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <InlineLoader variant="dots" message="正在同步数据..." />
            <InlineLoader variant="pulse" message="正在处理请求..." />
            <InlineLoader variant="orbit" message="正在连接服务器..." />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>组合测试</CardTitle>
          <CardDescription>多个加载状态同时进行</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <AsyncButton
              onClick={async () => { await simulateAsync(1000); }}
              onSuccess={() => toast.success('操作1完成')}
              size="sm"
            >
              操作 1
            </AsyncButton>
            <AsyncButton
              onClick={async () => { await simulateAsync(1500); }}
              onSuccess={() => toast.success('操作2完成')}
              size="sm"
            >
              操作 2
            </AsyncButton>
            <AsyncButton
              onClick={async () => { await simulateAsync(2000); }}
              onSuccess={() => toast.success('操作3完成')}
              size="sm"
            >
              操作 3
            </AsyncButton>
            <AsyncButton
              onClick={async () => { await simulateAsync(2500); }}
              onSuccess={() => toast.success('操作4完成')}
              size="sm"
            >
              操作 4
            </AsyncButton>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
