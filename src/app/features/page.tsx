import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  FolderTree, 
  Users, 
  Image, 
  Download, 
  Smartphone, 
  Search, 
  History, 
  FileText, 
  Webhook,
  ArrowLeft,
  Sparkles,
  Share2,
  Calculator,
  Zap,
  CheckCircle2,
  Palette,
  Globe,
  Lock,
  Tag,
  Clock,
  Eye,
  Edit3,
  Layers,
  Wifi,
  WifiOff,
  Keyboard,
  Moon,
  Sun,
  Database,
  Shield,
  Bookmark,
  Star,
  TrendingUp,
  Bell,
  Code2
} from "lucide-react"

export default async function FeaturesPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  // 核心功能
  const coreFeatures = [
    {
      icon: Edit3,
      title: "Markdown 编辑器",
      description: "强大的 Markdown 编辑器，支持实时预览和语法高亮",
      href: "/notes/new",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      status: "stable"
    },
    {
      icon: FolderTree,
      title: "文件夹管理",
      description: "创建、嵌套、拖放文件夹，树形结构组织笔记",
      href: "/notes",
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      status: "stable",
      info: "在笔记列表左侧查看文件夹树"
    },
    {
      icon: Search,
      title: "全文搜索",
      description: "统一搜索文件夹和笔记内容，支持全文检索",
      href: "/search",
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10",
      status: "stable"
    },
    {
      icon: Tag,
      title: "标签系统",
      description: "为笔记添加标签，快速分类和查找",
      href: "/notes",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      status: "stable"
    }
  ]

  // 协作功能
  const collaborationFeatures = [
    {
      icon: Users,
      title: "实时协作",
      description: "多人同时编辑笔记，实时同步光标和内容",
      href: "/notes",
      color: "text-green-600",
      bgColor: "bg-green-600/10",
      status: "beta",
      info: "需要启动 WebSocket 服务器"
    },
    {
      icon: Share2,
      title: "公开分享",
      description: "生成公开链接，与任何人分享你的笔记",
      href: "/notes",
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      status: "stable",
      info: "在笔记页面点击分享按钮"
    },
    {
      icon: Lock,
      title: "权限管理",
      description: "设置笔记访问权限，控制谁可以查看和编辑",
      href: "/notes",
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      status: "stable"
    }
  ]

  // 内容增强
  const contentFeatures = [
    {
      icon: Calculator,
      title: "数学公式",
      description: "完整的 LaTeX 数学公式渲染，支持行内和块级公式",
      href: "/notes/new",
      color: "text-blue-600",
      bgColor: "bg-blue-600/10",
      status: "new",
      info: "使用 $公式$ 或 $$公式$$ 语法"
    },
    {
      icon: Image,
      title: "图片上传",
      description: "拖拽、粘贴上传图片，支持进度显示和批量上传",
      href: "/notes/new",
      color: "text-purple-600",
      bgColor: "bg-purple-600/10",
      status: "new",
      info: "直接拖拽或 Ctrl+V 粘贴图片"
    },
    {
      icon: Palette,
      title: "语法高亮",
      description: "代码块语法高亮，支持多种编程语言",
      href: "/notes/new",
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
      status: "stable"
    },
    {
      icon: Eye,
      title: "实时预览",
      description: "Markdown 实时预览，所见即所得",
      href: "/notes/new",
      color: "text-pink-500",
      bgColor: "bg-pink-500/10",
      status: "stable"
    }
  ]

  // 导出与历史
  const exportFeatures = [
    {
      icon: Download,
      title: "多格式导出",
      description: "导出为 Markdown、PDF、HTML 格式",
      href: "/notes",
      color: "text-orange-600",
      bgColor: "bg-orange-600/10",
      status: "stable",
      info: "在编辑器工具栏点击导出"
    },
    {
      icon: History,
      title: "版本历史",
      description: "查看和恢复笔记的历史版本，追踪所有修改",
      href: "/notes",
      color: "text-yellow-600",
      bgColor: "bg-yellow-600/10",
      status: "stable",
      info: "在编辑器工具栏点击历史"
    },
    {
      icon: Clock,
      title: "自动保存",
      description: "编辑时自动保存，永不丢失内容",
      href: "/notes",
      color: "text-indigo-500",
      bgColor: "bg-indigo-500/10",
      status: "stable"
    }
  ]

  // 效率工具
  const productivityFeatures = [
    {
      icon: FileText,
      title: "模板系统",
      description: "使用和创建笔记模板，提高工作效率",
      href: "/templates",
      color: "text-indigo-600",
      bgColor: "bg-indigo-600/10",
      status: "stable"
    },
    {
      icon: Sparkles,
      title: "AI 助手",
      description: "AI 摘要、标签生成、内容格式化、语义搜索",
      href: "/ai",
      color: "text-violet-600",
      bgColor: "bg-violet-600/10",
      status: "beta"
    },
    {
      icon: Webhook,
      title: "Webhook 集成",
      description: "笔记事件通知和自动化集成",
      href: "/settings/webhooks",
      color: "text-red-600",
      bgColor: "bg-red-600/10",
      status: "stable"
    }
  ]

  // 移动端与体验
  const mobileFeatures = [
    {
      icon: Smartphone,
      title: "PWA 应用",
      description: "安装为原生应用，支持离线使用",
      href: "/settings/pwa",
      color: "text-pink-600",
      bgColor: "bg-pink-600/10",
      status: "stable"
    },
    {
      icon: Zap,
      title: "加载动画",
      description: "优雅的加载动画系统，提升用户体验",
      href: "/test-loading",
      color: "text-amber-600",
      bgColor: "bg-amber-600/10",
      status: "new",
      info: "Orbit、Pulse、Dots 等多种样式"
    },
    {
      icon: Globe,
      title: "响应式设计",
      description: "完美适配桌面、平板、手机各种设备",
      href: "/notes",
      color: "text-teal-500",
      bgColor: "bg-teal-500/10",
      status: "stable"
    }
  ]

  // 特色功能
  const specialFeatures = [
    {
      icon: WifiOff,
      title: "离线同步",
      description: "离线编辑笔记，联网后自动同步到云端",
      href: "/settings",
      color: "text-blue-700",
      bgColor: "bg-blue-700/10",
      status: "new",
      info: "支持离线编辑和自动冲突解决"
    },
    {
      icon: Keyboard,
      title: "快捷键支持",
      description: "丰富的键盘快捷键，提升编辑效率",
      href: "/help",
      color: "text-purple-700",
      bgColor: "bg-purple-700/10",
      status: "stable",
      info: "Ctrl+S 保存、Ctrl+K 搜索等"
    },
    {
      icon: Moon,
      title: "深色模式",
      description: "自动切换深色/浅色主题，保护眼睛",
      href: "/settings",
      color: "text-slate-700",
      bgColor: "bg-slate-700/10",
      status: "stable",
      info: "支持系统主题自动切换"
    },
    {
      icon: Database,
      title: "本地存储",
      description: "数据本地缓存，快速加载和离线访问",
      href: "/settings",
      color: "text-cyan-700",
      bgColor: "bg-cyan-700/10",
      status: "stable"
    },
    {
      icon: Shield,
      title: "数据加密",
      description: "端到端加密，保护你的隐私数据",
      href: "/settings",
      color: "text-red-700",
      bgColor: "bg-red-700/10",
      status: "beta",
      info: "支持笔记内容加密"
    },
    {
      icon: Bookmark,
      title: "收藏夹",
      description: "收藏重要笔记，快速访问常用内容",
      href: "/notes",
      color: "text-yellow-700",
      bgColor: "bg-yellow-700/10",
      status: "stable"
    },
    {
      icon: Star,
      title: "星标笔记",
      description: "标记重要笔记，置顶显示",
      href: "/notes",
      color: "text-orange-700",
      bgColor: "bg-orange-700/10",
      status: "stable"
    },
    {
      icon: TrendingUp,
      title: "数据统计",
      description: "笔记数量、编辑时长、活跃度统计",
      href: "/dashboard",
      color: "text-green-700",
      bgColor: "bg-green-700/10",
      status: "stable"
    },
    {
      icon: Bell,
      title: "提醒通知",
      description: "设置笔记提醒，定时通知",
      href: "/settings",
      color: "text-pink-700",
      bgColor: "bg-pink-700/10",
      status: "beta"
    },
    {
      icon: Code2,
      title: "代码片段",
      description: "保存和管理代码片段，快速插入",
      href: "/templates",
      color: "text-indigo-700",
      bgColor: "bg-indigo-700/10",
      status: "stable"
    }
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "new":
        return <Badge className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-500/30">新功能</Badge>
      case "beta":
        return <Badge className="bg-blue-500/20 text-blue-700 dark:text-blue-300 hover:bg-blue-500/30">测试版</Badge>
      case "stable":
        return <Badge className="bg-green-500/20 text-green-700 dark:text-green-300 hover:bg-green-500/30">稳定</Badge>
      default:
        return null
    }
  }

  const FeatureCard = ({ feature }: { feature: any }) => {
    const Icon = feature.icon
    return (
      <Link href={feature.href}>
        <Card className="h-full hover:shadow-xl transition-all duration-300 hover:scale-105 hover:-translate-y-1 cursor-pointer border-2 hover:border-primary/50 group">
          <CardHeader>
            <div className="flex items-start justify-between mb-3">
              <div className={`w-12 h-12 rounded-lg ${feature.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <Icon className={`h-6 w-6 ${feature.color} group-hover:animate-pulse`} />
              </div>
              {getStatusBadge(feature.status)}
            </div>
            <CardTitle className="group-hover:text-primary transition-colors">
              {feature.title}
            </CardTitle>
            <CardDescription className="group-hover:text-foreground/80 transition-colors">
              {feature.description}
            </CardDescription>
          </CardHeader>
          {feature.info && (
            <CardContent>
              <p className="text-sm text-muted-foreground italic group-hover:text-foreground/70 transition-colors">
                💡 {feature.info}
              </p>
            </CardContent>
          )}
        </Card>
      </Link>
    )
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      {/* 头部 */}
      <div className="mb-8">
        <Link href="/dashboard">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> 返回首页
          </Button>
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-4xl font-bold">功能展示</h1>
          <Badge variant="outline" className="text-lg px-3 py-1">
            <CheckCircle2 className="h-4 w-4 mr-1" />
            30+ 功能
          </Badge>
        </div>
        <p className="text-muted-foreground text-lg">探索所有可用的功能和工具，提升你的笔记体验</p>
      </div>

      {/* 核心功能 */}
      <section className="mb-12">
        <div className="flex items-center gap-2 mb-6">
          <Layers className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">核心功能</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {coreFeatures.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </div>
      </section>

      {/* 协作功能 */}
      <section className="mb-12">
        <div className="flex items-center gap-2 mb-6">
          <Users className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">协作功能</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collaborationFeatures.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </div>
      </section>

      {/* 内容增强 */}
      <section className="mb-12">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">内容增强</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {contentFeatures.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </div>
      </section>

      {/* 导出与历史 */}
      <section className="mb-12">
        <div className="flex items-center gap-2 mb-6">
          <Download className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">导出与历史</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exportFeatures.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </div>
      </section>

      {/* 效率工具 */}
      <section className="mb-12">
        <div className="flex items-center gap-2 mb-6">
          <Zap className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">效率工具</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {productivityFeatures.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </div>
      </section>

      {/* 移动端与体验 */}
      <section className="mb-12">
        <div className="flex items-center gap-2 mb-6">
          <Smartphone className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">移动端与体验</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mobileFeatures.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </div>
      </section>

      {/* 特色功能 */}
      <section className="mb-12">
        <div className="flex items-center gap-2 mb-6">
          <Star className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">特色功能</h2>
          <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
            亮点
          </Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {specialFeatures.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </div>
      </section>

      {/* 快速开始指南 */}
      <div className="mt-12 p-6 bg-muted/50 rounded-lg border border-border hover:border-primary/30 hover:shadow-md transition-all duration-300">
        <h2 className="text-xl font-bold mb-4">快速开始指南</h2>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-background/50 transition-colors group">
            <span className="font-bold text-primary group-hover:scale-125 transition-transform">1.</span>
            <p><strong className="group-hover:text-primary transition-colors">创建笔记：</strong>点击"新建笔记"按钮，开始使用 Markdown 编辑器</p>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-background/50 transition-colors group">
            <span className="font-bold text-primary group-hover:scale-125 transition-transform">2.</span>
            <p><strong className="group-hover:text-primary transition-colors">文件夹管理：</strong>在笔记列表左侧创建文件夹，拖放笔记进行组织</p>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-background/50 transition-colors group">
            <span className="font-bold text-primary group-hover:scale-125 transition-transform">3.</span>
            <p><strong className="group-hover:text-primary transition-colors">图片上传：</strong>在编辑器中直接粘贴图片或拖放图片文件</p>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-background/50 transition-colors group">
            <span className="font-bold text-primary group-hover:scale-125 transition-transform">4.</span>
            <p><strong className="group-hover:text-primary transition-colors">数学公式：</strong>使用 $E=mc^2$ 输入行内公式，$$公式$$ 输入块级公式</p>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-background/50 transition-colors group">
            <span className="font-bold text-primary group-hover:scale-125 transition-transform">5.</span>
            <p><strong className="group-hover:text-primary transition-colors">导出笔记：</strong>打开任意笔记，点击编辑器工具栏的导出按钮</p>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-background/50 transition-colors group">
            <span className="font-bold text-primary group-hover:scale-125 transition-transform">6.</span>
            <p><strong className="group-hover:text-primary transition-colors">版本历史：</strong>在编辑器工具栏点击历史按钮，查看和恢复历史版本</p>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-background/50 transition-colors group">
            <span className="font-bold text-primary group-hover:scale-125 transition-transform">7.</span>
            <p><strong className="group-hover:text-primary transition-colors">公开分享：</strong>在笔记页面点击分享按钮，生成公开链接</p>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-background/50 transition-colors group">
            <span className="font-bold text-primary group-hover:scale-125 transition-transform">8.</span>
            <p><strong className="group-hover:text-primary transition-colors">移动端：</strong>在设置中安装 PWA 应用，获得原生应用体验</p>
          </div>
        </div>
      </div>

      {/* 新功能亮点 */}
      <div className="mt-8 p-6 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-lg border-2 border-primary/20">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="h-6 w-6 text-primary animate-pulse" />
          <h2 className="text-xl font-bold">最新功能亮点</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-background/50 rounded-lg border border-border hover:border-primary/50 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold">数学公式支持</h3>
              <Badge className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-300">新</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              完整的 LaTeX 数学公式渲染，支持分数、根号、求和、积分、矩阵等
            </p>
            <div className="text-xs bg-muted p-2 rounded font-mono">
              $E = mc^2$ 或 $$\sum_{"i=1"}^{"n"} x_i$$
            </div>
          </div>
          <div className="p-4 bg-background/50 rounded-lg border border-border hover:border-primary/50 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <Image className="h-5 w-5 text-purple-600" />
              <h3 className="font-semibold">图片拖拽上传</h3>
              <Badge className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-300">新</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              直接拖拽或粘贴图片到编辑器，自动上传并插入，支持进度显示
            </p>
            <div className="text-xs bg-muted p-2 rounded">
              支持拖放、粘贴、批量上传、进度条
            </div>
          </div>
          <div className="p-4 bg-background/50 rounded-lg border border-border hover:border-primary/50 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <FolderTree className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold">文件夹侧边栏</h3>
              <Badge className="bg-green-500/20 text-green-700 dark:text-green-300">优化</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              在笔记列表页面左侧显示文件夹树，快速组织和筛选笔记
            </p>
            <div className="text-xs bg-muted p-2 rounded">
              访问 /notes 查看，支持展开/折叠、创建、筛选
            </div>
          </div>
          <div className="p-4 bg-background/50 rounded-lg border border-border hover:border-primary/50 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-5 w-5 text-amber-600" />
              <h3 className="font-semibold">加载动画系统</h3>
              <Badge className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-300">新</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              多种优雅的加载动画，自动应用于所有异步操作
            </p>
            <div className="text-xs bg-muted p-2 rounded">
              Orbit、Pulse、Dots、Wave 等多种样式
            </div>
          </div>
        </div>
      </div>

      {/* 技术栈 */}
      <div className="mt-8 p-6 bg-muted/30 rounded-lg border border-border">
        <h2 className="text-xl font-bold mb-4">技术栈</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="p-3 bg-background rounded-lg border border-border">
            <p className="font-semibold mb-1">前端框架</p>
            <p className="text-muted-foreground">Next.js 15 + React 19</p>
          </div>
          <div className="p-3 bg-background rounded-lg border border-border">
            <p className="font-semibold mb-1">样式</p>
            <p className="text-muted-foreground">Tailwind CSS + shadcn/ui</p>
          </div>
          <div className="p-3 bg-background rounded-lg border border-border">
            <p className="font-semibold mb-1">数据库</p>
            <p className="text-muted-foreground">PostgreSQL + Prisma</p>
          </div>
          <div className="p-3 bg-background rounded-lg border border-border">
            <p className="font-semibold mb-1">存储</p>
            <p className="text-muted-foreground">Supabase Storage</p>
          </div>
          <div className="p-3 bg-background rounded-lg border border-border">
            <p className="font-semibold mb-1">认证</p>
            <p className="text-muted-foreground">NextAuth.js</p>
          </div>
          <div className="p-3 bg-background rounded-lg border border-border">
            <p className="font-semibold mb-1">实时协作</p>
            <p className="text-muted-foreground">WebSocket</p>
          </div>
          <div className="p-3 bg-background rounded-lg border border-border">
            <p className="font-semibold mb-1">数学公式</p>
            <p className="text-muted-foreground">KaTeX</p>
          </div>
          <div className="p-3 bg-background rounded-lg border border-border">
            <p className="font-semibold mb-1">部署</p>
            <p className="text-muted-foreground">Vercel</p>
          </div>
        </div>
      </div>
    </div>
  )
}
