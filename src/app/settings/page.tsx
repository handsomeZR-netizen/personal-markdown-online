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
      </div>
    </div>
  )
}
