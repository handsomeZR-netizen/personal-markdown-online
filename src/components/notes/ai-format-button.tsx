"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sparkles, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface AIFormatButtonProps {
  content: string
  onFormatted: (formattedContent: string) => void
}

export function AIFormatButton({ content, onFormatted }: AIFormatButtonProps) {
  const [isFormatting, setIsFormatting] = useState(false)

  const handleFormat = async () => {
    if (!content.trim()) {
      toast.error("请先输入一些内容")
      return
    }

    setIsFormatting(true)

    try {
      const response = await fetch('/api/ai/format', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      })

      if (!response.ok) {
        throw new Error('格式化失败')
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
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }

      toast.success("AI 格式化完成！")
    } catch (error) {
      console.error('格式化错误:', error)
      toast.error("格式化失败，请稍后重试")
    } finally {
      setIsFormatting(false)
    }
  }

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleFormat}
        disabled={isFormatting}
        className={`relative overflow-visible ${isFormatting ? 'z-10' : ''}`}
      >
        {isFormatting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            AI 处理中...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4 mr-2" />
            AI 检查排版
          </>
        )}
      </Button>
      
      {/* 彩虹霓虹灯边框效果 */}
      {isFormatting && (
        <div className="absolute inset-0 rounded-md animate-rainbow-border pointer-events-none -z-10" />
      )}
    </div>
  )
}
