import { NextRequest } from 'next/server'
import { streamDeepSeekResponse } from '@/lib/ai/deepseek'
import { auth } from '@/auth'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    // 验证用户身份
    const session = await auth()
    if (!session?.user) {
      return new Response('未授权', { status: 401 })
    }

    const { content, stylePrompt } = await req.json()

    if (!content) {
      return new Response('内容不能为空', { status: 400 })
    }

    if (!stylePrompt) {
      return new Response('请选择一种风格或输入自定义指令', { status: 400 })
    }

    const systemPrompt = `你是一个专业的写作助手。你的职责是根据用户的指令改写文档内容。

【核心规则】
1. 严格按照用户指定的风格或指令进行改写
2. 保持原文的核心观点和主要信息不变
3. 改写后的内容应该流畅自然，符合指定风格
4. 如果原文包含 Markdown 格式，保持格式结构
5. 不要添加与原文无关的新内容
6. 不要回答原文中的问题，只进行风格改写
7. 直接输出改写后的内容，不要添加解释或说明

【输出要求】
- 直接输出改写后的文本
- 保持原有的段落结构
- 如果有代码块、列表等格式，保持不变
- 不要在开头或结尾添加任何说明文字`

    const prompt = `${stylePrompt}

原文内容：
${content}`

    const stream = await streamDeepSeekResponse(prompt, systemPrompt)

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('AI 写作助手错误:', error)
    return new Response('AI 写作助手处理失败', { status: 500 })
  }
}
