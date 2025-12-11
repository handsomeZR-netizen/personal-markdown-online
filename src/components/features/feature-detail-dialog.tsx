"use client"

import { useState, useRef, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Code2, 
  FileCode, 
  Layers, 
  Workflow,
  Copy,
  Check
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface TechDetail {
  name: string
  description: string
  type: "library" | "hook" | "api" | "component" | "pattern"
}

export interface CodeSnippet {
  title: string
  code: string
  language: string
  description?: string
}

export interface FileReference {
  path: string
  description: string
}

export interface FeatureDetailData {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
  // 技术栈
  technologies: TechDetail[]
  // 核心文件
  coreFiles: FileReference[]
  // 实现流程
  workflow: string[]
  // 代码示例
  codeSnippets: CodeSnippet[]
  // 关键函数
  keyFunctions: string[]
}

interface FeatureDetailDialogProps {
  feature: FeatureDetailData
  children: React.ReactNode
}

export function FeatureDetailDialog({ feature, children }: FeatureDetailDialogProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [dialogWidth, setDialogWidth] = useState(1152) // 默认 max-w-6xl = 72rem = 1152px
  const [isResizing, setIsResizing] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  const Icon = feature.icon

  const minWidth = 400
  const maxWidth = typeof window !== 'undefined' ? window.innerWidth * 0.95 : 1600

  // 处理弹窗打开/关闭
  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open)
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent, side: 'left' | 'right') => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    
    const startX = e.clientX
    const startWidth = dialogWidth

    const handleMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault()
      const deltaX = side === 'right' 
        ? moveEvent.clientX - startX 
        : startX - moveEvent.clientX
      const newWidth = Math.min(maxWidth, Math.max(minWidth, startWidth + deltaX * 2))
      setDialogWidth(newWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.body.style.cursor = 'ew-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [dialogWidth, maxWidth])

  const copyToClipboard = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const getTechBadgeColor = (type: TechDetail["type"]) => {
    switch (type) {
      case "library": return "bg-blue-500/20 text-blue-700 dark:text-blue-300"
      case "hook": return "bg-purple-500/20 text-purple-700 dark:text-purple-300"
      case "api": return "bg-green-500/20 text-green-700 dark:text-green-300"
      case "component": return "bg-orange-500/20 text-orange-700 dark:text-orange-300"
      case "pattern": return "bg-pink-500/20 text-pink-700 dark:text-pink-300"
      default: return "bg-gray-500/20 text-gray-700 dark:text-gray-300"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent 
        ref={dialogRef}
        style={{ width: dialogWidth }}
        className={cn(
          "!max-w-none !top-[50%] !left-[50%] !-translate-x-1/2 !-translate-y-1/2 h-[85vh] p-0 flex flex-col overflow-hidden",
          isResizing && "select-none !transition-none"
        )}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {/* 左侧拖拽手柄 */}
        <div
          className="absolute -left-1 top-0 bottom-0 w-3 cursor-ew-resize z-[60] flex items-center justify-center hover:bg-primary/10"
          onMouseDown={(e) => handleMouseDown(e, 'left')}
        >
          <div className="w-1 h-20 bg-muted-foreground/30 rounded-full" />
        </div>
        
        {/* 右侧拖拽手柄 */}
        <div
          className="absolute -right-1 top-0 bottom-0 w-3 cursor-ew-resize z-[60] flex items-center justify-center hover:bg-primary/10"
          onMouseDown={(e) => handleMouseDown(e, 'right')}
        >
          <div className="w-1 h-20 bg-muted-foreground/30 rounded-full" />
        </div>
        <DialogHeader className="p-6 pb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0", feature.bgColor)}>
              <Icon className={cn("h-6 w-6", feature.color)} />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-xl">{feature.title}</DialogTitle>
              <DialogDescription>{feature.description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="tech" className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="px-6 flex-shrink-0">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="tech" className="gap-2">
                <Layers className="h-4 w-4" />
                技术栈
              </TabsTrigger>
              <TabsTrigger value="files" className="gap-2">
                <FileCode className="h-4 w-4" />
                核心文件
              </TabsTrigger>
              <TabsTrigger value="workflow" className="gap-2">
                <Workflow className="h-4 w-4" />
                实现流程
              </TabsTrigger>
              <TabsTrigger value="code" className="gap-2">
                <Code2 className="h-4 w-4" />
                代码示例
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 min-h-0 overflow-hidden">
            <ScrollArea className="h-full w-full">
              <div className="px-6 pb-6">
            {/* 技术栈 Tab */}
            <TabsContent value="tech" className="mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {feature.technologies.map((tech, index) => (
                  <Card key={index} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{tech.name}</CardTitle>
                        <Badge className={getTechBadgeColor(tech.type)}>
                          {tech.type}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{tech.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {feature.keyFunctions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">关键函数</CardTitle>
                    <CardDescription>核心实现中使用的主要函数</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {feature.keyFunctions.map((func, index) => (
                        <code 
                          key={index}
                          className="px-2 py-1 bg-muted rounded text-sm font-mono"
                        >
                          {func}
                        </code>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* 核心文件 Tab */}
            <TabsContent value="files" className="mt-4 space-y-3">
              {feature.coreFiles.map((file, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <FileCode className="h-4 w-4 text-muted-foreground" />
                          <code className="text-sm font-mono text-primary">
                            {file.path}
                          </code>
                        </div>
                        <p className="text-sm text-muted-foreground pl-6">
                          {file.description}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => copyToClipboard(file.path, index)}
                      >
                        {copiedIndex === index ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* 实现流程 Tab */}
            <TabsContent value="workflow" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  <ol className="relative border-l border-muted-foreground/20 ml-3">
                    {feature.workflow.map((step, index) => (
                      <li key={index} className="mb-6 ml-6 last:mb-0">
                        <span className="absolute flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full -left-4 ring-4 ring-background">
                          <span className="text-sm font-semibold text-primary">
                            {index + 1}
                          </span>
                        </span>
                        <p className="text-sm leading-relaxed">{step}</p>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 代码示例 Tab */}
            <TabsContent value="code" className="mt-4 space-y-4">
              {feature.codeSnippets.map((snippet, index) => (
                <Card key={index} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base truncate">{snippet.title}</CardTitle>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant="outline">{snippet.language}</Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => copyToClipboard(snippet.code, index + 1000)}
                        >
                          {copiedIndex === index + 1000 ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    {snippet.description && (
                      <CardDescription>{snippet.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="relative w-full">
                      <pre className="p-4 bg-muted overflow-x-auto overflow-y-auto max-h-[400px]">
                        <code className="text-sm font-mono whitespace-pre inline-block min-w-full">{snippet.code}</code>
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
              </div>
            </ScrollArea>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
