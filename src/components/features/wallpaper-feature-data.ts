import { ImageIcon } from "lucide-react"
import type { FeatureDetailData } from "./feature-detail-dialog"

export const wallpaperFeature: FeatureDetailData = {
  title: "壁纸设置",
  description: "自定义应用背景壁纸、透明度和位置",
  icon: ImageIcon,
  color: "text-pink-600",
  bgColor: "bg-pink-600/10",
  technologies: [
    {
      name: "localStorage",
      description: "本地存储壁纸设置，持久化用户偏好",
      type: "api"
    },
    {
      name: "FileReader API",
      description: "读取本地图片文件转为 Base64",
      type: "api"
    },
    {
      name: "CustomEvent",
      description: "跨组件通信，实时更新壁纸显示",
      type: "pattern"
    },
    {
      name: "CSS backdrop-filter",
      description: "背景模糊效果，提升内容可读性",
      type: "pattern"
    },
    {
      name: "Radix Slider",
      description: "透明度和位置调节滑块组件",
      type: "library"
    },
    {
      name: "拖拽交互",
      description: "预览区域支持拖拽调整壁纸位置",
      type: "pattern"
    }
  ],
  coreFiles: [
    {
      path: "src/components/settings/wallpaper-settings.tsx",
      description: "壁纸设置组件，包含上传、预览、调节功能"
    },
    {
      path: "src/components/wallpaper-background.tsx",
      description: "全局壁纸背景组件，渲染在 layout 中"
    },
    {
      path: "src/components/ui/slider.tsx",
      description: "Radix Slider 封装组件"
    },
    {
      path: "src/app/layout.tsx",
      description: "根布局，集成壁纸背景组件"
    },
    {
      path: "src/app/settings/page.tsx",
      description: "设置页面，包含壁纸设置入口"
    }
  ],
  workflow: [
    "用户在设置页面打开壁纸设置",
    "选择上传本地图片或输入图片 URL",
    "图片通过 FileReader 转为 Base64 存储",
    "预览区域实时显示壁纸效果",
    "拖拽预览区域调整壁纸位置",
    "使用滑块调节透明度（5%-50%）",
    "使用滑块调节缩放比例（50%-200%）",
    "设置保存到 localStorage",
    "触发 CustomEvent 通知全局背景组件",
    "WallpaperBackground 组件接收事件并更新显示"
  ],
  codeSnippets: [
    {
      title: "壁纸设置状态管理",
      language: "typescript",
      description: "壁纸设置的数据结构和持久化",
      code: `interface WallpaperSettings {
  imageUrl: string | null
  opacity: number        // 0.05 - 0.5
  position: { x: number; y: number }  // 0-100%
  scale: number          // 50 - 200%
}

const DEFAULT_SETTINGS: WallpaperSettings = {
  imageUrl: null,
  opacity: 0.15,
  position: { x: 50, y: 50 },
  scale: 100,
}

// 保存设置
const saveSettings = (newSettings: WallpaperSettings) => {
  setSettings(newSettings)
  localStorage.setItem("wallpaper-settings", JSON.stringify(newSettings))
  // 通知全局背景组件更新
  window.dispatchEvent(
    new CustomEvent("wallpaper-changed", { detail: newSettings })
  )
}`
    },
    {
      title: "图片上传处理",
      language: "typescript",
      description: "本地图片转 Base64 存储",
      code: `const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]
  if (!file) return

  // 验证文件类型
  if (!file.type.startsWith("image/")) {
    toast.error("请选择图片文件")
    return
  }

  // 限制文件大小 5MB
  if (file.size > 5 * 1024 * 1024) {
    toast.error("图片大小不能超过 5MB")
    return
  }

  // 读取为 Base64
  const reader = new FileReader()
  reader.onload = (event) => {
    const dataUrl = event.target?.result as string
    setPreviewUrl(dataUrl)
    saveSettings({ ...settings, imageUrl: dataUrl })
    toast.success("壁纸已设置")
  }
  reader.readAsDataURL(file)
}`
    },
    {
      title: "拖拽调整位置",
      language: "typescript",
      description: "预览区域拖拽交互实现",
      code: `const handlePreviewDrag = (e: React.MouseEvent<HTMLDivElement>) => {
  if (!isDragging || !previewRef.current) return
  
  const rect = previewRef.current.getBoundingClientRect()
  // 计算鼠标在预览区域的相对位置
  const x = ((e.clientX - rect.left) / rect.width) * 100
  const y = ((e.clientY - rect.top) / rect.height) * 100
  
  saveSettings({
    ...settings,
    position: {
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    },
  })
}

// 预览区域
<div
  ref={previewRef}
  className="relative h-48 border-2 border-dashed rounded-lg cursor-crosshair"
  onMouseDown={() => previewUrl && setIsDragging(true)}
  onMouseUp={() => setIsDragging(false)}
  onMouseLeave={() => setIsDragging(false)}
  onMouseMove={handlePreviewDrag}
>
  {/* 壁纸预览 */}
</div>`
    },
    {
      title: "全局壁纸背景组件",
      language: "typescript",
      description: "渲染在 layout 中的背景层",
      code: `"use client"

import { useState, useEffect } from "react"

export function WallpaperBackground() {
  const [settings, setSettings] = useState<WallpaperSettings | null>(null)

  useEffect(() => {
    // 初始加载
    const saved = localStorage.getItem("wallpaper-settings")
    if (saved) {
      setSettings(JSON.parse(saved))
    }

    // 监听设置变化
    const handleChange = (e: CustomEvent<WallpaperSettings>) => {
      setSettings(e.detail)
    }

    window.addEventListener("wallpaper-changed", handleChange)
    return () => window.removeEventListener("wallpaper-changed", handleChange)
  }, [])

  if (!settings?.imageUrl) return null

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0"
      style={{
        backgroundImage: \`url(\${settings.imageUrl})\`,
        backgroundPosition: \`\${settings.position.x}% \${settings.position.y}%\`,
        backgroundSize: \`\${settings.scale}%\`,
        opacity: settings.opacity,
      }}
      aria-hidden="true"
    />
  )
}`
    }
  ],
  keyFunctions: [
    "FileReader.readAsDataURL()",
    "localStorage.setItem()",
    "CustomEvent",
    "window.dispatchEvent()",
    "addEventListener()",
    "backgroundPosition",
    "backgroundSize"
  ]
}
