import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { WebhookConfig } from "@/components/settings/webhook-config"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function WebhooksPage() {
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
        <h1 className="text-3xl font-bold mb-2">Webhook 配置</h1>
        <p className="text-muted-foreground">配置笔记事件的 Webhook 通知</p>
      </div>

      <WebhookConfig />
    </div>
  )
}
