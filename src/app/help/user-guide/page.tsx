import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  ArrowLeft,
  BookOpen,
  PenLine,
  FolderTree,
  Search,
  Users,
  Download,
  Sparkles,
  Wifi,
  Keyboard,
  Settings,
  HelpCircle,
  ChevronRight
} from "lucide-react"

export default async function UserGuidePage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  const sections = [
    {
      id: "getting-started",
      icon: BookOpen,
      title: "快速开始",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      content: [
        { subtitle: "创建笔记", text: "点击左上角「新建笔记」按钮，输入标题后即可开始编写。笔记会自动保存。" },
        { subtitle: "编辑内容", text: "使用富文本编辑器编写内容，支持 Markdown 语法、代码高亮、数学公式等。" },
        { subtitle: "组织笔记", text: "通过文件夹、标签和分类来组织你的笔记，让内容井井有条。" }
      ]
    },
    {
      id: "editor",
      icon: PenLine,
      title: "编辑器功能",
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      content: [
        { subtitle: "格式化", text: "支持粗体、斜体、删除线、下划线、代码、引用、列表等格式。" },
        { subtitle: "Markdown", text: "完全支持 Markdown 语法，可以直接输入 # 标题、- 列表、> 引用等。" },
        { subtitle: "代码块", text: "支持多种编程语言的语法高亮，使用 ``` 包裹代码即可。" },
        { subtitle: "数学公式", text: "使用 $...$ 输入行内公式，$$...$$ 输入块级公式，支持完整 LaTeX 语法。" },
        { subtitle: "图片上传", text: "拖拽图片到编辑器或使用 Ctrl+V 粘贴，自动上传并插入。" }
      ]
    },
    {
      id: "organization",
      icon: FolderTree,
      title: "组织笔记",
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
      content: [
        { subtitle: "文件夹", text: "创建多级文件夹来组织笔记，支持拖拽移动笔记到不同文件夹。" },
        { subtitle: "标签", text: "为笔记添加标签便于分类和筛选，支持 AI 自动生成标签建议。" },
        { subtitle: "分类", text: "使用分类对笔记进行大类划分，每个笔记可以属于一个分类。" },
        { subtitle: "排序", text: "支持按创建时间、修改时间、标题等多种方式排序，也支持手动拖拽排序。" }
      ]
    },
    {
      id: "search",
      icon: Search,
      title: "搜索功能",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      content: [
        { subtitle: "全文搜索", text: "搜索笔记标题和内容，快速找到需要的信息。" },
        { subtitle: "高级筛选", text: "按日期、文件夹、标签、分类等条件筛选笔记。" },
        { subtitle: "AI 搜索", text: "使用自然语言描述你要找的内容，AI 帮你智能匹配。" }
      ]
    },
    {
      id: "collaboration",
      icon: Users,
      title: "协作功能",
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
      content: [
        { subtitle: "分享笔记", text: "生成公开链接分享笔记，或邀请特定用户协作编辑。" },
        { subtitle: "实时协作", text: "多人同时编辑同一笔记，实时显示其他人的光标和编辑内容。" },
        { subtitle: "权限管理", text: "设置协作者的权限：只读、可编辑或管理员。" },
        { subtitle: "版本历史", text: "自动保存历史版本，可以查看和恢复任意历史版本。" }
      ]
    },
    {
      id: "export",
      icon: Download,
      title: "导出功能",
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10",
      content: [
        { subtitle: "Markdown", text: "导出为 .md 文件，保留原始格式，方便在其他编辑器中使用。" },
        { subtitle: "PDF", text: "导出为 PDF 文件，适合打印和正式分享。" },
        { subtitle: "HTML", text: "导出为 HTML 文件，可在浏览器中直接查看。" }
      ]
    },
    {
      id: "ai",
      icon: Sparkles,
      title: "AI 功能",
      color: "text-violet-500",
      bgColor: "bg-violet-500/10",
      content: [
        { subtitle: "智能标签", text: "AI 分析笔记内容，自动推荐相关标签。" },
        { subtitle: "内容格式化", text: "AI 帮助优化笔记格式，整理标题层级和段落结构。" },
        { subtitle: "AI 问答", text: "基于笔记内容进行问答，快速查找信息或生成摘要。" }
      ]
    },
    {
      id: "offline",
      icon: Wifi,
      title: "离线功能",
      color: "text-teal-500",
      bgColor: "bg-teal-500/10",
      content: [
        { subtitle: "离线访问", text: "已加载的笔记可以离线查看和编辑。" },
        { subtitle: "自动同步", text: "网络恢复后自动同步离线期间的修改。" },
        { subtitle: "草稿恢复", text: "意外关闭时自动保存草稿，下次打开可恢复。" }
      ]
    }
  ]

  const shortcuts = [
    { keys: "Ctrl/Cmd + N", desc: "新建笔记" },
    { keys: "Ctrl/Cmd + S", desc: "保存笔记" },
    { keys: "Ctrl/Cmd + F", desc: "搜索" },
    { keys: "Ctrl/Cmd + B", desc: "粗体" },
    { keys: "Ctrl/Cmd + I", desc: "斜体" },
    { keys: "Ctrl/Cmd + K", desc: "插入链接" },
    { keys: "Ctrl/Cmd + Z", desc: "撤销" },
    { keys: "Ctrl/Cmd + Shift + Z", desc: "重做" }
  ]

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <div className="mb-8">
        <Link href="/help">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> 返回帮助中心
          </Button>
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <BookOpen className="h-6 w-6 text-blue-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">用户指南</h1>
            <p className="text-muted-foreground">完整的功能使用指南和最佳实践</p>
          </div>
        </div>
      </div>

      {/* 目录导航 */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">目录</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {sections.map((section) => {
              const Icon = section.icon
              return (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <Icon className={`h-4 w-4 ${section.color}`} />
                  <span className="text-sm">{section.title}</span>
                </a>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* 内容区域 */}
      <div className="space-y-8">
        {sections.map((section) => {
          const Icon = section.icon
          return (
            <Card key={section.id} id={section.id} className="scroll-mt-4">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${section.bgColor} flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 ${section.color}`} />
                  </div>
                  <CardTitle>{section.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {section.content.map((item, index) => (
                    <div key={index} className="flex gap-3">
                      <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium mb-1">{item.subtitle}</h4>
                        <p className="text-sm text-muted-foreground">{item.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}

        {/* 快捷键 */}
        <Card id="shortcuts" className="scroll-mt-4">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center">
                <Keyboard className="h-5 w-5 text-pink-500" />
              </div>
              <CardTitle>常用快捷键</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {shortcuts.map((shortcut, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <span className="text-sm">{shortcut.desc}</span>
                  <kbd className="px-2 py-1 bg-background rounded border text-xs font-mono">
                    {shortcut.keys}
                  </kbd>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 更多帮助 */}
        <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <HelpCircle className="h-8 w-8 text-primary" />
              <div className="flex-1">
                <h3 className="font-semibold mb-1">需要更多帮助？</h3>
                <p className="text-sm text-muted-foreground">
                  查看常见问题或联系我们获取支持
                </p>
              </div>
              <Link href="/help">
                <Button>返回帮助中心</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
