import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { AIConfigForm } from "@/components/settings/ai-config-form"
import { APIStatusBadge } from "@/components/settings/api-status-badge"

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

      <div className="space-y-6">
        <AIConfigForm />
        
        <div className="border-t pt-6">
          <h2 className="text-xl font-semibold mb-4">其他设置</h2>
          <div className="space-y-2">
            <a 
              href="/settings/offline"
              className="block p-4 border rounded-lg hover:bg-neutral-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">离线功能设置</h3>
                  <p className="text-sm text-neutral-600">配置离线编辑、自动同步和冲突处理</p>
                </div>
                <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </a>
            
            <a 
              href="/settings/cache"
              className="block p-4 border rounded-lg hover:bg-neutral-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">缓存管理</h3>
                  <p className="text-sm text-neutral-600">查看和管理本地缓存数据</p>
                </div>
                <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
