import { FileText, Sparkles, Webhook } from "lucide-react"
import type { FeatureDetailData } from "./feature-detail-dialog"

/**
 * 效率工具功能详细数据配置
 */

// 1. 模板系统功能详情
export const templateSystemFeature: FeatureDetailData = {
  title: "模板系统",
  description: "使用和创建笔记模板，提高工作效率",
  icon: FileText,
  color: "text-indigo-600",
  bgColor: "bg-indigo-600/10",
  technologies: [
    {
      name: "NoteTemplate 模型",
      description: "Prisma 模型存储模板数据，包含标题、内容、分类和标签",
      type: "pattern"
    },
    {
      name: "模板分类系统",
      description: "支持按类型分类模板：会议记录、项目计划、日记等",
      type: "pattern"
    },
    {
      name: "模板预览",
      description: "在选择模板前预览内容，支持实时渲染",
      type: "component"
    },
    {
      name: "自定义模板",
      description: "用户可以将现有笔记保存为模板，方便复用",
      type: "pattern"
    },
    {
      name: "模板变量",
      description: "支持 {{date}}、{{title}} 等变量，创建时自动替换",
      type: "pattern"
    },
    {
      name: "Server Actions",
      description: "使用 Next.js Server Actions 处理模板 CRUD 操作",
      type: "api"
    }
  ],
  coreFiles: [
    {
      path: "src/components/templates/template-list.tsx",
      description: "模板列表组件，展示所有可用模板"
    },
    {
      path: "src/components/templates/template-card.tsx",
      description: "单个模板卡片，显示预览和操作按钮"
    },
    {
      path: "src/components/templates/template-dialog.tsx",
      description: "模板选择对话框，用于新建笔记时选择模板"
    },
    {
      path: "src/components/templates/create-template-dialog.tsx",
      description: "创建模板对话框，从现有笔记创建模板"
    },
    {
      path: "src/app/api/templates/route.ts",
      description: "模板 API，处理模板的增删改查"
    },
    {
      path: "src/lib/actions/template-actions.ts",
      description: "模板相关的 Server Actions"
    },
    {
      path: "prisma/schema.prisma",
      description: "NoteTemplate 模型定义"
    }
  ],
  workflow: [
    "用户点击新建笔记时，可选择从模板创建",
    "系统显示模板选择对话框，按分类展示模板",
    "用户可以预览模板内容，查看结构和样式",
    "选择模板后，系统复制模板内容到新笔记",
    "自动替换模板变量（如日期、标题占位符）",
    "用户可以在任意笔记上点击「保存为模板」",
    "填写模板名称、描述和分类后保存",
    "模板存储到数据库，关联到用户账户",
    "支持编辑和删除已创建的模板",
    "系统提供预设模板供新用户使用"
  ],
  codeSnippets: [
    {
      title: "模板选择对话框",
      language: "typescript",
      description: "新建笔记时选择模板",
      code: `export function TemplateDialog({ onSelect }: TemplateDialogProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [category, setCategory] = useState<string>('all')
  const [preview, setPreview] = useState<Template | null>(null)

  useEffect(() => {
    fetchTemplates().then(setTemplates)
  }, [])

  const filteredTemplates = category === 'all' 
    ? templates 
    : templates.filter(t => t.category === category)

  const handleSelect = (template: Template) => {
    // 替换模板变量
    const content = replaceVariables(template.content, {
      date: format(new Date(), 'yyyy-MM-dd'),
      datetime: format(new Date(), 'yyyy-MM-dd HH:mm'),
      title: template.title,
    })
    onSelect({ ...template, content })
  }

  return (
    <Dialog>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>选择模板</DialogTitle>
        </DialogHeader>
        
        <div className="flex gap-4">
          {/* 分类筛选 */}
          <div className="w-48 space-y-2">
            {categories.map(cat => (
              <Button
                key={cat.value}
                variant={category === cat.value ? 'default' : 'ghost'}
                onClick={() => setCategory(cat.value)}
              >
                {cat.label}
              </Button>
            ))}
          </div>

          {/* 模板列表 */}
          <div className="flex-1 grid grid-cols-2 gap-4">
            {filteredTemplates.map(template => (
              <TemplateCard
                key={template.id}
                template={template}
                onSelect={() => handleSelect(template)}
                onPreview={() => setPreview(template)}
              />
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}`
    },
    {
      title: "保存为模板",
      language: "typescript",
      description: "将现有笔记保存为模板",
      code: `export async function saveAsTemplate(noteId: string, data: CreateTemplateData) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('未授权')
  }

  // 获取笔记内容
  const note = await prisma.note.findUnique({
    where: { id: noteId, userId: session.user.id },
    include: { tags: true },
  })

  if (!note) {
    throw new Error('笔记不存在')
  }

  // 创建模板
  const template = await prisma.noteTemplate.create({
    data: {
      name: data.name,
      description: data.description,
      content: note.content,
      category: data.category,
      tags: note.tags.map(t => t.name),
      userId: session.user.id,
      isPublic: data.isPublic ?? false,
    },
  })

  revalidatePath('/templates')
  return template
}`
    },
    {
      title: "模板变量替换",
      language: "typescript",
      description: "自动替换模板中的变量占位符",
      code: `const TEMPLATE_VARIABLES = {
  date: () => format(new Date(), 'yyyy-MM-dd'),
  datetime: () => format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
  time: () => format(new Date(), 'HH:mm'),
  year: () => format(new Date(), 'yyyy'),
  month: () => format(new Date(), 'MM'),
  day: () => format(new Date(), 'dd'),
  weekday: () => format(new Date(), 'EEEE', { locale: zhCN }),
}

export function replaceVariables(
  content: string, 
  customVars: Record<string, string> = {}
): string {
  let result = content

  // 替换内置变量
  Object.entries(TEMPLATE_VARIABLES).forEach(([key, getValue]) => {
    const regex = new RegExp(\`{{\\s*\${key}\\s*}}\`, 'gi')
    result = result.replace(regex, getValue())
  })

  // 替换自定义变量
  Object.entries(customVars).forEach(([key, value]) => {
    const regex = new RegExp(\`{{\\s*\${key}\\s*}}\`, 'gi')
    result = result.replace(regex, value)
  })

  return result
}

// 使用示例
// 模板内容: "# {{date}} 会议记录\\n\\n## 参会人员\\n\\n## 会议内容"
// 输出: "# 2024-01-15 会议记录\\n\\n## 参会人员\\n\\n## 会议内容"`
    }
  ],
  keyFunctions: [
    "fetchTemplates()",
    "saveAsTemplate()",
    "replaceVariables()",
    "prisma.noteTemplate.create()",
    "prisma.noteTemplate.findMany()",
    "revalidatePath()"
  ]
}


// 2. AI 助手功能详情
export const aiAssistantFeature: FeatureDetailData = {
  title: "AI 助手",
  description: "AI 摘要、标签生成、内容格式化、语义搜索",
  icon: Sparkles,
  color: "text-violet-600",
  bgColor: "bg-violet-600/10",
  technologies: [
    {
      name: "OpenAI API",
      description: "使用 GPT 模型进行文本生成、摘要和分析",
      type: "api"
    },
    {
      name: "Embedding 向量",
      description: "将笔记内容转换为向量，支持语义搜索",
      type: "pattern"
    },
    {
      name: "Streaming Response",
      description: "流式响应，实时显示 AI 生成内容",
      type: "pattern"
    },
    {
      name: "useChat Hook",
      description: "Vercel AI SDK 的聊天 Hook，管理对话状态",
      type: "hook"
    },
    {
      name: "Prompt Engineering",
      description: "精心设计的提示词模板，优化 AI 输出质量",
      type: "pattern"
    },
    {
      name: "Rate Limiting",
      description: "API 调用频率限制，防止滥用和控制成本",
      type: "pattern"
    }
  ],
  coreFiles: [
    {
      path: "src/app/api/ai/chat/route.ts",
      description: "AI 聊天 API，处理对话请求"
    },
    {
      path: "src/app/api/ai/summarize/route.ts",
      description: "AI 摘要 API，生成笔记摘要"
    },
    {
      path: "src/app/api/ai/tags/route.ts",
      description: "AI 标签生成 API，自动提取关键词"
    },
    {
      path: "src/app/api/ai/format/route.ts",
      description: "AI 格式化 API，优化内容结构"
    },
    {
      path: "src/lib/ai/openai-client.ts",
      description: "OpenAI 客户端封装"
    },
    {
      path: "src/lib/ai/prompts.ts",
      description: "AI 提示词模板集合"
    },
    {
      path: "src/components/ai/ai-chat-panel.tsx",
      description: "AI 聊天面板组件"
    },
    {
      path: "src/components/ai/ai-suggestions.tsx",
      description: "AI 建议组件，显示智能推荐"
    }
  ],
  workflow: [
    "用户在编辑器中选择文本或打开 AI 面板",
    "选择 AI 功能：摘要、标签生成、格式化或问答",
    "前端发送请求到对应的 AI API 端点",
    "API 验证用户身份和使用配额",
    "构建提示词，包含用户内容和指令",
    "调用 OpenAI API，使用流式响应",
    "实时将生成内容返回给前端显示",
    "用户可以接受、修改或重新生成结果",
    "接受的内容自动插入到笔记中",
    "记录 API 使用量，用于配额管理"
  ],
  codeSnippets: [
    {
      title: "AI 摘要 API",
      language: "typescript",
      description: "生成笔记内容摘要",
      code: `import { OpenAIStream, StreamingTextResponse } from 'ai'
import { openai } from '@/lib/ai/openai-client'

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { content, length = 'medium' } = await request.json()

  const lengthGuide = {
    short: '50字以内',
    medium: '100-150字',
    long: '200-300字',
  }

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    stream: true,
    messages: [
      {
        role: 'system',
        content: \`你是一个专业的内容摘要助手。请用中文生成摘要，长度控制在\${lengthGuide[length]}。
摘要要求：
1. 提取核心观点和关键信息
2. 保持逻辑清晰，语言简洁
3. 不要添加原文没有的信息\`
      },
      {
        role: 'user',
        content: \`请为以下内容生成摘要：\n\n\${content}\`
      }
    ],
  })

  const stream = OpenAIStream(response)
  return new StreamingTextResponse(stream)
}`
    },
    {
      title: "AI 标签生成",
      language: "typescript",
      description: "自动从内容提取标签",
      code: `export async function generateTags(content: string): Promise<string[]> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: \`你是一个标签提取专家。从给定内容中提取3-5个最相关的标签。
要求：
1. 标签应该是单词或短语
2. 优先使用中文标签
3. 标签要具体且有意义
4. 返回 JSON 数组格式\`
      },
      {
        role: 'user',
        content: content
      }
    ],
    response_format: { type: 'json_object' },
  })

  const result = JSON.parse(response.choices[0].message.content || '{}')
  return result.tags || []
}

// 使用示例
const tags = await generateTags(noteContent)
// 返回: ["React", "状态管理", "性能优化", "Hooks"]`
    },
    {
      title: "AI 聊天面板",
      language: "typescript",
      description: "与 AI 进行对话的组件",
      code: `'use client'

import { useChat } from 'ai/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'

export function AIChatPanel({ noteContent }: { noteContent: string }) {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/ai/chat',
    body: { context: noteContent },
  })

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={\`mb-4 \${message.role === 'user' ? 'text-right' : ''}\`}
          >
            <div
              className={\`inline-block p-3 rounded-lg \${
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }\`}
            >
              {message.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            AI 正在思考...
          </div>
        )}
      </ScrollArea>

      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="询问关于这篇笔记的问题..."
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading}>
            发送
          </Button>
        </div>
      </form>
    </div>
  )
}`
    }
  ],
  keyFunctions: [
    "openai.chat.completions.create()",
    "OpenAIStream()",
    "StreamingTextResponse",
    "useChat()",
    "generateTags()",
    "generateSummary()",
    "formatContent()"
  ]
}

// 3. Webhook 集成功能详情
export const webhookIntegrationFeature: FeatureDetailData = {
  title: "Webhook 集成",
  description: "笔记事件通知和自动化集成",
  icon: Webhook,
  color: "text-red-600",
  bgColor: "bg-red-600/10",
  technologies: [
    {
      name: "Webhook 事件系统",
      description: "支持笔记创建、更新、删除等事件触发",
      type: "pattern"
    },
    {
      name: "签名验证",
      description: "使用 HMAC-SHA256 签名验证请求来源",
      type: "pattern"
    },
    {
      name: "重试机制",
      description: "失败请求自动重试，支持指数退避",
      type: "pattern"
    },
    {
      name: "事件日志",
      description: "记录所有 Webhook 调用历史和状态",
      type: "pattern"
    },
    {
      name: "Zod 验证",
      description: "使用 Zod 验证 Webhook 配置和负载",
      type: "library"
    },
    {
      name: "后台队列",
      description: "异步处理 Webhook 发送，不阻塞主流程",
      type: "pattern"
    }
  ],
  coreFiles: [
    {
      path: "src/app/api/webhooks/route.ts",
      description: "Webhook 配置 API，管理用户的 Webhook"
    },
    {
      path: "src/app/api/webhooks/[id]/route.ts",
      description: "单个 Webhook 操作 API"
    },
    {
      path: "src/app/api/webhooks/test/route.ts",
      description: "Webhook 测试 API，发送测试事件"
    },
    {
      path: "src/lib/webhooks/webhook-sender.ts",
      description: "Webhook 发送器，处理请求和重试"
    },
    {
      path: "src/lib/webhooks/webhook-events.ts",
      description: "Webhook 事件定义和触发器"
    },
    {
      path: "src/lib/webhooks/signature.ts",
      description: "签名生成和验证工具"
    },
    {
      path: "src/app/settings/webhooks/page.tsx",
      description: "Webhook 设置页面"
    },
    {
      path: "src/components/settings/webhook-form.tsx",
      description: "Webhook 配置表单组件"
    }
  ],
  workflow: [
    "用户在设置页面添加 Webhook URL",
    "选择要订阅的事件类型（创建、更新、删除等）",
    "系统生成唯一的签名密钥",
    "用户可以发送测试事件验证配置",
    "当订阅的事件发生时，系统触发 Webhook",
    "构建事件负载，包含笔记数据和元信息",
    "使用签名密钥生成 HMAC 签名",
    "异步发送 POST 请求到用户配置的 URL",
    "记录发送结果，失败时按策略重试",
    "用户可以查看 Webhook 调用历史和状态"
  ],
  codeSnippets: [
    {
      title: "Webhook 发送器",
      language: "typescript",
      description: "发送 Webhook 请求并处理重试",
      code: `import crypto from 'crypto'

interface WebhookPayload {
  event: string
  timestamp: string
  data: Record<string, any>
}

export async function sendWebhook(
  url: string,
  secret: string,
  payload: WebhookPayload,
  retries = 3
): Promise<boolean> {
  const body = JSON.stringify(payload)
  const signature = generateSignature(body, secret)

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Timestamp': payload.timestamp,
        },
        body,
      })

      if (response.ok) {
        await logWebhookCall(url, payload.event, 'success')
        return true
      }

      // 4xx 错误不重试
      if (response.status >= 400 && response.status < 500) {
        await logWebhookCall(url, payload.event, 'failed', response.status)
        return false
      }
    } catch (error) {
      console.error(\`Webhook attempt \${attempt} failed:\`, error)
    }

    // 指数退避
    if (attempt < retries) {
      await sleep(Math.pow(2, attempt) * 1000)
    }
  }

  await logWebhookCall(url, payload.event, 'failed', 'max_retries')
  return false
}

function generateSignature(payload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
}`
    },
    {
      title: "事件触发器",
      language: "typescript",
      description: "在笔记操作时触发 Webhook",
      code: `// 定义事件类型
export const WEBHOOK_EVENTS = {
  NOTE_CREATED: 'note.created',
  NOTE_UPDATED: 'note.updated',
  NOTE_DELETED: 'note.deleted',
  NOTE_SHARED: 'note.shared',
  COLLABORATOR_ADDED: 'collaborator.added',
} as const

export type WebhookEvent = typeof WEBHOOK_EVENTS[keyof typeof WEBHOOK_EVENTS]

// 触发 Webhook
export async function triggerWebhooks(
  userId: string,
  event: WebhookEvent,
  data: Record<string, any>
) {
  // 获取用户订阅了此事件的所有 Webhook
  const webhooks = await prisma.webhook.findMany({
    where: {
      userId,
      enabled: true,
      events: { has: event },
    },
  })

  const payload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    data,
  }

  // 异步发送所有 Webhook
  await Promise.allSettled(
    webhooks.map(webhook =>
      sendWebhook(webhook.url, webhook.secret, payload)
    )
  )
}

// 在笔记创建时调用
export async function createNote(data: CreateNoteData) {
  const note = await prisma.note.create({ data })
  
  // 触发 Webhook（不阻塞响应）
  triggerWebhooks(note.userId, WEBHOOK_EVENTS.NOTE_CREATED, {
    noteId: note.id,
    title: note.title,
    createdAt: note.createdAt,
  })

  return note
}`
    },
    {
      title: "Webhook 配置表单",
      language: "typescript",
      description: "用户配置 Webhook 的表单组件",
      code: `'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const webhookSchema = z.object({
  name: z.string().min(1, '请输入名称'),
  url: z.string().url('请输入有效的 URL'),
  events: z.array(z.string()).min(1, '请至少选择一个事件'),
  enabled: z.boolean().default(true),
})

export function WebhookForm({ onSubmit }: WebhookFormProps) {
  const form = useForm({
    resolver: zodResolver(webhookSchema),
    defaultValues: {
      name: '',
      url: '',
      events: [],
      enabled: true,
    },
  })

  const eventOptions = [
    { value: 'note.created', label: '笔记创建' },
    { value: 'note.updated', label: '笔记更新' },
    { value: 'note.deleted', label: '笔记删除' },
    { value: 'note.shared', label: '笔记分享' },
  ]

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>名称</FormLabel>
              <FormControl>
                <Input placeholder="我的 Webhook" {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com/webhook" {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="events"
          render={({ field }) => (
            <FormItem>
              <FormLabel>订阅事件</FormLabel>
              <div className="grid grid-cols-2 gap-2">
                {eventOptions.map(option => (
                  <label key={option.value} className="flex items-center gap-2">
                    <Checkbox
                      checked={field.value.includes(option.value)}
                      onCheckedChange={(checked) => {
                        const newValue = checked
                          ? [...field.value, option.value]
                          : field.value.filter(v => v !== option.value)
                        field.onChange(newValue)
                      }}
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </FormItem>
          )}
        />

        <Button type="submit">保存</Button>
      </form>
    </Form>
  )
}`
    }
  ],
  keyFunctions: [
    "sendWebhook()",
    "generateSignature()",
    "triggerWebhooks()",
    "logWebhookCall()",
    "crypto.createHmac()",
    "prisma.webhook.findMany()"
  ]
}

// 导出效率工具功能数据映射
export const productivityFeatureDetails: Record<string, FeatureDetailData> = {
  "template-system": templateSystemFeature,
  "ai-assistant": aiAssistantFeature,
  "webhook-integration": webhookIntegrationFeature,
}
