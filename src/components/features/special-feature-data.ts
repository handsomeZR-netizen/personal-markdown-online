import { WifiOff, Keyboard, Moon, Database, Shield, Wand2 } from "lucide-react"
import type { FeatureDetailData } from "./feature-detail-dialog"

/**
 * 特色功能详细数据配置
 * 用于在功能展示页面点击时显示实现细节
 */

// 1. 离线同步功能详情
export const offlineSyncFeature: FeatureDetailData = {
  title: "离线同步",
  description: "离线编辑笔记，联网后自动同步到云端",
  icon: WifiOff,
  color: "text-blue-700",
  bgColor: "bg-blue-700/10",
  technologies: [
    {
      name: "Service Worker",
      description: "PWA 核心技术，拦截网络请求实现离线缓存",
      type: "pattern"
    },
    {
      name: "IndexedDB",
      description: "浏览器本地数据库，存储离线数据和待同步队列",
      type: "pattern"
    },
    {
      name: "Background Sync API",
      description: "后台同步 API，网络恢复时自动触发同步",
      type: "pattern"
    },
    {
      name: "Workbox",
      description: "Google 的 PWA 工具库，简化 Service Worker 开发",
      type: "library"
    },
    {
      name: "冲突解决策略",
      description: "基于时间戳的冲突检测，支持手动选择版本",
      type: "pattern"
    },
    {
      name: "乐观更新",
      description: "先更新本地 UI，后台异步同步到服务器",
      type: "pattern"
    }
  ],
  coreFiles: [
    {
      path: "src/lib/offline/sync-manager.ts",
      description: "离线同步管理器，处理数据同步逻辑"
    },
    {
      path: "src/lib/offline/conflict-resolver.ts",
      description: "冲突解决器，处理并发编辑冲突"
    },
    {
      path: "src/lib/offline/queue-manager.ts",
      description: "同步队列管理，存储待同步操作"
    },
    {
      path: "src/components/offline/offline-indicator.tsx",
      description: "离线状态指示器组件"
    },
    {
      path: "public/sw.js",
      description: "Service Worker 文件，处理缓存和离线请求"
    }
  ],
  workflow: [
    "用户打开应用，Service Worker 注册并缓存静态资源",
    "用户编辑笔记，数据同时保存到 IndexedDB 和服务器",
    "网络断开时，请求被 Service Worker 拦截",
    "编辑操作存入 IndexedDB 的同步队列",
    "UI 显示离线状态指示器",
    "用户可继续编辑，所有操作记录到队列",
    "网络恢复时，Background Sync 触发同步",
    "同步管理器按顺序处理队列中的操作",
    "检测冲突：比较本地和服务器版本时间戳",
    "无冲突则直接同步，有冲突则提示用户选择",
    "同步完成后清空队列，更新本地数据"
  ],
  codeSnippets: [
    {
      title: "离线检测与状态管理",
      language: "typescript",
      description: "监听网络状态变化",
      code: `function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      // 触发同步
      syncManager.syncPendingChanges()
    }
    
    const handleOffline = () => {
      setIsOnline(false)
      toast.info('已切换到离线模式')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}`
    },
    {
      title: "同步队列管理",
      language: "typescript",
      description: "IndexedDB 存储待同步操作",
      code: `class SyncQueueManager {
  private dbName = 'note-app-sync'
  private storeName = 'pending-changes'

  async addToQueue(operation: SyncOperation) {
    const db = await this.openDB()
    const tx = db.transaction(this.storeName, 'readwrite')
    await tx.store.add({
      ...operation,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      retryCount: 0,
    })
  }

  async processQueue() {
    const db = await this.openDB()
    const operations = await db.getAll(this.storeName)
    
    for (const op of operations.sort((a, b) => a.timestamp - b.timestamp)) {
      try {
        await this.executeOperation(op)
        await db.delete(this.storeName, op.id)
      } catch (error) {
        if (op.retryCount < 3) {
          await db.put(this.storeName, { ...op, retryCount: op.retryCount + 1 })
        }
      }
    }
  }
}`
    },
    {
      title: "冲突解决",
      language: "typescript",
      description: "检测并处理编辑冲突",
      code: `async function resolveConflict(
  localNote: Note,
  serverNote: Note
): Promise<Note> {
  // 比较更新时间
  const localTime = new Date(localNote.updatedAt).getTime()
  const serverTime = new Date(serverNote.updatedAt).getTime()

  // 内容相同，无冲突
  if (localNote.content === serverNote.content) {
    return serverNote
  }

  // 时间差小于 5 秒，可能是同一次编辑
  if (Math.abs(localTime - serverTime) < 5000) {
    return serverNote
  }

  // 存在冲突，提示用户选择
  const choice = await showConflictDialog({
    local: localNote,
    server: serverNote,
  })

  return choice === 'local' ? localNote : serverNote
}`
    }
  ],
  keyFunctions: [
    "navigator.onLine",
    "navigator.serviceWorker.register()",
    "indexedDB.open()",
    "syncManager.syncPendingChanges()",
    "BackgroundSync.register()",
    "caches.match()",
    "resolveConflict()"
  ]
}


// 2. 快捷键支持功能详情
export const keyboardShortcutsFeature: FeatureDetailData = {
  title: "快捷键支持",
  description: "丰富的键盘快捷键，提升编辑效率",
  icon: Keyboard,
  color: "text-purple-700",
  bgColor: "bg-purple-700/10",
  technologies: [
    {
      name: "useKeyboardShortcuts Hook",
      description: "自定义 Hook 统一管理全局和局部快捷键",
      type: "hook"
    },
    {
      name: "KeyboardEvent API",
      description: "原生键盘事件 API，监听按键组合",
      type: "pattern"
    },
    {
      name: "TipTap 快捷键",
      description: "编辑器内置快捷键，支持格式化操作",
      type: "library"
    },
    {
      name: "事件委托",
      description: "在 document 级别监听，避免重复绑定",
      type: "pattern"
    },
    {
      name: "快捷键冲突处理",
      description: "检测并处理浏览器/系统快捷键冲突",
      type: "pattern"
    },
    {
      name: "可配置快捷键",
      description: "用户可自定义快捷键映射",
      type: "pattern"
    }
  ],
  coreFiles: [
    {
      path: "src/hooks/use-keyboard-shortcuts.ts",
      description: "快捷键管理 Hook，注册和触发快捷键"
    },
    {
      path: "src/components/editor/tiptap-editor.tsx",
      description: "编辑器组件，集成编辑快捷键"
    },
    {
      path: "src/app/help/shortcuts/page.tsx",
      description: "快捷键帮助页面，展示所有可用快捷键"
    },
    {
      path: "src/lib/shortcuts/shortcut-config.ts",
      description: "快捷键配置文件，定义默认映射"
    }
  ],
  workflow: [
    "应用启动时，useKeyboardShortcuts Hook 在 document 上注册事件监听",
    "用户按下快捷键，keydown 事件触发",
    "Hook 解析按键组合（Ctrl/Cmd + Key）",
    "查找匹配的快捷键配置",
    "检查当前焦点元素，避免在输入框中误触发",
    "执行对应的回调函数",
    "编辑器内快捷键由 TipTap 单独处理",
    "显示快捷键提示（可选）"
  ],
  codeSnippets: [
    {
      title: "快捷键 Hook 实现",
      language: "typescript",
      description: "统一管理快捷键注册和触发",
      code: `interface Shortcut {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  action: () => void
  description: string
}

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 忽略输入框中的快捷键
      if (['INPUT', 'TEXTAREA'].includes((e.target as Element).tagName)) {
        return
      }

      const shortcut = shortcuts.find(s => 
        s.key.toLowerCase() === e.key.toLowerCase() &&
        !!s.ctrl === (e.ctrlKey || e.metaKey) &&
        !!s.shift === e.shiftKey &&
        !!s.alt === e.altKey
      )

      if (shortcut) {
        e.preventDefault()
        shortcut.action()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts])
}`
    },
    {
      title: "常用快捷键配置",
      language: "typescript",
      description: "应用级快捷键定义",
      code: `const globalShortcuts: Shortcut[] = [
  {
    key: 's',
    ctrl: true,
    action: () => saveCurrentNote(),
    description: '保存笔记'
  },
  {
    key: 'k',
    ctrl: true,
    action: () => openSearchDialog(),
    description: '打开搜索'
  },
  {
    key: 'n',
    ctrl: true,
    action: () => router.push('/notes/new'),
    description: '新建笔记'
  },
  {
    key: 'Escape',
    action: () => closeCurrentDialog(),
    description: '关闭弹窗'
  },
  {
    key: '/',
    action: () => focusSearchInput(),
    description: '聚焦搜索框'
  }
]`
    },
    {
      title: "TipTap 编辑器快捷键",
      language: "typescript",
      description: "编辑器内置格式化快捷键",
      code: `// TipTap 内置快捷键
const editorShortcuts = {
  'Mod-b': () => editor.chain().focus().toggleBold().run(),
  'Mod-i': () => editor.chain().focus().toggleItalic().run(),
  'Mod-u': () => editor.chain().focus().toggleUnderline().run(),
  'Mod-Shift-s': () => editor.chain().focus().toggleStrike().run(),
  'Mod-e': () => editor.chain().focus().toggleCode().run(),
  'Mod-Shift-h': () => editor.chain().focus().toggleHighlight().run(),
  'Mod-Enter': () => editor.chain().focus().setHardBreak().run(),
  'Mod-Shift-1': () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
  'Mod-Shift-2': () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
  'Mod-Shift-3': () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
}

// Mod = Ctrl (Windows) / Cmd (Mac)`
    }
  ],
  keyFunctions: [
    "useKeyboardShortcuts()",
    "document.addEventListener('keydown')",
    "e.preventDefault()",
    "e.ctrlKey / e.metaKey",
    "editor.chain().focus()",
    "router.push()",
    "focusSearchInput()"
  ]
}


// 3. 深色模式功能详情
export const darkModeFeature: FeatureDetailData = {
  title: "深色模式",
  description: "自动切换深色/浅色主题，保护眼睛",
  icon: Moon,
  color: "text-slate-700",
  bgColor: "bg-slate-700/10",
  technologies: [
    {
      name: "next-themes",
      description: "Next.js 主题管理库，支持 SSR 和系统主题检测",
      type: "library"
    },
    {
      name: "CSS 变量",
      description: "使用 CSS 自定义属性定义主题颜色",
      type: "pattern"
    },
    {
      name: "Tailwind dark: 前缀",
      description: "Tailwind CSS 深色模式类名前缀",
      type: "pattern"
    },
    {
      name: "prefers-color-scheme",
      description: "CSS 媒体查询，检测系统主题偏好",
      type: "pattern"
    },
    {
      name: "localStorage 持久化",
      description: "保存用户主题选择到本地存储",
      type: "pattern"
    },
    {
      name: "ThemeProvider",
      description: "React Context 提供主题状态和切换方法",
      type: "component"
    }
  ],
  coreFiles: [
    {
      path: "src/components/theme-provider.tsx",
      description: "主题 Provider 组件，包装应用根节点"
    },
    {
      path: "src/components/theme-toggle.tsx",
      description: "主题切换按钮组件"
    },
    {
      path: "src/app/globals.css",
      description: "全局样式，定义主题 CSS 变量"
    },
    {
      path: "tailwind.config.js",
      description: "Tailwind 配置，启用 darkMode: class"
    }
  ],
  workflow: [
    "应用启动，ThemeProvider 检查 localStorage 中的主题设置",
    "如果没有保存的设置，检测系统主题偏好",
    "根据主题在 html 元素上添加 dark 或 light 类",
    "CSS 变量根据类名切换颜色值",
    "Tailwind dark: 前缀的样式生效",
    "用户点击主题切换按钮",
    "调用 setTheme() 更新主题状态",
    "更新 html 类名和 localStorage",
    "所有使用主题变量的组件自动更新"
  ],
  codeSnippets: [
    {
      title: "ThemeProvider 配置",
      language: "typescript",
      description: "在应用根节点配置主题 Provider",
      code: `// src/app/layout.tsx
import { ThemeProvider } from 'next-themes'

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}`
    },
    {
      title: "主题切换组件",
      language: "typescript",
      description: "切换深色/浅色/系统主题",
      code: `'use client'

import { useTheme } from 'next-themes'
import { Moon, Sun, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Sun className="h-5 w-5 rotate-0 scale-100 dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 dark:rotate-0 dark:scale-100" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => setTheme('light')}>
          <Sun className="mr-2 h-4 w-4" /> 浅色
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          <Moon className="mr-2 h-4 w-4" /> 深色
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>
          <Monitor className="mr-2 h-4 w-4" /> 系统
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}`
    },
    {
      title: "CSS 主题变量",
      language: "css",
      description: "定义深色/浅色主题颜色",
      code: `/* src/app/globals.css */
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --border: 214.3 31.8% 91.4%;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --border: 217.2 32.6% 17.5%;
  }
}

/* 使用变量 */
.bg-background { background-color: hsl(var(--background)); }
.text-foreground { color: hsl(var(--foreground)); }`
    }
  ],
  keyFunctions: [
    "useTheme()",
    "setTheme()",
    "ThemeProvider",
    "prefers-color-scheme",
    "localStorage.getItem('theme')",
    "document.documentElement.classList",
    "suppressHydrationWarning"
  ]
}


// 4. 本地存储功能详情
export const localStorageFeature: FeatureDetailData = {
  title: "本地存储",
  description: "数据本地缓存，快速加载和离线访问",
  icon: Database,
  color: "text-cyan-700",
  bgColor: "bg-cyan-700/10",
  technologies: [
    {
      name: "localStorage",
      description: "浏览器本地存储，持久化简单数据",
      type: "pattern"
    },
    {
      name: "IndexedDB",
      description: "浏览器数据库，存储大量结构化数据",
      type: "pattern"
    },
    {
      name: "Cache API",
      description: "Service Worker 缓存，存储静态资源",
      type: "pattern"
    },
    {
      name: "SWR / React Query",
      description: "数据获取库，内置缓存和重新验证",
      type: "library"
    },
    {
      name: "缓存策略",
      description: "Stale-While-Revalidate 策略，先显示缓存再更新",
      type: "pattern"
    },
    {
      name: "缓存失效",
      description: "基于时间或版本的缓存失效机制",
      type: "pattern"
    }
  ],
  coreFiles: [
    {
      path: "src/lib/cache/cache-manager.ts",
      description: "缓存管理器，统一管理各类缓存"
    },
    {
      path: "src/lib/cache/indexeddb-store.ts",
      description: "IndexedDB 封装，提供简单 API"
    },
    {
      path: "src/hooks/use-cached-data.ts",
      description: "缓存数据 Hook，自动处理缓存逻辑"
    },
    {
      path: "src/components/settings/cache-settings.tsx",
      description: "缓存设置组件，管理缓存大小和清理"
    }
  ],
  workflow: [
    "用户首次访问，从服务器获取数据",
    "数据存储到 IndexedDB（笔记内容）和 localStorage（设置）",
    "下次访问时，先从缓存加载数据显示",
    "后台发起请求获取最新数据",
    "比较缓存和服务器数据版本",
    "如有更新，更新缓存并刷新 UI",
    "静态资源由 Service Worker 缓存",
    "用户可在设置中查看缓存大小",
    "支持手动清理缓存释放空间"
  ],
  codeSnippets: [
    {
      title: "缓存管理器",
      language: "typescript",
      description: "统一管理本地缓存",
      code: `class CacheManager {
  private readonly CACHE_VERSION = 'v1'
  private readonly MAX_CACHE_SIZE = 50 * 1024 * 1024 // 50MB

  // 存储数据到缓存
  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    const cacheItem = {
      data,
      timestamp: Date.now(),
      ttl: ttl || 24 * 60 * 60 * 1000, // 默认 24 小时
      version: this.CACHE_VERSION,
    }
    
    if (this.isSimpleData(data)) {
      localStorage.setItem(key, JSON.stringify(cacheItem))
    } else {
      await this.indexedDBStore.set(key, cacheItem)
    }
  }

  // 从缓存获取数据
  async get<T>(key: string): Promise<T | null> {
    const item = await this.getRawItem(key)
    
    if (!item) return null
    
    // 检查版本和过期时间
    if (item.version !== this.CACHE_VERSION) return null
    if (Date.now() - item.timestamp > item.ttl) {
      await this.delete(key)
      return null
    }
    
    return item.data as T
  }

  // 获取缓存大小
  async getCacheSize(): Promise<number> {
    const estimate = await navigator.storage.estimate()
    return estimate.usage || 0
  }
}`
    },
    {
      title: "SWR 缓存策略",
      language: "typescript",
      description: "Stale-While-Revalidate 数据获取",
      code: `import useSWR from 'swr'

function useNotes() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/notes',
    fetcher,
    {
      // 缓存配置
      revalidateOnFocus: true,      // 窗口聚焦时重新验证
      revalidateOnReconnect: true,  // 网络恢复时重新验证
      dedupingInterval: 2000,       // 2秒内相同请求去重
      
      // 离线支持
      fallbackData: getCachedNotes(),
      onSuccess: (data) => {
        // 更新本地缓存
        cacheManager.set('notes', data)
      },
    }
  )

  return { notes: data, error, isLoading, refresh: mutate }
}

// 获取缓存的笔记
function getCachedNotes() {
  return cacheManager.get('notes')
}`
    },
    {
      title: "缓存清理",
      language: "typescript",
      description: "清理过期和超量缓存",
      code: `async function clearCache(options?: { all?: boolean }) {
  if (options?.all) {
    // 清理所有缓存
    localStorage.clear()
    await indexedDB.deleteDatabase('note-app-cache')
    
    // 清理 Service Worker 缓存
    const cacheNames = await caches.keys()
    await Promise.all(
      cacheNames.map(name => caches.delete(name))
    )
    
    toast.success('缓存已清理')
    return
  }

  // 只清理过期缓存
  const keys = await cacheManager.getAllKeys()
  let clearedSize = 0
  
  for (const key of keys) {
    const item = await cacheManager.getRawItem(key)
    if (item && Date.now() - item.timestamp > item.ttl) {
      clearedSize += JSON.stringify(item).length
      await cacheManager.delete(key)
    }
  }
  
  toast.success(\`已清理 \${formatBytes(clearedSize)} 过期缓存\`)
}`
    }
  ],
  keyFunctions: [
    "localStorage.setItem()",
    "localStorage.getItem()",
    "indexedDB.open()",
    "caches.open()",
    "navigator.storage.estimate()",
    "useSWR()",
    "cacheManager.set()"
  ]
}


// 5. 数据加密功能详情
export const dataEncryptionFeature: FeatureDetailData = {
  title: "数据加密",
  description: "端到端加密，保护你的隐私数据",
  icon: Shield,
  color: "text-red-700",
  bgColor: "bg-red-700/10",
  technologies: [
    {
      name: "Web Crypto API",
      description: "浏览器原生加密 API，提供 AES-GCM 等算法",
      type: "pattern"
    },
    {
      name: "AES-256-GCM",
      description: "对称加密算法，用于加密笔记内容",
      type: "pattern"
    },
    {
      name: "PBKDF2",
      description: "密钥派生函数，从用户密码生成加密密钥",
      type: "pattern"
    },
    {
      name: "端到端加密",
      description: "数据在客户端加密，服务器无法解密",
      type: "pattern"
    },
    {
      name: "密钥管理",
      description: "安全存储和管理用户加密密钥",
      type: "pattern"
    },
    {
      name: "加密指示器",
      description: "UI 显示笔记加密状态",
      type: "component"
    }
  ],
  coreFiles: [
    {
      path: "src/lib/encryption/crypto-utils.ts",
      description: "加密工具函数，封装 Web Crypto API"
    },
    {
      path: "src/lib/encryption/key-manager.ts",
      description: "密钥管理器，处理密钥生成和存储"
    },
    {
      path: "src/components/notes/encryption-toggle.tsx",
      description: "加密开关组件，切换笔记加密状态"
    },
    {
      path: "src/components/notes/unlock-dialog.tsx",
      description: "解锁对话框，输入密码解密笔记"
    }
  ],
  workflow: [
    "用户首次启用加密，设置加密密码",
    "使用 PBKDF2 从密码派生 256 位密钥",
    "密钥存储在 IndexedDB（可选导出备份）",
    "用户选择加密笔记，点击加密按钮",
    "使用 AES-256-GCM 加密笔记内容",
    "生成随机 IV（初始化向量）",
    "加密后的内容和 IV 一起存储到数据库",
    "服务器只存储密文，无法解密",
    "打开加密笔记时，提示输入密码",
    "验证密码，派生密钥，解密内容",
    "解密后的内容只在内存中，不持久化"
  ],
  codeSnippets: [
    {
      title: "AES-GCM 加密实现",
      language: "typescript",
      description: "使用 Web Crypto API 加密数据",
      code: `async function encryptContent(
  content: string,
  password: string
): Promise<EncryptedData> {
  // 从密码派生密钥
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  )

  const salt = crypto.getRandomValues(new Uint8Array(16))
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )

  // 生成随机 IV
  const iv = crypto.getRandomValues(new Uint8Array(12))

  // 加密内容
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(content)
  )

  return {
    ciphertext: arrayBufferToBase64(encrypted),
    iv: arrayBufferToBase64(iv),
    salt: arrayBufferToBase64(salt),
  }
}`
    },
    {
      title: "解密实现",
      language: "typescript",
      description: "解密加密的笔记内容",
      code: `async function decryptContent(
  encryptedData: EncryptedData,
  password: string
): Promise<string> {
  const { ciphertext, iv, salt } = encryptedData

  // 重新派生密钥
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  )

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: base64ToArrayBuffer(salt),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )

  // 解密
  try {
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: base64ToArrayBuffer(iv) },
      key,
      base64ToArrayBuffer(ciphertext)
    )
    return new TextDecoder().decode(decrypted)
  } catch {
    throw new Error('密码错误或数据损坏')
  }
}`
    },
    {
      title: "加密状态组件",
      language: "typescript",
      description: "显示和切换笔记加密状态",
      code: `function EncryptionToggle({ noteId, isEncrypted }: Props) {
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)

  const handleToggle = async () => {
    if (isEncrypted) {
      // 解密需要输入密码
      setShowPasswordDialog(true)
    } else {
      // 加密笔记
      const password = await promptPassword('设置加密密码')
      if (password) {
        await encryptNote(noteId, password)
        toast.success('笔记已加密')
      }
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleToggle}
        className={isEncrypted ? 'text-green-600' : 'text-muted-foreground'}
      >
        {isEncrypted ? (
          <><Lock className="h-4 w-4 mr-1" /> 已加密</>
        ) : (
          <><Unlock className="h-4 w-4 mr-1" /> 未加密</>
        )}
      </Button>
      
      <UnlockDialog
        open={showPasswordDialog}
        onOpenChange={setShowPasswordDialog}
        onUnlock={async (password) => {
          await decryptNote(noteId, password)
          setShowPasswordDialog(false)
        }}
      />
    </>
  )
}`
    }
  ],
  keyFunctions: [
    "crypto.subtle.importKey()",
    "crypto.subtle.deriveKey()",
    "crypto.subtle.encrypt()",
    "crypto.subtle.decrypt()",
    "crypto.getRandomValues()",
    "PBKDF2",
    "AES-GCM"
  ]
}

// 6. AI 写作助手功能详情
export const aiWritingAssistantFeature: FeatureDetailData = {
  title: "AI 写作助手",
  description: "智能改写文档，支持多种风格预设和自定义指令",
  icon: Wand2,
  color: "text-violet-700",
  bgColor: "bg-violet-700/10",
  technologies: [
    {
      name: "DeepSeek API",
      description: "大语言模型 API，提供智能文本改写能力",
      type: "api"
    },
    {
      name: "Server-Sent Events",
      description: "流式响应，实时显示 AI 生成内容",
      type: "pattern"
    },
    {
      name: "预设 Prompt 模板",
      description: "精心设计的风格提示词，确保改写质量",
      type: "pattern"
    },
    {
      name: "Radix Dialog",
      description: "无障碍对话框组件，展示风格选择界面",
      type: "library"
    },
    {
      name: "自定义指令",
      description: "支持用户输入任意改写指令",
      type: "pattern"
    },
    {
      name: "实时预览",
      description: "改写结果实时更新到编辑器",
      type: "pattern"
    }
  ],
  coreFiles: [
    {
      path: "src/components/notes/ai-writing-assistant-button.tsx",
      description: "AI 写作助手按钮和对话框组件"
    },
    {
      path: "src/app/api/ai/writing-assistant/route.ts",
      description: "AI 写作助手 API，处理改写请求"
    },
    {
      path: "src/lib/ai/deepseek.ts",
      description: "DeepSeek API 客户端，处理流式响应"
    },
    {
      path: "src/components/notes/note-editor.tsx",
      description: "笔记编辑器，集成 AI 写作助手按钮"
    }
  ],
  workflow: [
    "用户在编辑器中编写内容",
    "点击 AI 写作助手按钮，打开风格选择对话框",
    "选择预设风格（学术化/幽默/精简/丰富/商务）或输入自定义指令",
    "点击后发送请求到 /api/ai/writing-assistant",
    "API 验证用户身份，构建改写 Prompt",
    "调用 DeepSeek API 进行流式生成",
    "通过 SSE 实时返回生成内容",
    "前端逐字更新编辑器内容",
    "改写完成后显示成功提示"
  ],
  codeSnippets: [
    {
      title: "风格预设配置",
      language: "typescript",
      description: "预定义的改写风格和对应 Prompt",
      code: `const STYLE_PRESETS = [
  {
    id: "academic",
    name: "学术化",
    description: "使用专业术语，结构严谨，适合论文和报告",
    icon: GraduationCap,
    prompt: "请将以下内容改写为更加学术化的风格。使用专业术语，保持逻辑严谨，结构清晰，适合学术论文或正式报告。"
  },
  {
    id: "humorous",
    name: "幽默风趣",
    description: "轻松活泼，加入适当的幽默元素",
    icon: Smile,
    prompt: "请将以下内容改写为更加幽默风趣的风格。保持内容准确的同时，加入适当的幽默元素、比喻或轻松的表达方式。"
  },
  {
    id: "concise",
    name: "精简压缩",
    description: "删除冗余，保留核心，言简意赅",
    icon: Minimize2,
    prompt: "请将以下内容精简压缩。删除冗余的词句和重复的表达，只保留核心信息，使文字更加简洁有力。"
  },
  {
    id: "elaborate",
    name: "丰富扩展",
    description: "补充细节，增加例子，内容更充实",
    icon: Maximize2,
    prompt: "请将以下内容进行丰富扩展。补充相关的细节、背景信息、具体例子或数据支撑，使内容更加充实。"
  },
  {
    id: "professional",
    name: "商务专业",
    description: "正式得体，适合商务场合",
    icon: Pencil,
    prompt: "请将以下内容改写为商务专业风格。使用正式、得体的语言，适合商务邮件、报告或提案。"
  },
]`
    },
    {
      title: "流式响应处理",
      language: "typescript",
      description: "处理 AI 返回的流式数据",
      code: `const handleStyleSelect = async (styleId: string, prompt: string) => {
  setIsProcessing(true)

  try {
    const response = await fetch('/api/ai/writing-assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, stylePrompt: prompt }),
    })

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    let formattedText = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\\n')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') break
          
          try {
            const parsed = JSON.parse(data)
            if (parsed.content) {
              formattedText += parsed.content
              onFormatted(formattedText) // 实时更新编辑器
            }
          } catch {}
        }
      }
    }

    toast.success("AI 写作助手处理完成！")
  } finally {
    setIsProcessing(false)
  }
}`
    },
    {
      title: "API 路由实现",
      language: "typescript",
      description: "处理改写请求的服务端逻辑",
      code: `export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return new Response('未授权', { status: 401 })
  }

  const { content, stylePrompt } = await req.json()

  const systemPrompt = \`你是一个专业的写作助手。
【核心规则】
1. 严格按照用户指定的风格或指令进行改写
2. 保持原文的核心观点和主要信息不变
3. 改写后的内容应该流畅自然，符合指定风格
4. 如果原文包含 Markdown 格式，保持格式结构
5. 直接输出改写后的内容，不要添加解释\`

  const prompt = \`\${stylePrompt}

原文内容：
\${content}\`

  const stream = await streamDeepSeekResponse(prompt, systemPrompt)

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}`
    }
  ],
  keyFunctions: [
    "streamDeepSeekResponse()",
    "fetch('/api/ai/writing-assistant')",
    "response.body.getReader()",
    "TextDecoder.decode()",
    "onFormatted()",
    "Dialog / DialogContent",
    "toast.success()"
  ]
}

// 导出特色功能数据映射
export const specialFeatureDetails: Record<string, FeatureDetailData> = {
  "offline-sync": offlineSyncFeature,
  "keyboard-shortcuts": keyboardShortcutsFeature,
  "dark-mode": darkModeFeature,
  "local-storage": localStorageFeature,
  "data-encryption": dataEncryptionFeature,
  "ai-writing-assistant": aiWritingAssistantFeature,
}
