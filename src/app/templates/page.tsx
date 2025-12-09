import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { TemplateLibrary } from "@/components/templates/template-library"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function TemplatesPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="mb-6">
        <Link href="/dashboard">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> 返回首页
          </Button>
        </Link>
        <h1 className="text-3xl font-bold mb-2">笔记模板</h1>
        <p className="text-muted-foreground">使用模板快速创建结构化笔记</p>
      </div>

      <TemplateLibrary />
    </div>
  )
}
