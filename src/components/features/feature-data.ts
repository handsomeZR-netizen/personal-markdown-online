import { Edit3, FolderTree, Search, Tag } from "lucide-react"
import type { FeatureDetailData } from "./feature-detail-dialog"

/**
 * 核心功能详细数据配置
 * 用于在功能展示页面点击时显示实现细节
 */

// 1. Markdown 编辑器功能详情
export const markdownEditorFeature: FeatureDetailData = {
  title: "Markdown 编辑器",
  description: "强大的 Markdown 编辑器，支持实时预览、图片上传和语法高亮",
  icon: Edit3,
  color: "text-blue-500",
  bgColor: "bg-blue-500/10",
  technologies: [
    {
      name: "TipTap",
      description: "基于 ProseMirror 的现代化富文本编辑器框架，提供模块化扩展系统",
      type: "library"
    },
    {
      name: "@tiptap/starter-kit",
      description: "TipTap 基础扩展包，包含段落、标题、列表、代码块等基础功能",
      type: "library"
    },
    {
      name: "@tiptap/extension-image",
      description: "图片扩展，支持图片插入、拖拽和粘贴上传",
      type: "library"
    },
    {
      name: "@tiptap/extension-placeholder",
      description: "占位符扩展，在编辑器为空时显示提示文字",
      type: "library"
    },
    {
      name: "useEditor Hook",
      description: "TipTap 提供的 React Hook，管理编辑器实例和状态",
      type: "hook"
    },
    {
      name: "handlePaste / handleDrop",
      description: "ProseMirror 事件处理器，拦截粘贴和拖放事件实现图片上传",
      type: "pattern"
    }
  ],
  coreFiles: [
    {
      path: "src/components/editor/tiptap-editor.tsx",
      description: "TipTap 编辑器主组件，包含图片上传、魔法边框效果"
    },
    {
      path: "src/components/notes/note-editor.tsx",
      description: "笔记编辑器包装组件，集成标题、标签、分类等"
    },
    {
      path: "src/components/notes/editor-toolbar.tsx",
      description: "编辑器工具栏，提供格式化按钮和快捷操作"
    },
    {
      path: "src/app/api/images/upload/route.ts",
      description: "图片上传 API，处理单张和批量图片上传"
    },
    {
      path: "src/lib/storage/image-upload.ts",
      description: "图片上传工具函数，支持本地存储和 Supabase 存储"
    }
  ],
  workflow: [
    "用户在编辑器中输入内容，TipTap 通过 ProseMirror 实时解析 Markdown 语法",
    "useEditor Hook 监听内容变化，触发 onUpdate 回调进行自动保存",
    "粘贴或拖拽图片时，handlePaste/handleDrop 拦截事件，调用 handleImageUpload",
    "图片通过 FormData 发送到 /api/images/upload API 端点",
    "API 根据 DATABASE_MODE 选择本地文件系统或 Supabase Storage 存储",
    "上传成功后返回图片 URL，编辑器通过 setImage 命令插入图片节点",
    "编辑器内容通过 getHTML() 获取 HTML 格式，保存到数据库"
  ],
  codeSnippets: [
    {
      title: "TipTap 编辑器初始化",
      language: "typescript",
      description: "使用 useEditor Hook 创建编辑器实例",
      code: `const editor = useEditor({
  extensions: [
    StarterKit,
    Image.configure({
      inline: true,
      allowBase64: false,
      HTMLAttributes: {
        class: 'rounded-lg max-w-full h-auto',
      },
    }),
    Placeholder.configure({
      placeholder: '开始输入...',
    }),
  ],
  content: initialContent,
  editable: !readOnly,
  onUpdate: ({ editor }) => {
    onSave?.(editor.getHTML())
  },
})`
    },
    {
      title: "图片粘贴处理",
      language: "typescript",
      description: "拦截粘贴事件，自动上传图片",
      code: `handlePaste: (view, event) => {
  const items = Array.from(event.clipboardData?.items || [])
  const imageItems = items.filter(item => 
    item.type.startsWith('image/')
  )

  if (imageItems.length > 0) {
    event.preventDefault()
    imageItems.forEach(item => {
      const file = item.getAsFile()
      if (file) {
        handleImageUpload(file).then(url => {
          editor?.chain().focus().setImage({ src: url }).run()
        })
      }
    })
    return true
  }
  return false
}`
    }
  ],
  keyFunctions: [
    "useEditor()",
    "editor.chain().focus().setImage()",
    "handleImageUpload()",
    "editor.getHTML()",
    "EditorContent"
  ]
}


// 2. 文件夹管理功能详情
export const folderManagementFeature: FeatureDetailData = {
  title: "文件夹管理",
  description: "创建、嵌套、拖放文件夹，树形结构组织笔记",
  icon: FolderTree,
  color: "text-green-500",
  bgColor: "bg-green-500/10",
  technologies: [
    {
      name: "递归组件模式",
      description: "FolderTree 和 FolderItem 组件递归渲染，支持无限层级嵌套",
      type: "pattern"
    },
    {
      name: "HTML5 Drag and Drop API",
      description: "原生拖放 API 实现文件夹和笔记的拖拽移动",
      type: "pattern"
    },
    {
      name: "Prisma 自关联",
      description: "Folder 模型通过 parentId 实现自关联，支持树形结构",
      type: "library"
    },
    {
      name: "useState + useCallback",
      description: "管理展开/折叠状态和拖放交互的 React Hooks",
      type: "hook"
    },
    {
      name: "Zod Schema",
      description: "使用 Zod 进行文件夹创建和更新的数据验证",
      type: "library"
    },
    {
      name: "响应式设计",
      description: "移动端自动检测，禁用拖拽改用触摸手势",
      type: "pattern"
    }
  ],
  coreFiles: [
    {
      path: "src/components/folders/folder-tree.tsx",
      description: "文件夹树主组件，管理展开状态和递归渲染"
    },
    {
      path: "src/components/folders/folder-item.tsx",
      description: "单个文件夹项组件，处理拖放、点击和展开逻辑"
    },
    {
      path: "src/components/notes/folder-sidebar.tsx",
      description: "笔记列表页的文件夹侧边栏"
    },
    {
      path: "src/app/api/folders/route.ts",
      description: "文件夹 CRUD API，获取列表和创建文件夹"
    },
    {
      path: "src/app/api/folders/[id]/route.ts",
      description: "单个文件夹操作 API，更新、删除和移动"
    },
    {
      path: "src/lib/validations/folders.ts",
      description: "文件夹数据验证 Schema"
    }
  ],
  workflow: [
    "页面加载时调用 GET /api/folders 获取用户所有文件夹",
    "API 使用 Prisma 查询文件夹，include parent 和 _count 统计子项数量",
    "前端将扁平数据转换为树形结构，传递给 FolderTree 组件",
    "FolderTree 递归调用 FolderItem 渲染每个节点",
    "用户拖拽文件夹时，handleDragStart 设置拖拽数据",
    "目标文件夹的 handleDragOver 计算放置位置（前/后/内部）",
    "handleDrop 调用 onMove 或 onReorder 回调，发送 PATCH 请求更新 parentId",
    "API 验证权限后更新数据库，前端刷新文件夹列表"
  ],
  codeSnippets: [
    {
      title: "文件夹树递归渲染",
      language: "typescript",
      description: "递归渲染文件夹节点",
      code: `const renderNode = useCallback(
  (node: FolderNode, level: number): React.ReactNode => {
    return (
      <FolderItem
        key={node.id}
        node={node}
        level={level}
        isExpanded={isExpanded(node.id)}
        isSelected={node.id === selectedNodeId}
        onToggle={() => toggleExpanded(node.id)}
        onClick={() => onNodeClick?.(node)}
        onMove={onNodeMove}
        renderChildren={(children) =>
          children.map((child) => renderNode(child, level + 1))
        }
      />
    )
  },
  [isExpanded, selectedNodeId, toggleExpanded, onNodeClick, onNodeMove]
)`
    },
    {
      title: "拖放位置计算",
      language: "typescript",
      description: "根据鼠标位置计算放置位置",
      code: `const handleDragOver = (e: React.DragEvent) => {
  e.preventDefault()
  e.dataTransfer.dropEffect = 'move'
  
  const rect = e.currentTarget.getBoundingClientRect()
  const y = e.clientY - rect.top
  const height = rect.height
  
  if (y < height * 0.33) {
    setDropPosition('before')
  } else if (y > height * 0.67 && isFolder) {
    setDropPosition('inside')
  } else {
    setDropPosition(isFolder ? 'inside' : 'after')
  }
  
  setIsDragOver(true)
}`
    },
    {
      title: "Prisma 文件夹查询",
      language: "typescript",
      description: "获取用户文件夹列表",
      code: `const folders = await prisma.folder.findMany({
  where: {
    userId: session.user.id,
  },
  include: {
    parent: true,
    _count: {
      select: {
        children: true,
        notes: true,
      },
    },
  },
  orderBy: { name: 'asc' },
})`
    }
  ],
  keyFunctions: [
    "renderNode()",
    "toggleExpanded()",
    "handleDragStart()",
    "handleDragOver()",
    "handleDrop()",
    "prisma.folder.findMany()",
    "prisma.folder.update()"
  ]
}


// 3. 全文搜索功能详情
export const fullTextSearchFeature: FeatureDetailData = {
  title: "全文搜索",
  description: "统一搜索文件夹和笔记内容，支持全文检索",
  icon: Search,
  color: "text-cyan-500",
  bgColor: "bg-cyan-500/10",
  technologies: [
    {
      name: "useDebounce Hook",
      description: "自定义防抖 Hook，避免频繁请求，优化搜索性能",
      type: "hook"
    },
    {
      name: "URL Search Params",
      description: "使用 Next.js useSearchParams 将搜索状态同步到 URL",
      type: "pattern"
    },
    {
      name: "Prisma contains 查询",
      description: "使用 Prisma 的 contains 和 mode: insensitive 实现模糊搜索",
      type: "library"
    },
    {
      name: "统一搜索结果",
      description: "同时搜索文件夹和笔记，合并结果并分页展示",
      type: "pattern"
    },
    {
      name: "高亮匹配文本",
      description: "使用正则表达式分割文本，高亮显示匹配关键词",
      type: "pattern"
    },
    {
      name: "useRouter",
      description: "Next.js 路由 Hook，实现搜索结果点击跳转",
      type: "hook"
    }
  ],
  coreFiles: [
    {
      path: "src/components/search-bar.tsx",
      description: "搜索栏组件，支持展开/收缩模式和防抖输入"
    },
    {
      path: "src/components/search/unified-search-results.tsx",
      description: "统一搜索结果组件，展示文件夹和笔记"
    },
    {
      path: "src/app/api/search/route.ts",
      description: "搜索 API，同时查询文件夹和笔记"
    },
    {
      path: "src/hooks/use-debounce.ts",
      description: "防抖 Hook，延迟触发搜索请求"
    },
    {
      path: "src/app/search/page.tsx",
      description: "搜索结果页面"
    }
  ],
  workflow: [
    "用户在搜索栏输入关键词，onChange 更新 searchValue 状态",
    "useDebounce Hook 延迟 300ms 后更新 debouncedSearchValue",
    "useEffect 监听防抖值变化，更新 URL 参数 ?query=xxx",
    "UnifiedSearchResults 组件监听 URL 参数变化",
    "调用 GET /api/search?query=xxx 发起搜索请求",
    "API 并行查询文件夹（name 匹配）和笔记（title/content 匹配）",
    "合并结果，计算分页，返回 folders 和 notes 数组",
    "前端渲染搜索结果，使用 highlightText 高亮匹配文本",
    "用户点击结果项，router.push 跳转到对应页面"
  ],
  codeSnippets: [
    {
      title: "防抖搜索实现",
      language: "typescript",
      description: "使用 useDebounce 优化搜索性能",
      code: `// 使用防抖（300ms）
const debouncedSearchValue = useDebounce(searchValue, 300)

// 当防抖值变化时更新URL
useEffect(() => {
  const params = new URLSearchParams(searchParams.toString())
  
  if (debouncedSearchValue) {
    params.set('query', debouncedSearchValue)
    params.set('page', '1') // 搜索时重置到第一页
  } else {
    params.delete('query')
  }
  
  router.push(\`\${pathname}?\${params.toString()}\`)
}, [debouncedSearchValue, pathname, router, searchParams])`
    },
    {
      title: "统一搜索 API",
      language: "typescript",
      description: "同时搜索文件夹和笔记",
      code: `// 搜索文件夹
const folders = await prisma.folder.findMany({
  where: {
    userId: session.user.id,
    name: {
      contains: searchTerm,
      mode: 'insensitive',
    },
  },
  include: {
    parent: true,
    _count: { select: { children: true, notes: true } },
  },
})

// 搜索笔记
const notes = await prisma.note.findMany({
  where: {
    AND: [
      { OR: [
        { userId: session.user.id },
        { Collaborator: { some: { userId: session.user.id } } },
      ]},
      { OR: [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { content: { contains: searchTerm, mode: 'insensitive' } },
      ]},
    ],
  },
  include: { folder: true, tags: true },
})`
    },
    {
      title: "高亮匹配文本",
      language: "typescript",
      description: "使用正则分割并高亮关键词",
      code: `const highlightText = (text: string, query: string) => {
  if (!query.trim()) return text

  const parts = text.split(new RegExp(\`(\${query})\`, 'gi'))
  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={index} className="bg-yellow-200 dark:bg-yellow-800">
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </>
  )
}`
    }
  ],
  keyFunctions: [
    "useDebounce()",
    "useSearchParams()",
    "router.push()",
    "prisma.folder.findMany()",
    "prisma.note.findMany()",
    "highlightText()",
    "encodeURIComponent()"
  ]
}


// 4. 标签系统功能详情
export const tagSystemFeature: FeatureDetailData = {
  title: "标签系统",
  description: "为笔记添加标签，快速分类和查找",
  icon: Tag,
  color: "text-purple-500",
  bgColor: "bg-purple-500/10",
  technologies: [
    {
      name: "多对多关系",
      description: "Prisma 隐式多对多关系，Note 和 Tag 通过中间表关联",
      type: "pattern"
    },
    {
      name: "受控组件模式",
      description: "TagSelector 通过 selectedTagIds 和 onChange 实现受控",
      type: "pattern"
    },
    {
      name: "乐观更新",
      description: "创建标签后立即更新本地状态，无需等待刷新",
      type: "pattern"
    },
    {
      name: "Sonner Toast",
      description: "使用 Sonner 库显示操作成功/失败的提示消息",
      type: "library"
    },
    {
      name: "AI 标签建议",
      description: "集成 AI 分析笔记内容，自动推荐相关标签",
      type: "component"
    },
    {
      name: "Prisma upsert",
      description: "创建标签时使用 findUnique 检查重复，避免重复创建",
      type: "pattern"
    }
  ],
  coreFiles: [
    {
      path: "src/components/notes/tag-selector.tsx",
      description: "标签选择器组件，支持选择、创建和删除标签"
    },
    {
      path: "src/components/notes/ai-tag-suggestions.tsx",
      description: "AI 标签建议组件，分析内容推荐标签"
    },
    {
      path: "src/app/api/tags/route.ts",
      description: "标签 CRUD API，获取列表和创建标签"
    },
    {
      path: "src/app/api/notes/[id]/route.ts",
      description: "笔记更新 API，处理标签关联更新"
    },
    {
      path: "prisma/schema.prisma",
      description: "数据库 Schema，定义 Tag 模型和关系"
    }
  ],
  workflow: [
    "TagSelector 组件挂载时调用 GET /api/tags 获取所有标签",
    "用户点击标签切换选中状态，调用 onChange 更新 selectedTagIds",
    "用户点击创建标签按钮，显示输入框",
    "输入标签名后调用 POST /api/tags 创建新标签",
    "API 先检查标签是否存在，存在则返回现有标签，否则创建新标签",
    "创建成功后更新本地 tags 状态，并自动选中新标签",
    "保存笔记时，将 selectedTagIds 发送到 PATCH /api/notes/[id]",
    "API 使用 Prisma connect/disconnect 更新笔记与标签的关联"
  ],
  codeSnippets: [
    {
      title: "标签选择器组件",
      language: "typescript",
      description: "受控组件模式管理标签选择",
      code: `interface TagSelectorProps {
  selectedTagIds: string[]
  onChange: (tagIds: string[]) => void
  refreshKey?: number
}

export function TagSelector({ selectedTagIds, onChange }: TagSelectorProps) {
  const [tags, setTags] = useState<Tag[]>([])

  useEffect(() => {
    async function loadTags() {
      const response = await fetch('/api/tags')
      const result = await response.json()
      if (result.success) {
        setTags(result.data)
      }
    }
    loadTags()
  }, [])

  const handleRemoveTag = (tagId: string) => {
    onChange(selectedTagIds.filter(id => id !== tagId))
  }
  // ...
}`
    },
    {
      title: "创建标签 API",
      language: "typescript",
      description: "检查重复并创建标签",
      code: `export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: '未授权访问' },
      { status: 401 }
    )
  }

  const { name } = await request.json()
  const trimmedName = name.trim()

  // 检查标签是否已存在
  const existingTag = await prisma.tag.findUnique({
    where: { name: trimmedName },
  })

  if (existingTag) {
    return NextResponse.json({ success: true, data: existingTag })
  }

  const tag = await prisma.tag.create({
    data: { name: trimmedName },
  })

  return NextResponse.json({ success: true, data: tag }, { status: 201 })
}`
    },
    {
      title: "更新笔记标签关联",
      language: "typescript",
      description: "使用 Prisma set 操作更新多对多关系",
      code: `// 在 PATCH /api/notes/[id] 中
const updatedNote = await prisma.note.update({
  where: { id: noteId },
  data: {
    title,
    content,
    // 使用 set 替换所有标签关联
    tags: {
      set: tagIds.map(id => ({ id }))
    },
    // 或者使用 connect/disconnect 精确控制
    // tags: {
    //   disconnect: oldTagIds.map(id => ({ id })),
    //   connect: newTagIds.map(id => ({ id })),
    // }
  },
  include: {
    tags: true,
    folder: true,
  },
})`
    }
  ],
  keyFunctions: [
    "fetch('/api/tags')",
    "prisma.tag.findUnique()",
    "prisma.tag.create()",
    "prisma.note.update()",
    "tags.set()",
    "toast.success()",
    "onChange()"
  ]
}

// 导出所有功能数据的映射
export const coreFeatureDetails: Record<string, FeatureDetailData> = {
  "markdown-editor": markdownEditorFeature,
  "folder-management": folderManagementFeature,
  "full-text-search": fullTextSearchFeature,
  "tag-system": tagSystemFeature,
}

// ============================================
// 内容增强功能详情
// ============================================

import { Calculator, Image, Palette, Eye } from "lucide-react"

// 1. 数学公式功能详情
export const mathFormulaFeature: FeatureDetailData = {
  title: "数学公式",
  description: "完整的 LaTeX 数学公式渲染，支持行内和块级公式",
  icon: Calculator,
  color: "text-blue-600",
  bgColor: "bg-blue-600/10",
  technologies: [
    {
      name: "KaTeX",
      description: "快速的数学公式渲染库，比 MathJax 更轻量，渲染速度更快",
      type: "library"
    },
    {
      name: "@tiptap/extension-mathematics",
      description: "TipTap 数学公式扩展，集成 KaTeX 到编辑器",
      type: "library"
    },
    {
      name: "行内公式语法",
      description: "使用 $公式$ 语法插入行内公式，如 $E=mc^2$",
      type: "pattern"
    },
    {
      name: "块级公式语法",
      description: "使用 $$公式$$ 语法插入独立块级公式",
      type: "pattern"
    },
    {
      name: "实时预览",
      description: "输入公式时实时渲染预览，所见即所得",
      type: "pattern"
    },
    {
      name: "错误处理",
      description: "LaTeX 语法错误时显示友好提示，不影响编辑",
      type: "pattern"
    }
  ],
  coreFiles: [
    {
      path: "src/components/editor/tiptap-editor.tsx",
      description: "TipTap 编辑器主组件，集成数学公式扩展"
    },
    {
      path: "src/components/editor/extensions/math-extension.ts",
      description: "自定义数学公式扩展配置"
    },
    {
      path: "src/app/help/math-formulas/page.tsx",
      description: "数学公式帮助页面，包含语法示例"
    }
  ],
  workflow: [
    "用户在编辑器中输入 $ 符号开始数学公式",
    "TipTap 的 Mathematics 扩展检测到公式语法",
    "扩展调用 KaTeX 进行实时渲染",
    "渲染结果以内联或块级形式显示在编辑器中",
    "用户可以点击公式进入编辑模式修改",
    "保存时公式以 LaTeX 源码形式存储到数据库",
    "阅读模式下 KaTeX 重新渲染公式显示"
  ],
  codeSnippets: [
    {
      title: "数学公式扩展配置",
      language: "typescript",
      description: "在 TipTap 编辑器中启用数学公式",
      code: `import Mathematics from '@tiptap/extension-mathematics'
import 'katex/dist/katex.min.css'

const editor = useEditor({
  extensions: [
    StarterKit,
    Mathematics.configure({
      // 使用 KaTeX 渲染
      katexOptions: {
        throwOnError: false,
        errorColor: '#cc0000',
        strict: false,
        trust: true,
      },
    }),
  ],
})`
    },
    {
      title: "常用数学公式示例",
      language: "latex",
      description: "LaTeX 数学公式语法示例",
      code: `// 行内公式
$E = mc^2$
$\\alpha + \\beta = \\gamma$

// 块级公式
$$
\\sum_{i=1}^{n} x_i = x_1 + x_2 + ... + x_n
$$

// 分数
$\\frac{a}{b}$

// 根号
$\\sqrt{x^2 + y^2}$

// 矩阵
$$
\\begin{pmatrix}
a & b \\\\
c & d
\\end{pmatrix}
$$

// 积分
$\\int_0^\\infty e^{-x^2} dx$`
    }
  ],
  keyFunctions: [
    "Mathematics.configure()",
    "katex.render()",
    "editor.commands.insertContent()",
    "parseLatex()",
    "renderToString()"
  ]
}

// 2. 图片上传功能详情
export const imageUploadFeature: FeatureDetailData = {
  title: "图片上传",
  description: "拖拽、粘贴上传图片，支持进度显示和批量上传",
  icon: Image,
  color: "text-purple-600",
  bgColor: "bg-purple-600/10",
  technologies: [
    {
      name: "HTML5 Drag and Drop API",
      description: "原生拖放 API 实现图片拖拽上传",
      type: "pattern"
    },
    {
      name: "Clipboard API",
      description: "剪贴板 API 实现粘贴图片上传",
      type: "pattern"
    },
    {
      name: "@tiptap/extension-image",
      description: "TipTap 图片扩展，支持图片节点插入和显示",
      type: "library"
    },
    {
      name: "FormData",
      description: "使用 FormData 封装图片数据进行上传",
      type: "pattern"
    },
    {
      name: "Supabase Storage",
      description: "云端图片存储，支持 CDN 加速访问",
      type: "library"
    },
    {
      name: "本地文件系统",
      description: "本地模式下图片存储到 uploads 目录",
      type: "pattern"
    }
  ],
  coreFiles: [
    {
      path: "src/components/editor/tiptap-editor.tsx",
      description: "编辑器组件，处理拖拽和粘贴事件"
    },
    {
      path: "src/app/api/images/upload/route.ts",
      description: "图片上传 API，处理单张和批量上传"
    },
    {
      path: "src/lib/storage/image-upload.ts",
      description: "图片上传工具函数，支持双模式存储"
    },
    {
      path: "src/lib/supabase-storage.ts",
      description: "Supabase Storage 客户端配置"
    }
  ],
  workflow: [
    "用户拖拽图片到编辑器或使用 Ctrl+V 粘贴",
    "handleDrop/handlePaste 事件处理器拦截操作",
    "从事件中提取图片文件（File 对象）",
    "显示上传进度指示器",
    "创建 FormData 并发送到 /api/images/upload",
    "API 根据 DATABASE_MODE 选择存储方式",
    "Supabase 模式：上传到 Storage bucket",
    "本地模式：保存到 uploads 目录",
    "返回图片 URL，编辑器插入图片节点",
    "图片以 URL 形式存储在笔记内容中"
  ],
  codeSnippets: [
    {
      title: "图片粘贴处理",
      language: "typescript",
      description: "拦截粘贴事件上传图片",
      code: `handlePaste: (view, event) => {
  const items = Array.from(event.clipboardData?.items || [])
  const imageItems = items.filter(item => 
    item.type.startsWith('image/')
  )

  if (imageItems.length > 0) {
    event.preventDefault()
    
    imageItems.forEach(async (item) => {
      const file = item.getAsFile()
      if (file) {
        // 显示上传中状态
        setIsUploading(true)
        
        try {
          const url = await handleImageUpload(file)
          editor?.chain().focus().setImage({ src: url }).run()
        } finally {
          setIsUploading(false)
        }
      }
    })
    return true
  }
  return false
}`
    },
    {
      title: "图片上传 API",
      language: "typescript",
      description: "处理图片上传请求",
      code: `export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File
  
  // 验证文件类型和大小
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: '只支持图片文件' }, { status: 400 })
  }
  
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: '文件大小不能超过 10MB' }, { status: 400 })
  }

  // 根据模式选择存储方式
  const url = DATABASE_MODE === 'supabase'
    ? await uploadToSupabase(file, session.user.id)
    : await uploadToLocal(file, session.user.id)

  return NextResponse.json({ url })
}`
    },
    {
      title: "Supabase Storage 上传",
      language: "typescript",
      description: "上传图片到 Supabase Storage",
      code: `async function uploadToSupabase(file: File, userId: string) {
  const supabase = createClient()
  
  // 生成唯一文件名
  const ext = file.name.split('.').pop()
  const fileName = \`\${userId}/\${Date.now()}-\${crypto.randomUUID()}.\${ext}\`
  
  const { data, error } = await supabase.storage
    .from('note-images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) throw error

  // 获取公开 URL
  const { data: { publicUrl } } = supabase.storage
    .from('note-images')
    .getPublicUrl(data.path)

  return publicUrl
}`
    }
  ],
  keyFunctions: [
    "handlePaste()",
    "handleDrop()",
    "handleImageUpload()",
    "formData.get()",
    "supabase.storage.upload()",
    "editor.commands.setImage()",
    "fs.writeFile()"
  ]
}

// 3. 语法高亮功能详情
export const syntaxHighlightFeature: FeatureDetailData = {
  title: "语法高亮",
  description: "代码块语法高亮，支持多种编程语言",
  icon: Palette,
  color: "text-orange-500",
  bgColor: "bg-orange-500/10",
  technologies: [
    {
      name: "@tiptap/extension-code-block-lowlight",
      description: "TipTap 代码块扩展，集成 lowlight 语法高亮",
      type: "library"
    },
    {
      name: "lowlight",
      description: "基于 highlight.js 的轻量级语法高亮库",
      type: "library"
    },
    {
      name: "highlight.js 语言包",
      description: "支持 180+ 编程语言的语法定义",
      type: "library"
    },
    {
      name: "代码主题",
      description: "支持多种代码高亮主题，适配深色/浅色模式",
      type: "pattern"
    },
    {
      name: "语言自动检测",
      description: "自动检测代码语言，也支持手动指定",
      type: "pattern"
    }
  ],
  coreFiles: [
    {
      path: "src/components/editor/tiptap-editor.tsx",
      description: "编辑器组件，配置代码块扩展"
    },
    {
      path: "src/components/editor/extensions/code-block.ts",
      description: "代码块扩展配置，注册语言支持"
    },
    {
      path: "src/styles/code-theme.css",
      description: "代码高亮主题样式"
    }
  ],
  workflow: [
    "用户输入 ``` 或点击工具栏代码块按钮",
    "TipTap 创建代码块节点",
    "用户可选择指定语言（如 ```typescript）",
    "lowlight 解析代码内容生成语法树",
    "根据语法树应用对应的 CSS 类名",
    "highlight.js 主题样式渲染高亮效果",
    "深色/浅色模式自动切换对应主题"
  ],
  codeSnippets: [
    {
      title: "代码块扩展配置",
      language: "typescript",
      description: "配置 TipTap 代码块语法高亮",
      code: `import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { lowlight } from 'lowlight'

// 注册常用语言
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import python from 'highlight.js/lib/languages/python'
import css from 'highlight.js/lib/languages/css'
import sql from 'highlight.js/lib/languages/sql'

lowlight.registerLanguage('javascript', javascript)
lowlight.registerLanguage('typescript', typescript)
lowlight.registerLanguage('python', python)
lowlight.registerLanguage('css', css)
lowlight.registerLanguage('sql', sql)

const editor = useEditor({
  extensions: [
    CodeBlockLowlight.configure({
      lowlight,
      defaultLanguage: 'plaintext',
      HTMLAttributes: {
        class: 'code-block',
      },
    }),
  ],
})`
    },
    {
      title: "代码主题样式",
      language: "css",
      description: "代码高亮主题 CSS",
      code: `/* 代码块容器 */
.code-block {
  background: var(--code-bg);
  border-radius: 0.5rem;
  padding: 1rem;
  font-family: 'Fira Code', monospace;
  font-size: 0.875rem;
  overflow-x: auto;
}

/* 语法高亮颜色 */
.hljs-keyword { color: #c678dd; }
.hljs-string { color: #98c379; }
.hljs-number { color: #d19a66; }
.hljs-function { color: #61afef; }
.hljs-comment { color: #5c6370; font-style: italic; }
.hljs-variable { color: #e06c75; }

/* 深色模式 */
.dark .code-block {
  background: #1e1e1e;
}

/* 浅色模式 */
.light .code-block {
  background: #f5f5f5;
}`
    }
  ],
  keyFunctions: [
    "lowlight.registerLanguage()",
    "CodeBlockLowlight.configure()",
    "lowlight.highlight()",
    "editor.commands.setCodeBlock()",
    "toggleCodeBlock()"
  ]
}

// 4. 实时预览功能详情
export const livePreviewFeature: FeatureDetailData = {
  title: "实时预览",
  description: "Markdown 实时预览，所见即所得",
  icon: Eye,
  color: "text-pink-500",
  bgColor: "bg-pink-500/10",
  technologies: [
    {
      name: "TipTap WYSIWYG",
      description: "所见即所得编辑器，输入即渲染",
      type: "library"
    },
    {
      name: "ProseMirror",
      description: "TipTap 底层引擎，提供实时文档模型",
      type: "library"
    },
    {
      name: "EditorContent",
      description: "TipTap React 组件，渲染编辑器内容",
      type: "component"
    },
    {
      name: "onUpdate 回调",
      description: "内容变化时触发，用于同步和保存",
      type: "hook"
    },
    {
      name: "CSS 样式映射",
      description: "Markdown 元素映射到对应的 CSS 样式",
      type: "pattern"
    }
  ],
  coreFiles: [
    {
      path: "src/components/editor/tiptap-editor.tsx",
      description: "TipTap 编辑器主组件"
    },
    {
      path: "src/components/editor/editor-content.tsx",
      description: "编辑器内容渲染组件"
    },
    {
      path: "src/styles/editor.css",
      description: "编辑器样式，定义各元素外观"
    }
  ],
  workflow: [
    "用户在编辑器中输入 Markdown 语法",
    "TipTap 通过 ProseMirror 实时解析输入",
    "解析结果转换为文档节点树",
    "EditorContent 组件渲染节点树为 HTML",
    "CSS 样式应用到各类型节点",
    "用户看到格式化后的实时效果",
    "继续输入时循环此过程"
  ],
  codeSnippets: [
    {
      title: "编辑器实时更新",
      language: "typescript",
      description: "监听内容变化实现实时预览",
      code: `const editor = useEditor({
  extensions: [
    StarterKit,
    // 其他扩展...
  ],
  content: initialContent,
  onUpdate: ({ editor }) => {
    // 获取 HTML 内容
    const html = editor.getHTML()
    
    // 获取纯文本内容
    const text = editor.getText()
    
    // 获取 JSON 文档结构
    const json = editor.getJSON()
    
    // 触发保存或同步
    onContentChange?.(html)
  },
  // 实时渲染配置
  editorProps: {
    attributes: {
      class: 'prose prose-sm max-w-none focus:outline-none',
    },
  },
})`
    },
    {
      title: "编辑器样式",
      language: "css",
      description: "Markdown 元素样式定义",
      code: `/* 编辑器容器 */
.ProseMirror {
  min-height: 300px;
  padding: 1rem;
}

/* 标题样式 */
.ProseMirror h1 {
  font-size: 2rem;
  font-weight: 700;
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
}

.ProseMirror h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-top: 1.25rem;
}

/* 列表样式 */
.ProseMirror ul {
  list-style-type: disc;
  padding-left: 1.5rem;
}

.ProseMirror ol {
  list-style-type: decimal;
  padding-left: 1.5rem;
}

/* 引用块 */
.ProseMirror blockquote {
  border-left: 4px solid var(--primary);
  padding-left: 1rem;
  color: var(--muted-foreground);
  font-style: italic;
}

/* 行内代码 */
.ProseMirror code {
  background: var(--muted);
  padding: 0.2rem 0.4rem;
  border-radius: 0.25rem;
  font-family: monospace;
}`
    }
  ],
  keyFunctions: [
    "useEditor()",
    "editor.getHTML()",
    "editor.getJSON()",
    "EditorContent",
    "onUpdate()",
    "editor.commands"
  ]
}

// 导出内容增强功能数据映射
export const contentFeatureDetails: Record<string, FeatureDetailData> = {
  "math-formula": mathFormulaFeature,
  "image-upload": imageUploadFeature,
  "syntax-highlight": syntaxHighlightFeature,
  "live-preview": livePreviewFeature,
}

// ============================================
// 导出与历史功能详情
// ============================================

import { Download, History, Clock } from "lucide-react"

// 1. 多格式导出功能详情
export const multiFormatExportFeature: FeatureDetailData = {
  title: "多格式导出",
  description: "导出为 Markdown、PDF、HTML 格式",
  icon: Download,
  color: "text-orange-600",
  bgColor: "bg-orange-600/10",
  technologies: [
    {
      name: "ExportManager 类",
      description: "统一的导出管理器，封装所有导出格式的实现逻辑",
      type: "pattern"
    },
    {
      name: "jsPDF",
      description: "纯 JavaScript 的 PDF 生成库，支持中文字体和多页文档",
      type: "library"
    },
    {
      name: "html2canvas",
      description: "将 HTML 元素渲染为 Canvas，用于 PDF 导出时保留样式",
      type: "library"
    },
    {
      name: "KaTeX",
      description: "数学公式渲染，导出时保留公式显示效果",
      type: "library"
    },
    {
      name: "Blob API",
      description: "创建文件 Blob 对象，支持浏览器下载",
      type: "pattern"
    },
    {
      name: "HTML to Markdown 转换",
      description: "递归遍历 DOM 节点，将 HTML 转换为 Markdown 语法",
      type: "pattern"
    }
  ],
  coreFiles: [
    {
      path: "src/lib/export/export-manager.ts",
      description: "导出管理器核心类，包含所有格式的导出逻辑"
    },
    {
      path: "src/components/export/export-dialog.tsx",
      description: "导出对话框组件，提供格式选择和导出按钮"
    },
    {
      path: "src/components/notes/editor-toolbar.tsx",
      description: "编辑器工具栏，包含导出按钮入口"
    },
    {
      path: "src/app/api/notes/[id]/export/route.ts",
      description: "服务端导出 API（可选，用于大文件处理）"
    }
  ],
  workflow: [
    "用户点击编辑器工具栏的导出按钮",
    "ExportDialog 组件弹出，显示格式选择（Markdown/PDF/HTML）",
    "用户选择导出格式并点击确认",
    "调用 ExportManager 对应的导出方法",
    "Markdown: 递归遍历 HTML DOM，转换为 Markdown 语法",
    "PDF: 创建临时 DOM 容器，使用 html2canvas 渲染为图片，jsPDF 生成多页 PDF",
    "HTML: 处理内容，转换图片为 Base64，生成完整 HTML 文档",
    "生成 Blob 对象，调用 downloadBlob 触发浏览器下载",
    "清理临时 DOM 元素，完成导出"
  ],
  codeSnippets: [
    {
      title: "PDF 导出实现",
      language: "typescript",
      description: "使用 html2canvas 和 jsPDF 生成 PDF",
      code: `public async exportToPDF(note: NoteData): Promise<Blob> {
  // 创建临时容器渲染内容
  const container = document.createElement('div')
  container.innerHTML = \`
    <div style="width:794px;padding:50px;background:#fff">
      <h1>\${note.title}</h1>
      <div>\${this.processContent(note.content)}</div>
    </div>
  \`
  document.body.appendChild(container)
  
  // 等待字体和公式渲染完成
  await document.fonts.ready
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // 使用 html2canvas 渲染为图片
  const canvas = await html2canvas(container, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#fff',
  })
  
  // 创建 PDF 并处理分页
  const pdf = new jsPDF({ format: 'a4' })
  const pageHeight = 297 // A4 高度 mm
  const imgHeight = (canvas.height * 210) / canvas.width
  
  if (imgHeight <= pageHeight) {
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 210, imgHeight)
  } else {
    // 多页处理...
  }
  
  document.body.removeChild(container)
  return pdf.output('blob')
}`
    },
    {
      title: "HTML 转 Markdown",
      language: "typescript",
      description: "递归遍历 DOM 节点转换格式",
      code: `private processNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent || ''
  }
  
  const el = node as HTMLElement
  const tagName = el.tagName.toLowerCase()
  const children = Array.from(el.childNodes)
    .map(c => this.processNode(c)).join('')
  
  const tagMap: Record<string, string> = {
    h1: \`# \${children}\\n\\n\`,
    h2: \`## \${children}\\n\\n\`,
    h3: \`### \${children}\\n\\n\`,
    p: \`\${children}\\n\\n\`,
    strong: \`**\${children}**\`,
    em: \`*\${children}*\`,
    code: \`\\\`\${children}\\\`\`,
    pre: \`\\\`\\\`\\\`\\n\${children}\\n\\\`\\\`\\\`\\n\\n\`,
    hr: '---\\n\\n',
  }
  
  if (tagMap[tagName]) return tagMap[tagName]
  if (tagName === 'a') return \`[\${children}](\${el.getAttribute('href')})\`
  if (tagName === 'img') return \`![\${el.getAttribute('alt')}](\${el.getAttribute('src')})\`
  if (tagName === 'li') return \`- \${children}\\n\`
  
  return children
}`
    },
    {
      title: "文件下载触发",
      language: "typescript",
      description: "使用 Blob URL 触发浏览器下载",
      code: `public downloadBlob(blob: Blob, filename: string): void {
  // 创建 Blob URL
  const url = URL.createObjectURL(blob)
  
  // 创建临时下载链接
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  
  // 触发下载
  document.body.appendChild(link)
  link.click()
  
  // 清理
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

public generateFilename(title: string, ext: string): string {
  const sanitized = title
    .replace(/[<>:"/\\\\|?*]/g, '')
    .replace(/\\s+/g, '_')
    .substring(0, 100)
  const date = new Date().toISOString().split('T')[0]
  return \`\${sanitized}_\${date}.\${ext}\`
}`
    }
  ],
  keyFunctions: [
    "exportManager.exportToMarkdown()",
    "exportManager.exportToPDF()",
    "exportManager.exportToHTML()",
    "html2canvas()",
    "jsPDF.addImage()",
    "downloadBlob()",
    "URL.createObjectURL()"
  ]
}

// 2. 版本历史功能详情
export const versionHistoryFeature: FeatureDetailData = {
  title: "版本历史",
  description: "查看和恢复笔记的历史版本，追踪所有修改",
  icon: History,
  color: "text-yellow-600",
  bgColor: "bg-yellow-600/10",
  technologies: [
    {
      name: "NoteVersion 模型",
      description: "Prisma 模型存储版本快照，包含标题、内容、时间戳",
      type: "pattern"
    },
    {
      name: "VersionManager",
      description: "版本管理器，封装版本的增删查改和恢复逻辑",
      type: "pattern"
    },
    {
      name: "版本数量限制",
      description: "每个笔记最多保留 50 个版本，自动清理最旧版本",
      type: "pattern"
    },
    {
      name: "权限验证",
      description: "验证用户对笔记的访问权限（所有者/协作者）",
      type: "pattern"
    },
    {
      name: "乐观恢复",
      description: "恢复前保存当前状态，支持撤销恢复操作",
      type: "pattern"
    },
    {
      name: "用户信息关联",
      description: "版本记录关联修改用户，显示修改者信息",
      type: "pattern"
    }
  ],
  coreFiles: [
    {
      path: "src/lib/versions/version-manager.ts",
      description: "版本管理器核心逻辑，包含保存、获取、恢复功能"
    },
    {
      path: "src/components/notes/version-history-dialog.tsx",
      description: "版本历史对话框，展示版本列表和预览"
    },
    {
      path: "src/app/api/notes/[id]/versions/route.ts",
      description: "版本列表 API，获取笔记所有版本"
    },
    {
      path: "src/app/api/notes/[id]/versions/[versionId]/route.ts",
      description: "单个版本 API，获取版本详情"
    },
    {
      path: "src/app/api/notes/[id]/versions/[versionId]/restore/route.ts",
      description: "版本恢复 API，恢复到指定版本"
    },
    {
      path: "prisma/schema.prisma",
      description: "NoteVersion 模型定义"
    }
  ],
  workflow: [
    "用户编辑笔记并保存时，调用 saveNoteVersion 创建版本快照",
    "版本包含：noteId、title、content、userId、createdAt",
    "检查版本数量，超过 50 个时删除最旧的版本",
    "用户点击历史按钮，调用 getNoteVersions 获取版本列表",
    "API 验证用户权限（所有者或协作者）",
    "返回版本列表，包含修改者用户名和邮箱",
    "用户选择版本预览，调用 getNoteVersion 获取详情",
    "用户点击恢复，调用 restoreNoteVersion",
    "恢复前先保存当前内容为新版本（支持撤销）",
    "更新笔记内容为选中版本的内容"
  ],
  codeSnippets: [
    {
      title: "保存版本快照",
      language: "typescript",
      description: "创建版本并自动清理旧版本",
      code: `const MAX_VERSIONS_PER_NOTE = 50

export async function saveNoteVersion(
  userId: string,
  noteId: string,
  title: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 创建新版本
    await prisma.noteVersion.create({
      data: {
        noteId,
        title,
        content,
        userId,
      },
    })

    // 检查版本数量
    const versionCount = await prisma.noteVersion.count({
      where: { noteId },
    })

    // 超过限制时删除最旧版本
    if (versionCount > MAX_VERSIONS_PER_NOTE) {
      const versionsToDelete = versionCount - MAX_VERSIONS_PER_NOTE
      
      const oldestVersions = await prisma.noteVersion.findMany({
        where: { noteId },
        orderBy: { createdAt: 'asc' },
        take: versionsToDelete,
        select: { id: true },
      })

      await prisma.noteVersion.deleteMany({
        where: {
          id: { in: oldestVersions.map(v => v.id) },
        },
      })
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}`
    },
    {
      title: "获取版本列表",
      language: "typescript",
      description: "验证权限并返回版本列表",
      code: `export async function getNoteVersions(
  noteId: string,
  userId: string
): Promise<{ success: boolean; data?: NoteVersionWithUser[] }> {
  // 验证用户访问权限
  const note = await prisma.note.findFirst({
    where: {
      id: noteId,
      OR: [
        { userId },
        { ownerId: userId },
        { Collaborator: { some: { userId } } },
      ],
    },
  })

  if (!note) {
    return { success: false, error: 'Access denied' }
  }

  // 获取版本列表（按时间倒序）
  const versions = await prisma.noteVersion.findMany({
    where: { noteId },
    orderBy: { createdAt: 'desc' },
  })

  // 关联用户信息
  const versionsWithUsers = await Promise.all(
    versions.map(async (version) => {
      const user = await prisma.user.findUnique({
        where: { id: version.userId },
        select: { name: true, email: true },
      })
      return { ...version, userName: user?.name, userEmail: user?.email }
    })
  )

  return { success: true, data: versionsWithUsers }
}`
    },
    {
      title: "恢复版本",
      language: "typescript",
      description: "恢复前保存当前状态，支持撤销",
      code: `export async function restoreNoteVersion(
  noteId: string,
  versionId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  // 获取要恢复的版本
  const version = await getNoteVersion(versionId, userId)
  if (!version.success) return version

  // 验证编辑权限
  const note = await prisma.note.findFirst({
    where: {
      id: noteId,
      OR: [
        { userId },
        { ownerId: userId },
        { Collaborator: { some: { userId, role: 'editor' } } },
      ],
    },
  })

  if (!note) {
    return { success: false, error: 'Insufficient permissions' }
  }

  // 恢复前保存当前状态（支持撤销恢复）
  if (note.title !== version.data.title || 
      note.content !== version.data.content) {
    await saveNoteVersion(userId, noteId, note.title, note.content)
  }

  // 更新笔记内容
  await prisma.note.update({
    where: { id: noteId },
    data: {
      title: version.data.title,
      content: version.data.content,
      updatedAt: new Date(),
    },
  })

  return { success: true }
}`
    }
  ],
  keyFunctions: [
    "saveNoteVersion()",
    "getNoteVersions()",
    "getNoteVersion()",
    "restoreNoteVersion()",
    "deleteNoteVersions()",
    "prisma.noteVersion.create()",
    "prisma.noteVersion.findMany()"
  ]
}

// 3. 自动保存功能详情
export const autoSaveFeature: FeatureDetailData = {
  title: "自动保存",
  description: "编辑时自动保存，永不丢失内容",
  icon: Clock,
  color: "text-indigo-500",
  bgColor: "bg-indigo-500/10",
  technologies: [
    {
      name: "useDebounce Hook",
      description: "防抖处理，避免频繁保存请求",
      type: "hook"
    },
    {
      name: "onUpdate 回调",
      description: "TipTap 编辑器内容变化时触发保存",
      type: "hook"
    },
    {
      name: "localStorage 草稿",
      description: "本地存储草稿，防止意外关闭丢失",
      type: "pattern"
    },
    {
      name: "保存状态指示",
      description: "显示保存中/已保存状态，用户感知",
      type: "component"
    },
    {
      name: "离线队列",
      description: "离线时将保存请求加入队列，联网后自动同步",
      type: "pattern"
    },
    {
      name: "冲突检测",
      description: "检测并发编辑冲突，提示用户处理",
      type: "pattern"
    }
  ],
  coreFiles: [
    {
      path: "src/components/editor/tiptap-editor.tsx",
      description: "编辑器组件，集成自动保存逻辑"
    },
    {
      path: "src/components/notes/note-editor.tsx",
      description: "笔记编辑器，管理保存状态和草稿"
    },
    {
      path: "src/hooks/use-debounce.ts",
      description: "防抖 Hook，延迟触发保存"
    },
    {
      path: "src/lib/offline/draft-manager.ts",
      description: "草稿管理器，处理本地存储和恢复"
    },
    {
      path: "src/components/offline/draft-recovery-dialog.tsx",
      description: "草稿恢复对话框，提示用户恢复未保存内容"
    }
  ],
  workflow: [
    "用户在编辑器中输入内容",
    "TipTap onUpdate 回调触发，更新本地状态",
    "同时将内容保存到 localStorage 作为草稿",
    "useDebounce 延迟 1-2 秒后触发实际保存",
    "显示「保存中...」状态指示",
    "调用 PATCH /api/notes/[id] 保存到数据库",
    "保存成功后显示「已保存」状态",
    "同时调用 saveNoteVersion 创建版本快照",
    "清除 localStorage 中的草稿",
    "如果保存失败，保留草稿并显示错误提示",
    "下次打开时检测草稿，提示用户恢复"
  ],
  codeSnippets: [
    {
      title: "自动保存实现",
      language: "typescript",
      description: "使用防抖延迟保存",
      code: `function NoteEditor({ noteId, initialContent }: Props) {
  const [content, setContent] = useState(initialContent)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved')
  
  // 防抖处理，1.5秒后触发保存
  const debouncedContent = useDebounce(content, 1500)
  
  // 内容变化时保存草稿到 localStorage
  useEffect(() => {
    if (content !== initialContent) {
      localStorage.setItem(\`draft-\${noteId}\`, JSON.stringify({
        content,
        timestamp: Date.now(),
      }))
    }
  }, [content, noteId, initialContent])
  
  // 防抖后自动保存到服务器
  useEffect(() => {
    if (debouncedContent === initialContent) return
    
    const saveNote = async () => {
      setSaveStatus('saving')
      try {
        await fetch(\`/api/notes/\${noteId}\`, {
          method: 'PATCH',
          body: JSON.stringify({ content: debouncedContent }),
        })
        setSaveStatus('saved')
        localStorage.removeItem(\`draft-\${noteId}\`)
      } catch {
        setSaveStatus('error')
      }
    }
    
    saveNote()
  }, [debouncedContent, noteId])
  
  return (
    <div>
      <SaveStatusIndicator status={saveStatus} />
      <TipTapEditor
        content={content}
        onUpdate={({ editor }) => setContent(editor.getHTML())}
      />
    </div>
  )
}`
    },
    {
      title: "草稿恢复检测",
      language: "typescript",
      description: "检测并提示恢复未保存草稿",
      code: `function useDraftRecovery(noteId: string, serverContent: string) {
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false)
  const [draftContent, setDraftContent] = useState<string | null>(null)
  
  useEffect(() => {
    const draftKey = \`draft-\${noteId}\`
    const savedDraft = localStorage.getItem(draftKey)
    
    if (savedDraft) {
      try {
        const { content, timestamp } = JSON.parse(savedDraft)
        
        // 草稿内容与服务器不同，且在24小时内
        const isRecent = Date.now() - timestamp < 24 * 60 * 60 * 1000
        const isDifferent = content !== serverContent
        
        if (isRecent && isDifferent) {
          setDraftContent(content)
          setShowRecoveryDialog(true)
        } else {
          // 过期或相同，清除草稿
          localStorage.removeItem(draftKey)
        }
      } catch {
        localStorage.removeItem(draftKey)
      }
    }
  }, [noteId, serverContent])
  
  const recoverDraft = () => {
    setShowRecoveryDialog(false)
    return draftContent
  }
  
  const discardDraft = () => {
    localStorage.removeItem(\`draft-\${noteId}\`)
    setShowRecoveryDialog(false)
  }
  
  return { showRecoveryDialog, recoverDraft, discardDraft }
}`
    },
    {
      title: "保存状态指示器",
      language: "typescript",
      description: "显示保存状态的 UI 组件",
      code: `function SaveStatusIndicator({ status }: { status: 'saved' | 'saving' | 'error' }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {status === 'saving' && (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground">保存中...</span>
        </>
      )}
      {status === 'saved' && (
        <>
          <Check className="h-4 w-4 text-green-500" />
          <span className="text-green-500">已保存</span>
        </>
      )}
      {status === 'error' && (
        <>
          <AlertCircle className="h-4 w-4 text-red-500" />
          <span className="text-red-500">保存失败</span>
        </>
      )}
    </div>
  )
}`
    }
  ],
  keyFunctions: [
    "useDebounce()",
    "localStorage.setItem()",
    "localStorage.getItem()",
    "editor.onUpdate()",
    "fetch('/api/notes/[id]')",
    "saveNoteVersion()",
    "setSaveStatus()"
  ]
}

// 导出导出与历史功能数据映射
export const exportFeatureDetails: Record<string, FeatureDetailData> = {
  "multi-format-export": multiFormatExportFeature,
  "version-history": versionHistoryFeature,
  "auto-save": autoSaveFeature,
}
