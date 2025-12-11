import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  ArrowLeft,
  BookOpen,
  Keyboard,
  Lightbulb,
  MessageCircle,
  FileText,
  Sparkles,
  HelpCircle
} from "lucide-react"

export default async function HelpPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  const helpSections = [
    {
      icon: BookOpen,
      title: "用户指南",
      description: "完整的功能使用指南和最佳实践",
      href: "/help/user-guide",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10"
    },
    {
      icon: FileText,
      title: "数学公式指南",
      description: "学习如何在笔记中使用 LaTeX 数学公式",
      href: "/help/math-formulas",
      color: "text-indigo-500",
      bgColor: "bg-indigo-500/10"
    },
    {
      icon: FileText,
      title: "功能导航",
      description: "浏览所有可用功能和快速访问",
      href: "/features",
      color: "text-green-500",
      bgColor: "bg-green-500/10"
    },
    {
      icon: Keyboard,
      title: "快捷键",
      description: "查看所有键盘快捷键",
      action: "shortcuts",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10"
    },
    {
      icon: Lightbulb,
      title: "使用技巧",
      description: "提高效率的技巧和窍门",
      tips: [
        "使用 Ctrl/Cmd + S 快速保存笔记",
        "使用 Ctrl/Cmd + N 快速创建新笔记",
        "使用 AI 标签建议自动分类笔记",
        "启用离线模式随时随地访问笔记",
        "使用模板快速创建结构化笔记",
        "使用版本历史追踪重要变更"
      ],
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10"
    },
    {
      icon: Sparkles,
      title: "AI 功能",
      description: "了解如何使用 AI 增强笔记",
      href: "/ai",
      color: "text-violet-500",
      bgColor: "bg-violet-500/10"
    },
    {
      icon: MessageCircle,
      title: "常见问题",
      description: "查找常见问题的答案",
      faqs: [
        {
          q: "如何邀请他人协作？",
          a: "打开笔记编辑页面，点击分享按钮，输入协作者邮箱即可。"
        },
        {
          q: "如何导出笔记？",
          a: "在笔记编辑页面点击导出按钮，选择 Markdown、PDF 或 HTML 格式。"
        },
        {
          q: "离线模式如何工作？",
          a: "应用会自动缓存笔记，离线时可以编辑，网络恢复后自动同步。"
        },
        {
          q: "如何使用 AI 功能？",
          a: "访问设置页面配置 AI API，然后在编辑器中使用 AI 标签建议和格式化功能。"
        },
        {
          q: "如何输入数学公式？",
          a: "使用 $公式$ 输入行内公式，使用 $$公式$$ 或 \\[公式\\] 输入块级公式。支持完整的 LaTeX 语法。"
        },
        {
          q: "如何拖拽上传图片？",
          a: "在编辑器中直接拖拽图片文件，或使用 Ctrl/Cmd+V 粘贴图片，会自动上传并插入。"
        }
      ],
      color: "text-orange-500",
      bgColor: "bg-orange-500/10"
    }
  ]

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="mb-8">
        <Link href="/dashboard">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> 返回首页
          </Button>
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <HelpCircle className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">帮助中心</h1>
        </div>
        <p className="text-muted-foreground">查找使用指南、技巧和常见问题解答</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {helpSections.map((section) => {
          const Icon = section.icon
          
          if (section.tips) {
            return (
              <Card key={section.title} className="col-span-1 md:col-span-2 hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg ${section.bgColor} flex items-center justify-center mb-4`}>
                    <Icon className={`h-6 w-6 ${section.color}`} />
                  </div>
                  <CardTitle>{section.title}</CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {section.tips.map((tip, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span className="text-sm">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )
          }

          if (section.faqs) {
            return (
              <Card key={section.title} className="col-span-1 md:col-span-2 hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg ${section.bgColor} flex items-center justify-center mb-4`}>
                    <Icon className={`h-6 w-6 ${section.color}`} />
                  </div>
                  <CardTitle>{section.title}</CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {section.faqs.map((faq, index) => (
                      <div key={index} className="border-l-2 border-primary/20 pl-4">
                        <h4 className="font-medium mb-1">{faq.q}</h4>
                        <p className="text-sm text-muted-foreground">{faq.a}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          }

          if (section.action === "shortcuts") {
            return (
              <Card key={section.title} className="hover:shadow-lg transition-all duration-300 cursor-pointer group">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg ${section.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className={`h-6 w-6 ${section.color}`} />
                  </div>
                  <CardTitle className="group-hover:text-primary transition-colors">{section.title}</CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    点击顶部导航栏的键盘图标查看所有快捷键，或按 <kbd className="px-2 py-1 bg-muted rounded">?</kbd> 键
                  </p>
                </CardContent>
              </Card>
            )
          }

          return (
            <Link key={section.title} href={section.href || "#"} target={'external' in section && section.external ? "_blank" : undefined}>
              <Card className="h-full hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer group">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg ${section.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className={`h-6 w-6 ${section.color}`} />
                  </div>
                  <CardTitle className="group-hover:text-primary transition-colors">{section.title}</CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* 快速链接 */}
      <div className="mt-12 p-6 bg-muted/50 rounded-lg border">
        <h2 className="text-xl font-bold mb-4">快速链接</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/features" className="text-sm hover:text-primary transition-colors">
            功能导航
          </Link>
          <Link href="/templates" className="text-sm hover:text-primary transition-colors">
            笔记模板
          </Link>
          <Link href="/ai" className="text-sm hover:text-primary transition-colors">
            AI 功能
          </Link>
          <Link href="/settings" className="text-sm hover:text-primary transition-colors">
            应用设置
          </Link>
          <Link href="/settings/webhooks" className="text-sm hover:text-primary transition-colors">
            Webhook 配置
          </Link>
          <Link href="/settings/pwa" className="text-sm hover:text-primary transition-colors">
            PWA 设置
          </Link>
          <Link href="/settings/storage" className="text-sm hover:text-primary transition-colors">
            存储管理
          </Link>
          <Link href="/search" className="text-sm hover:text-primary transition-colors">
            搜索笔记
          </Link>
        </div>
      </div>
    </div>
  )
}
