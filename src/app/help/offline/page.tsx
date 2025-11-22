'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Wifi, 
  WifiOff, 
  Cloud, 
  CloudOff, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle2,
  Info,
  BookOpen,
  Lightbulb,
  HelpCircle,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

export default function OfflineHelpPage() {
  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <Link href="/settings/offline">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回设置
          </Button>
        </Link>
        <h1 className="text-3xl font-bold mb-2">离线功能使用指南</h1>
        <p className="text-muted-foreground">
          了解如何在没有网络连接的情况下使用笔记应用，以及如何管理离线数据和同步。
        </p>
      </div>

      {/* Overview */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            离线功能概述
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            离线功能允许您在没有网络连接时继续使用笔记应用。所有在离线状态下创建或编辑的内容都会保存在本地，
            当网络恢复时自动同步到服务器。
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex gap-3 p-4 border rounded-lg">
              <CloudOff className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold mb-1">离线模式</h4>
                <p className="text-sm text-muted-foreground">
                  在没有网络时，所有操作都保存在本地浏览器中
                </p>
              </div>
            </div>
            <div className="flex gap-3 p-4 border rounded-lg">
              <RefreshCw className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold mb-1">自动同步</h4>
                <p className="text-sm text-muted-foreground">
                  网络恢复后，系统会自动将本地更改同步到服务器
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            工作原理
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">1</span>
                网络状态检测
              </h4>
              <p className="text-sm text-muted-foreground ml-8">
                系统会实时监测您的网络连接状态。当检测到离线时，会在界面顶部显示离线提示横幅。
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">2</span>
                本地数据存储
              </h4>
              <p className="text-sm text-muted-foreground ml-8">
                离线时创建或编辑的笔记会保存到浏览器的 IndexedDB 数据库中，确保数据不会丢失。
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">3</span>
                同步队列管理
              </h4>
              <p className="text-sm text-muted-foreground ml-8">
                所有离线操作都会添加到同步队列中，等待网络恢复后按顺序同步。
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">4</span>
                自动同步
              </h4>
              <p className="text-sm text-muted-foreground ml-8">
                网络恢复后，系统会在 5 秒内自动开始同步，将本地更改上传到服务器。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Best Practices */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            使用最佳实践
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <li className="flex gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">定期连接网络</p>
                <p className="text-sm text-muted-foreground">
                  建议定期连接网络以同步数据，避免积累过多未同步的更改。
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">注意存储空间</p>
                <p className="text-sm text-muted-foreground">
                  浏览器本地存储有限制，定期清理不需要的缓存数据。
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">检查同步状态</p>
                <p className="text-sm text-muted-foreground">
                  留意笔记卡片上的同步状态图标，确保重要内容已成功同步。
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">处理冲突</p>
                <p className="text-sm text-muted-foreground">
                  如果出现冲突提示，请仔细比较本地和服务器版本，选择合适的解决策略。
                </p>
              </div>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Status Icons */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>同步状态图标说明</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium text-sm">已同步</p>
                <p className="text-xs text-muted-foreground">数据已成功保存到服务器</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Cloud className="h-5 w-5 text-gray-400" />
              <div>
                <p className="font-medium text-sm">待同步</p>
                <p className="text-xs text-muted-foreground">等待网络恢复后同步</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
              <div>
                <p className="font-medium text-sm">同步中</p>
                <p className="text-xs text-muted-foreground">正在上传到服务器</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <p className="font-medium text-sm">同步失败</p>
                <p className="text-xs text-muted-foreground">需要手动重试或检查错误</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            常见问题解答
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="q1">
              <AccordionTrigger>离线创建的笔记会丢失吗？</AccordionTrigger>
              <AccordionContent>
                不会。离线创建的笔记会保存在浏览器的本地数据库中，即使关闭浏览器也不会丢失。
                只要不清除浏览器数据，这些笔记会一直保留，直到网络恢复后同步到服务器。
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="q2">
              <AccordionTrigger>如何知道笔记是否已同步？</AccordionTrigger>
              <AccordionContent>
                每个笔记卡片右上角都有同步状态图标。绿色对勾表示已同步，灰色云图标表示待同步，
                旋转的图标表示正在同步，红色警告图标表示同步失败。您可以点击图标查看详细信息。
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="q3">
              <AccordionTrigger>同步失败怎么办？</AccordionTrigger>
              <AccordionContent>
                同步失败可能是由于网络不稳定或服务器错误。系统会自动重试最多 3 次。
                如果仍然失败，您可以点击同步状态图标，查看错误信息并手动重试。
                如果问题持续，请检查网络连接或联系技术支持。
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="q4">
              <AccordionTrigger>什么是冲突？如何解决？</AccordionTrigger>
              <AccordionContent>
                当您在离线状态下编辑了一个笔记，而同时其他设备或用户也编辑了同一笔记时，就会产生冲突。
                系统会显示冲突对比界面，让您选择保留本地版本、使用服务器版本或手动合并。
                建议仔细比较两个版本的差异后再做决定。
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="q5">
              <AccordionTrigger>草稿自动保存是如何工作的？</AccordionTrigger>
              <AccordionContent>
                当您在编辑器中输入内容时，系统会在您停止输入 3 秒后自动保存草稿到本地。
                如果页面意外关闭或刷新，下次打开编辑器时会提示您恢复草稿。
                草稿会保留 7 天，之后自动清理。
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="q6">
              <AccordionTrigger>本地存储空间不足怎么办？</AccordionTrigger>
              <AccordionContent>
                当可用存储空间小于 50MB 时，系统会显示警告。您可以前往"缓存管理"页面清理缓存。
                系统会自动删除 30 天未访问的笔记缓存，但会保留待同步的数据。
                您也可以手动选择要清理的数据类型。
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="q7">
              <AccordionTrigger>可以在多个设备上使用离线功能吗？</AccordionTrigger>
              <AccordionContent>
                可以。每个设备都有独立的本地存储。但请注意，如果在多个设备上同时编辑同一笔记，
                可能会产生冲突。建议在一个设备上完成编辑并同步后，再在其他设备上继续编辑。
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="q8">
              <AccordionTrigger>清除浏览器数据会影响离线笔记吗？</AccordionTrigger>
              <AccordionContent>
                会。清除浏览器数据会删除所有本地存储的笔记和同步队列。
                如果有未同步的数据，系统会在清除前显示警告，并提供"先同步再清除"的选项。
                建议在清除浏览器数据前确保所有数据已同步。
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Troubleshooting */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            故障排除指南
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold mb-2 text-red-600">问题：离线功能不工作</h4>
              <div className="ml-4 space-y-2 text-sm">
                <p className="font-medium">可能原因：</p>
                <ul className="list-disc ml-6 space-y-1 text-muted-foreground">
                  <li>浏览器不支持 IndexedDB</li>
                  <li>浏览器处于隐私模式</li>
                  <li>离线功能被禁用</li>
                </ul>
                <p className="font-medium mt-3">解决方案：</p>
                <ul className="list-disc ml-6 space-y-1 text-muted-foreground">
                  <li>使用现代浏览器（Chrome、Firefox、Edge、Safari）</li>
                  <li>退出隐私/无痕模式</li>
                  <li>前往设置页面检查离线功能是否启用</li>
                </ul>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2 text-red-600">问题：同步一直失败</h4>
              <div className="ml-4 space-y-2 text-sm">
                <p className="font-medium">可能原因：</p>
                <ul className="list-disc ml-6 space-y-1 text-muted-foreground">
                  <li>网络连接不稳定</li>
                  <li>服务器错误</li>
                  <li>认证令牌过期</li>
                </ul>
                <p className="font-medium mt-3">解决方案：</p>
                <ul className="list-disc ml-6 space-y-1 text-muted-foreground">
                  <li>检查网络连接是否正常</li>
                  <li>尝试刷新页面重新登录</li>
                  <li>查看同步状态详情中的错误信息</li>
                  <li>如果问题持续，请联系技术支持</li>
                </ul>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2 text-red-600">问题：草稿没有自动保存</h4>
              <div className="ml-4 space-y-2 text-sm">
                <p className="font-medium">可能原因：</p>
                <ul className="list-disc ml-6 space-y-1 text-muted-foreground">
                  <li>浏览器 LocalStorage 已满</li>
                  <li>浏览器阻止了存储访问</li>
                </ul>
                <p className="font-medium mt-3">解决方案：</p>
                <ul className="list-disc ml-6 space-y-1 text-muted-foreground">
                  <li>清理浏览器缓存和过期草稿</li>
                  <li>检查浏览器设置，允许网站存储数据</li>
                  <li>手动保存重要内容</li>
                </ul>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2 text-red-600">问题：存储空间不足警告</h4>
              <div className="ml-4 space-y-2 text-sm">
                <p className="font-medium">解决方案：</p>
                <ul className="list-disc ml-6 space-y-1 text-muted-foreground">
                  <li>前往"缓存管理"页面清理缓存</li>
                  <li>删除不需要的笔记</li>
                  <li>确保待同步的数据已成功同步</li>
                  <li>考虑使用其他浏览器或设备</li>
                </ul>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2 text-red-600">问题：数据冲突频繁出现</h4>
              <div className="ml-4 space-y-2 text-sm">
                <p className="font-medium">可能原因：</p>
                <ul className="list-disc ml-6 space-y-1 text-muted-foreground">
                  <li>在多个设备上同时编辑</li>
                  <li>长时间离线后同步</li>
                </ul>
                <p className="font-medium mt-3">解决方案：</p>
                <ul className="list-disc ml-6 space-y-1 text-muted-foreground">
                  <li>避免在多个设备上同时编辑同一笔记</li>
                  <li>定期连接网络同步数据</li>
                  <li>在设置中配置默认冲突解决策略</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Resources */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>需要更多帮助？</AlertTitle>
        <AlertDescription>
          如果您遇到本指南未涵盖的问题，请访问我们的{' '}
          <Link href="/help" className="underline">
            帮助中心
          </Link>
          {' '}或联系技术支持。
        </AlertDescription>
      </Alert>
    </div>
  );
}
