import { Users, Share2, Shield } from "lucide-react"
import type { FeatureDetailData } from "./feature-detail-dialog"

/**
 * 协作功能详细数据配置
 * 用于在功能展示页面点击时显示实现细节
 */

// 1. 实时协作功能详情
export const realtimeCollaborationFeature: FeatureDetailData = {
  title: "实时协作",
  description: "多人同时编辑笔记，实时同步光标和内容",
  icon: Users,
  color: "text-green-500",
  bgColor: "bg-green-500/10",
  technologies: [
    {
      name: "Y.js",
      description: "基于 CRDT 的实时协作框架，支持离线编辑和自动冲突解决",
      type: "library"
    },
    {
      name: "Hocuspocus",
      description: "Y.js 的 WebSocket 服务器，处理文档同步和持久化",
      type: "library"
    },
    {
      name: "@tiptap/extension-collaboration",
      description: "TipTap 协作扩展，将 Y.js 集成到编辑器",
      type: "library"
    },
    {
      name: "@tiptap/extension-collaboration-cursor",
      description: "协作光标扩展，显示其他用户的光标位置和选区",
      type: "library"
    },
    {
      name: "Awareness Protocol",
      description: "Y.js 的在线状态协议，追踪用户存在和光标位置",
      type: "pattern"
    },
    {
      name: "useCollaboration Hook",
      description: "自定义 React Hook，管理协作连接和状态",
      type: "hook"
    }
  ],
  coreFiles: [
    {
      path: "src/lib/collaboration/yjs-provider.ts",
      description: "Y.js Provider 封装，管理 WebSocket 连接和文档同步"
    },
    {
      path: "src/lib/collaboration/presence-manager.ts",
      description: "在线状态管理器，追踪用户存在和光标位置"
    },
    {
      path: "src/lib/collaboration/hocuspocus-server.ts",
      description: "Hocuspocus 服务器配置，处理认证和持久化"
    },
    {
      path: "src/hooks/use-collaboration.ts",
      description: "协作 Hook，提供 Y.Doc、Awareness 和连接状态"
    },
    {
      path: "src/components/editor/collaborative-tiptap-editor.tsx",
      description: "协作编辑器组件，集成 Y.js 和光标显示"
    },
    {
      path: "src/components/collaboration/presence-avatars.tsx",
      description: "在线用户头像组件，显示协作者列表"
    },
    {
      path: "server/collab-server.ts",
      description: "独立的协作服务器入口文件"
    }
  ],
  workflow: [
    "用户打开笔记时，useCollaboration Hook 初始化 YjsProvider",
    "YjsProvider 创建 Y.Doc 文档和 Awareness 实例",
    "通过 HocuspocusProvider 建立 WebSocket 连接到协作服务器",
    "服务器验证 JWT Token 和笔记访问权限",
    "从数据库加载文档状态，同步到客户端 Y.Doc",
    "TipTap 的 Collaboration 扩展将编辑器绑定到 Y.Doc",
    "用户编辑时，Y.js 自动生成增量更新并广播",
    "其他客户端接收更新，CRDT 算法自动合并变更",
    "CollaborationCursor 扩展显示其他用户的光标位置",
    "Awareness 协议实时同步用户在线状态和光标信息",
    "服务器定期将 Y.Doc 状态持久化到数据库"
  ],
  codeSnippets: [
    {
      title: "useCollaboration Hook",
      language: "typescript",
      description: "管理协作连接和状态的 React Hook",
      code: `export function useCollaboration(config: UseCollaborationConfig) {
  const { noteId, userId, userName, userColor, enabled = true } = config
  
  const [provider, setProvider] = useState<YjsProvider | null>(null)
  const [status, setStatus] = useState<ConnectionStatus>('disconnected')
  const [onlineUsers, setOnlineUsers] = useState<any[]>([])

  useEffect(() => {
    if (!enabled || !noteId) return

    const newProvider = new YjsProvider({
      noteId,
      userId,
      userName,
      userColor,
      token: await getAuthToken(),
      websocketUrl: process.env.NEXT_PUBLIC_COLLAB_SERVER_URL,
    })

    // 监听状态变化
    newProvider.onStatusChange(setStatus)
    newProvider.onAwarenessChange(() => {
      setOnlineUsers(newProvider.getOnlineUsers())
    })

    return () => newProvider.destroy()
  }, [noteId, userId, enabled])

  return { ydoc: provider?.getYDoc(), awareness: provider?.getAwareness(), status, onlineUsers }
}`
    },
    {
      title: "协作编辑器配置",
      language: "typescript",
      description: "TipTap 编辑器集成 Y.js 协作",
      code: `const extensions = [
  StarterKit.configure({
    history: false, // 禁用本地历史，使用 Y.js 历史
  }),
  Collaboration.configure({
    document: ydoc, // Y.js 文档实例
  }),
  CollaborationCursor.configure({
    provider: provider,
    user: {
      name: userName,
      color: userColor,
    },
  }),
]

const editor = useEditor({
  extensions,
  editorProps: {
    attributes: {
      class: 'prose focus:outline-none min-h-[500px]',
    },
  },
  onSelectionUpdate: ({ editor }) => {
    // 更新光标位置到 Awareness
    const { from, to } = editor.state.selection
    updateCursor({ anchor: from, head: to })
  },
})`
    },
    {
      title: "Hocuspocus 服务器认证",
      language: "typescript",
      description: "WebSocket 连接认证和权限检查",
      code: `const server = new Server({
  port: 1234,
  
  async onAuthenticate({ token, documentName }) {
    // 验证 JWT Token
    const payload = await verifyToken(token)
    const noteId = documentName
    
    // 检查用户是否有权限访问此笔记
    const hasAccess = await checkNoteAccess(payload.userId, noteId)
    if (!hasAccess) {
      throw new Error('Access denied')
    }

    return {
      user: {
        id: payload.userId,
        name: payload.name,
      },
    }
  },

  extensions: [
    new Database({
      fetch: async ({ documentName }) => {
        // 从数据库加载文档状态
        const note = await prisma.note.findUnique({
          where: { id: documentName },
        })
        return note?.content ? Buffer.from(note.content, 'base64') : null
      },
      store: async ({ documentName, state }) => {
        // 保存文档状态到数据库
        await prisma.note.update({
          where: { id: documentName },
          data: { content: Buffer.from(state).toString('base64') },
        })
      },
    }),
  ],
})`
    }
  ],
  keyFunctions: [
    "useCollaboration()",
    "YjsProvider",
    "HocuspocusProvider",
    "Y.Doc",
    "Awareness",
    "Collaboration.configure()",
    "CollaborationCursor.configure()",
    "onAwarenessChange()",
    "updateCursor()"
  ]
}


// 2. 公开分享功能详情
export const publicSharingFeature: FeatureDetailData = {
  title: "公开分享",
  description: "生成公开链接，与任何人分享你的笔记",
  icon: Share2,
  color: "text-blue-500",
  bgColor: "bg-blue-500/10",
  technologies: [
    {
      name: "公开链接生成",
      description: "为笔记生成唯一的公开访问 slug，无需登录即可查看",
      type: "pattern"
    },
    {
      name: "nanoid",
      description: "生成短小、URL 安全的唯一标识符作为分享链接",
      type: "library"
    },
    {
      name: "Next.js 动态路由",
      description: "使用 [slug] 动态路由处理公开笔记访问",
      type: "pattern"
    },
    {
      name: "Prisma isPublic 字段",
      description: "笔记模型的公开状态字段，控制是否可公开访问",
      type: "pattern"
    },
    {
      name: "分享对话框组件",
      description: "提供分享链接复制、二维码生成等功能",
      type: "component"
    },
    {
      name: "SEO 优化",
      description: "公开笔记页面包含 Open Graph 元数据，支持社交分享预览",
      type: "pattern"
    }
  ],
  coreFiles: [
    {
      path: "src/components/collaboration/share-dialog.tsx",
      description: "分享对话框组件，管理公开状态和链接"
    },
    {
      path: "src/components/collaboration/public-share-controls.tsx",
      description: "公开分享控制组件，切换公开状态"
    },
    {
      path: "src/app/public/[slug]/page.tsx",
      description: "公开笔记页面，无需登录即可访问"
    },
    {
      path: "src/app/api/notes/[id]/share/route.ts",
      description: "分享 API，生成和管理公开链接"
    },
    {
      path: "src/lib/sharing/generate-slug.ts",
      description: "生成唯一分享 slug 的工具函数"
    }
  ],
  workflow: [
    "用户在笔记页面点击分享按钮，打开分享对话框",
    "对话框显示当前分享状态（私有/公开）",
    "用户切换公开开关，调用 POST /api/notes/[id]/share",
    "API 生成唯一的 publicSlug（如果尚未生成）",
    "更新笔记的 isPublic 和 publicSlug 字段",
    "返回公开链接 URL 给前端显示",
    "用户可以复制链接或生成二维码分享",
    "访问者通过 /public/[slug] 路由访问笔记",
    "页面检查 isPublic 状态，渲染只读笔记内容",
    "用户可以随时关闭公开分享，链接立即失效"
  ],
  codeSnippets: [
    {
      title: "分享对话框组件",
      language: "typescript",
      description: "管理笔记公开分享状态",
      code: `export function ShareDialog({ noteId, isPublic, publicSlug }: ShareDialogProps) {
  const [isSharing, setIsSharing] = useState(isPublic)
  const [shareUrl, setShareUrl] = useState('')

  const toggleSharing = async () => {
    const response = await fetch(\`/api/notes/\${noteId}/share\`, {
      method: 'POST',
      body: JSON.stringify({ isPublic: !isSharing }),
    })
    
    const result = await response.json()
    if (result.success) {
      setIsSharing(result.data.isPublic)
      setShareUrl(result.data.shareUrl)
      toast.success(result.data.isPublic ? '已开启公开分享' : '已关闭公开分享')
    }
  }

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl)
    toast.success('链接已复制到剪贴板')
  }

  return (
    <Dialog>
      <DialogContent>
        <div className="flex items-center justify-between">
          <Label>公开分享</Label>
          <Switch checked={isSharing} onCheckedChange={toggleSharing} />
        </div>
        {isSharing && (
          <div className="flex gap-2">
            <Input value={shareUrl} readOnly />
            <Button onClick={copyLink}>复制链接</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}`
    },
    {
      title: "分享 API",
      language: "typescript",
      description: "处理公开分享请求",
      code: `export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  const { isPublic } = await request.json()
  const noteId = params.id

  // 验证笔记所有权
  const note = await prisma.note.findFirst({
    where: { id: noteId, userId: session.user.id },
  })
  if (!note) {
    return NextResponse.json({ error: '笔记不存在' }, { status: 404 })
  }

  // 生成或保留 publicSlug
  const publicSlug = note.publicSlug || (isPublic ? nanoid(10) : null)

  const updatedNote = await prisma.note.update({
    where: { id: noteId },
    data: { isPublic, publicSlug },
  })

  const shareUrl = isPublic 
    ? \`\${process.env.NEXT_PUBLIC_APP_URL}/public/\${publicSlug}\`
    : null

  return NextResponse.json({
    success: true,
    data: { isPublic, shareUrl },
  })
}`
    },
    {
      title: "公开笔记页面",
      language: "typescript",
      description: "无需登录访问的公开笔记页面",
      code: `export default async function PublicNotePage({ params }: { params: { slug: string } }) {
  const note = await prisma.note.findFirst({
    where: {
      publicSlug: params.slug,
      isPublic: true,
    },
    include: {
      user: { select: { name: true, image: true } },
      tags: true,
    },
  })

  if (!note) {
    notFound()
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <article>
        <header className="mb-8">
          <h1 className="text-3xl font-bold">{note.title}</h1>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Avatar src={note.user.image} />
            <span>{note.user.name}</span>
            <span>·</span>
            <time>{formatDate(note.updatedAt)}</time>
          </div>
        </header>
        <div 
          className="prose dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: note.content }}
        />
      </article>
    </div>
  )
}`
    }
  ],
  keyFunctions: [
    "nanoid()",
    "prisma.note.update()",
    "navigator.clipboard.writeText()",
    "toast.success()",
    "notFound()",
    "formatDate()"
  ]
}

// 3. 权限管理功能详情
export const permissionManagementFeature: FeatureDetailData = {
  title: "权限管理",
  description: "设置笔记访问权限，控制谁可以查看和编辑",
  icon: Shield,
  color: "text-red-500",
  bgColor: "bg-red-500/10",
  technologies: [
    {
      name: "Collaborator 模型",
      description: "Prisma 模型存储笔记协作者关系和权限级别",
      type: "pattern"
    },
    {
      name: "权限级别枚举",
      description: "定义 viewer（只读）、editor（编辑）、admin（管理）权限",
      type: "pattern"
    },
    {
      name: "useNotePermission Hook",
      description: "检查当前用户对笔记的权限级别",
      type: "hook"
    },
    {
      name: "PermissionGuard 组件",
      description: "根据权限条件渲染或隐藏 UI 元素",
      type: "component"
    },
    {
      name: "邮箱邀请",
      description: "通过邮箱邀请用户成为协作者",
      type: "pattern"
    },
    {
      name: "权限继承",
      description: "笔记所有者自动拥有最高权限",
      type: "pattern"
    }
  ],
  coreFiles: [
    {
      path: "src/components/collaboration/permission-guard.tsx",
      description: "权限守卫组件，条件渲染受保护内容"
    },
    {
      path: "src/components/collaboration/permission-aware-editor.tsx",
      description: "权限感知编辑器，根据权限切换只读/编辑模式"
    },
    {
      path: "src/hooks/use-note-permission.ts",
      description: "权限检查 Hook，获取当前用户权限"
    },
    {
      path: "src/app/api/collaborators/route.ts",
      description: "协作者 API，添加和管理协作者"
    },
    {
      path: "src/app/api/collaborators/[id]/route.ts",
      description: "单个协作者操作 API，更新权限和移除"
    },
    {
      path: "src/lib/permissions/check-access.ts",
      description: "权限检查工具函数"
    }
  ],
  workflow: [
    "笔记所有者打开权限管理对话框",
    "输入协作者邮箱并选择权限级别",
    "调用 POST /api/collaborators 添加协作者",
    "API 查找用户并创建 Collaborator 记录",
    "可选：发送邮件通知被邀请的用户",
    "协作者登录后可在笔记列表看到共享笔记",
    "打开笔记时，useNotePermission 检查权限",
    "PermissionGuard 根据权限显示/隐藏功能",
    "viewer 权限：只能查看，编辑器为只读模式",
    "editor 权限：可以编辑内容，但不能管理权限",
    "admin 权限：可以编辑内容和管理其他协作者",
    "所有者可以随时修改或移除协作者权限"
  ],
  codeSnippets: [
    {
      title: "useNotePermission Hook",
      language: "typescript",
      description: "检查当前用户对笔记的权限",
      code: `export function useNotePermission(noteId: string) {
  const { data: session } = useSession()
  const [permission, setPermission] = useState<Permission | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function checkPermission() {
      const response = await fetch(\`/api/notes/\${noteId}/permission\`)
      const result = await response.json()
      
      setPermission(result.data)
      setIsLoading(false)
    }
    
    if (noteId && session?.user) {
      checkPermission()
    }
  }, [noteId, session])

  return {
    permission,
    isLoading,
    isOwner: permission?.role === 'owner',
    canEdit: ['owner', 'admin', 'editor'].includes(permission?.role || ''),
    canManage: ['owner', 'admin'].includes(permission?.role || ''),
    canView: permission !== null,
  }
}`
    },
    {
      title: "PermissionGuard 组件",
      language: "typescript",
      description: "根据权限条件渲染内容",
      code: `interface PermissionGuardProps {
  noteId: string
  requiredPermission: 'view' | 'edit' | 'manage'
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function PermissionGuard({
  noteId,
  requiredPermission,
  children,
  fallback = null,
}: PermissionGuardProps) {
  const { canView, canEdit, canManage, isLoading } = useNotePermission(noteId)

  if (isLoading) {
    return <Skeleton className="h-8 w-full" />
  }

  const hasPermission = {
    view: canView,
    edit: canEdit,
    manage: canManage,
  }[requiredPermission]

  if (!hasPermission) {
    return fallback
  }

  return <>{children}</>
}

// 使用示例
<PermissionGuard noteId={noteId} requiredPermission="edit">
  <Button onClick={handleEdit}>编辑笔记</Button>
</PermissionGuard>

<PermissionGuard noteId={noteId} requiredPermission="manage">
  <Button onClick={openPermissionDialog}>管理权限</Button>
</PermissionGuard>`
    },
    {
      title: "添加协作者 API",
      language: "typescript",
      description: "添加新的笔记协作者",
      code: `export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  const { noteId, email, permission } = await request.json()

  // 验证当前用户是否有管理权限
  const note = await prisma.note.findFirst({
    where: {
      id: noteId,
      OR: [
        { userId: session.user.id },
        { collaborators: { some: { userId: session.user.id, permission: 'admin' } } },
      ],
    },
  })

  if (!note) {
    return NextResponse.json({ error: '无权限管理此笔记' }, { status: 403 })
  }

  // 查找被邀请的用户
  const invitedUser = await prisma.user.findUnique({
    where: { email },
  })

  if (!invitedUser) {
    return NextResponse.json({ error: '用户不存在' }, { status: 404 })
  }

  // 创建协作者记录
  const collaborator = await prisma.collaborator.upsert({
    where: {
      noteId_userId: { noteId, userId: invitedUser.id },
    },
    update: { permission },
    create: {
      noteId,
      userId: invitedUser.id,
      permission,
    },
  })

  return NextResponse.json({ success: true, data: collaborator })
}`
    }
  ],
  keyFunctions: [
    "useNotePermission()",
    "PermissionGuard",
    "prisma.collaborator.upsert()",
    "prisma.collaborator.delete()",
    "checkNoteAccess()",
    "canEdit",
    "canManage",
    "isOwner"
  ]
}

// 导出协作功能数据映射
export const collaborationFeatureDetails: Record<string, FeatureDetailData> = {
  "realtime-collaboration": realtimeCollaborationFeature,
  "public-sharing": publicSharingFeature,
  "permission-management": permissionManagementFeature,
}
