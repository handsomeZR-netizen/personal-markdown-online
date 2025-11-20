import { NextResponse } from 'next/server'

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY
const DEEPSEEK_API_URL = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1'

export async function GET() {
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
    })

    if (!response.ok) {
      throw new Error('Failed to fetch quote from DeepSeek API')
    }

    const data = await response.json()
    const quote = data.choices[0]?.message?.content || '保持渴望，保持愚蠢。 — 史蒂夫·乔布斯'

    return NextResponse.json({ quote })
  } catch (error) {
    console.error('Error fetching quote:', error)
    // 返回默认名言
    const defaultQuotes = [
      '保持渴望，保持愚蠢。 — 史蒂夫·乔布斯',
      '成功是从失败到失败，也依然不改热情。 — 温斯顿·丘吉尔',
      '唯一限制我们实现明天的，是我们对今天的怀疑。 — 富兰克林·罗斯福',
      '生活就像骑自行车，要保持平衡就得不断前进。 — 阿尔伯特·爱因斯坦',
      '你不能改变过去，但你可以改变未来。 — 孔子',
    ]
    const randomQuote = defaultQuotes[Math.floor(Math.random() * defaultQuotes.length)]
    return NextResponse.json({ quote: randomQuote })
  }
}
