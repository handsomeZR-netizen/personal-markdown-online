import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { PWASettings } from "@/components/settings/pwa-settings"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function PWASettingsPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-6">
        <Link href="/settings">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> 返回设置
          </Button>
        </Link>
        <h1 className="text-3xl font-bold mb-2">PWA 设置</h1>
        <p className="text-muted-foreground">配置渐进式 Web 应用功能</p>
      </div>

      <PWASettings />
    </div>
  )
}
