import { NextRequest } from 'next/server'
import { streamDeepSeekResponse } from '@/lib/ai/deepseek'
import { auth } from '@/auth'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    // 验证用户身份
    const session = await auth()
    if (!session?.user) {
      return new Response('未授权', { status: 401 })
    }

    const { content } = await req.json()

    if (!content) {
      return new Response('内容不能为空', { status: 400 })
    }

    const prompt = `你是一个专业的文档编辑助手。请帮我检查并优化以下 Markdown 文档的格式和内容：

1. 修正语法错误和拼写错误
2. 优化段落结构和排版
3. 统一标题层级
4. 改善列表格式
5. 确保 Markdown 语法正确
6. 保持原文的核心意思不变

请直接输出优化后的 Markdown 内容，不要添加任何解释或说明。

原文：
${content}`

    const stream = await streamDeepSeekResponse(prompt)

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('AI 格式化错误:', error)
    return new Response('AI 格式化失败', { status: 500 })
  }
}
