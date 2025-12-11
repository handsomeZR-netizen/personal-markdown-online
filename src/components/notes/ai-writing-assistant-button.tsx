"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Wand2, Loader2, GraduationCap, Smile, Minimize2, Maximize2, Pencil, Check } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

// 预设风格配置
const STYLE_PRESETS = [
  {
    id: "academic",
    name: "学术化",
    description: "使用专业术语，结构严谨，适合论文和报告",
    icon: GraduationCap,
    prompt: "请将以下内容改写为更加学术化的风格。使用专业术语，保持逻辑严谨，结构清晰，适合学术论文或正式报告。保持原文的核心观点不变。"
  },
  {
    id: "humorous",
    name: "幽默风趣",
    description: "轻松活泼，加入适当的幽默元素",
    icon: Smile,
    prompt: "请将以下内容改写为更加幽默风趣的风格。保持内容准确的同时，加入适当的幽默元素、比喻或轻松的表达方式，让读者阅读时感到愉悦。"
  },
  {
    id: "concise",
    name: "精简压缩",
    description: "删除冗余，保留核心，言简意赅",
    icon: Minimize2,
    prompt: "请将以下内容精简压缩。删除冗余的词句和重复的表达，只保留核心信息，使文字更加简洁有力。目标是在不丢失关键信息的前提下，尽可能减少字数。"
  },
  {
    id: "elaborate",
    name: "丰富扩展",
    description: "补充细节，增加例子，内容更充实",
    icon: Maximize2,
    prompt: "请将以下内容进行丰富扩展。补充相关的细节、背景信息、具体例子或数据支撑，使内容更加充实和有说服力。保持原文的主题和观点不变。"
  },
  {
    id: "professional",
    name: "商务专业",
    description: "正式得体，适合商务场合",
    icon: Pencil,
    prompt: "请将以下内容改写为商务专业风格。使用正式、得体的语言，适合商务邮件、报告或提案。保持专业性的同时确保表达清晰易懂。"
  },
]

interface AIWritingAssistantButtonProps {
  content: string
  onFormatted: (formattedContent: string) => void
  onFormattingChange?: (isFormatting: boolean) => void
}

export function AIWritingAssistantButton({ 
  content, 
  onFormatted, 
  onFormattingChange 
}: AIWritingAssistantButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null)
  const [customPrompt, setCustomPrompt] = useState("")

  // 通知父组件处理状态变化
  useEffect(() => {
    onFormattingChange?.(isProcessing)
  }, [isProcessing, onFormattingChange])

  const handleStyleSelect = async (styleId: string, prompt: string) => {
    if (!content.trim()) {
      toast.error("请先输入一些内容")
      return
    }

    setSelectedStyle(styleId)
    setIsProcessing(true)

    try {
      const response = await fetch('/api/ai/writing-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content, stylePrompt: prompt }),
      })

      if (!response.ok) {
        throw new Error('处理失败')
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('无法读取响应')
      }

      const decoder = new TextDecoder()
      let formattedText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') {
              break
            }
            try {
              const parsed = JSON.parse(data)
              if (parsed.content) {
                formattedText += parsed.content
                onFormatted(formattedText)
              }
            } catch {
              // 忽略解析错误
            }
          }
        }
      }

      toast.success("AI 写作助手处理完成！")
      setIsOpen(false)
    } catch (error) {
      console.error('AI 写作助手错误:', error)
      toast.error("处理失败，请稍后重试")
    } finally {
      setIsProcessing(false)
      setSelectedStyle(null)
    }
  }

  const handleCustomSubmit = () => {
    if (!customPrompt.trim()) {
      toast.error("请输入自定义指令")
      return
    }
    handleStyleSelect("custom", customPrompt)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              AI 处理中...
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4 mr-2" />
              AI 写作助手
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            AI 写作助手
          </DialogTitle>
          <DialogDescription>
            选择一种风格，AI 将帮你改写当前内容
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 预设风格选项 */}
          <div className="grid grid-cols-1 gap-2">
            {STYLE_PRESETS.map((style) => {
              const Icon = style.icon
              const isSelected = selectedStyle === style.id
              const isDisabled = isProcessing && selectedStyle !== style.id
              
              return (
                <button
                  key={style.id}
                  onClick={() => handleStyleSelect(style.id, style.prompt)}
                  disabled={isDisabled}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border text-left transition-all",
                    "hover:bg-accent hover:border-primary/50",
                    isSelected && "border-primary bg-primary/5",
                    isDisabled && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <div className={cn(
                    "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center",
                    isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                  )}>
                    {isSelected && isProcessing ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : isSelected && !isProcessing ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{style.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {style.description}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* 分隔线 */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                或者
              </span>
            </div>
          </div>

          {/* 自定义指令 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">自定义指令</label>
            <Textarea
              placeholder="输入你的自定义指令，例如：请将内容翻译成英文..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="min-h-[80px] resize-none"
              disabled={isProcessing}
            />
            <Button
              onClick={handleCustomSubmit}
              disabled={isProcessing || !customPrompt.trim()}
              className="w-full"
            >
              {isProcessing && selectedStyle === "custom" ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  处理中...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  应用自定义指令
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
