import { NextResponse } from 'next/server'

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY
const DEEPSEEK_API_URL = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1'

// 默认名言库
const DEFAULT_QUOTES = [
  '保持渴望，保持愚蠢。 — 史蒂夫·乔布斯',
  '成功是从失败到失败，也依然不改热情。 — 温斯顿·丘吉尔',
  '唯一限制我们实现明天的，是我们对今天的怀疑。 — 富兰克林·罗斯福',
  '生活就像骑自行车，要保持平衡就得不断前进。 — 阿尔伯特·爱因斯坦',
  '你不能改变过去，但你可以改变未来。 — 孔子',
  '教育的目的是让人能够终身自我教育。 — 约翰·杜威',
  '知识就是力量。 — 弗朗西斯·培根',
  '学习永远不晚。 — 高尔基',
  '读书破万卷，下笔如有神。 — 杜甫',
  '路漫漫其修远兮，吾将上下而求索。 — 屈原',
]

function getRandomQuote(): string {
  return DEFAULT_QUOTES[Math.floor(Math.random() * DEFAULT_QUOTES.length)]
}

export async function GET() {
  // 如果没有配置 API Key，直接返回默认名言
  if (!DEEPSEEK_API_KEY) {
    return NextResponse.json({ 
      quote: getRandomQuote(),
      source: 'default'
    })
  }

  try {
    const response = await fetch(`${DEEPSEEK_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: '你是一个名人名言生成器。请生成一条简短的、富有哲理的名人名言，包含名言内容和作者。格式：名言内容 — 作者名字。名言要积极向上，适合激励学习和工作。只返回名言本身，不要其他内容。'
          },
          {
            role: 'user',
            content: '请生成一条关于学习、成长、坚持或创新的名人名言'
          }
        ],
        temperature: 0.8,
        max_tokens: 100,
      }),
      signal: AbortSignal.timeout(5000), // 5秒超时
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      console.warn(`DeepSeek API returned ${response.status}: ${errorText}`)
      return NextResponse.json({ 
        quote: getRandomQuote(),
        source: 'default'
      })
    }

    const data = await response.json()
    const quote = data.choices[0]?.message?.content

    if (!quote) {
      return NextResponse.json({ 
        quote: getRandomQuote(),
        source: 'default'
      })
    }

    return NextResponse.json({ 
      quote,
      source: 'ai'
    })
  } catch (error) {
    // 只在开发环境输出详细错误
    if (process.env.NODE_ENV === 'development') {
      console.warn('DeepSeek API error (using fallback):', error instanceof Error ? error.message : 'Unknown error')
    }
    
    // 静默降级到默认名言
    return NextResponse.json({ 
      quote: getRandomQuote(),
      source: 'default'
    })
  }
}
