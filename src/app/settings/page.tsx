import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { AIConfigForm } from "@/components/settings/ai-config-form"
import { APIStatusBadge } from "@/components/settings/api-status-badge"
import { WebhookConfig } from "@/components/settings/webhook-config"
import { OfflineSettingsComponent } from "@/components/settings/offline-settings"
import { CacheSettingsComponent } from "@/components/settings/cache-settings"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Sparkles, Webhook, Wifi, HardDrive, Smartphone, Database } from "lucide-react"
import Link from "next/link"

export default async function SettingsPage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/login')
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-neutral-800">设置</h1>
          <APIStatusBadge />
        </div>
        <p className="text-neutral-600">管理你的应用配置和偏好设置</p>
      </div>

      <Accordion type="multiple" className="space-y-4">
        <AccordionItem value="ai-config" className="border rounded-lg px-6">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <div className="text-left">
                <div className="font-semibold">AI API 配置</div>
                <div className="text-sm text-muted-foreground font-normal">
                  配置 AI 提供商、API 密钥和模型设置
                </div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <AIConfigForm />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="webhook" className="border rounded-lg px-6">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <Webhook className="h-5 w-5 text-blue-600" />
              <div className="text-left">
                <div className="font-semibold">Webhook 集成</div>
                <div className="text-sm text-muted-foreground font-normal">
                  配置 Webhook URL 以接收笔记事件通知
                </div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <WebhookConfig />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="offline" className="border rounded-lg px-6">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <Wifi className="h-5 w-5 text-green-600" />
              <div className="text-left">
                <div className="font-semibold">离线功能设置</div>
                <div className="text-sm text-muted-foreground font-normal">
                  配置离线编辑、自动同步和冲突处理
                </div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <OfflineSettingsComponent />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="cache" className="border rounded-lg px-6">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <HardDrive className="h-5 w-5 text-orange-600" />
              <div className="text-left">
                <div className="font-semibold">缓存管理</div>
                <div className="text-sm text-muted-foreground font-normal">
                  查看和管理本地缓存数据
                </div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <CacheSettingsComponent />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="other-settings" className="border rounded-lg px-6">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <Database className="h-5 w-5 text-gray-600" />
              <div className="text-left">
                <div className="font-semibold">其他设置</div>
                <div className="text-sm text-muted-foreground font-normal">
                  PWA、存储管理等其他配置选项
                </div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              <Link 
                href="/settings/pwa"
                className="block p-4 border rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all duration-300 hover:shadow-md hover:scale-[1.02] hover:border-primary/50 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-5 w-5 text-indigo-600 group-hover:scale-110 transition-transform" />
                    <div>
                      <h3 className="font-medium group-hover:text-primary transition-colors">PWA 设置</h3>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">配置渐进式 Web 应用功能</p>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-neutral-400 group-hover:text-primary group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>

              <Link 
                href="/settings/storage"
                className="block p-4 border rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all duration-300 hover:shadow-md hover:scale-[1.02] hover:border-primary/50 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Database className="h-5 w-5 text-teal-600 group-hover:scale-110 transition-transform" />
                    <div>
                      <h3 className="font-medium group-hover:text-primary transition-colors">存储管理</h3>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">查看和管理存储空间使用情况</p>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-neutral-400 group-hover:text-primary group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
