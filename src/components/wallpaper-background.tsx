"use client"

import { useState, useEffect } from "react"

interface WallpaperSettings {
  imageUrl: string | null
  opacity: number
  position: { x: number; y: number }
  scale: number
}

export function WallpaperBackground() {
  const [settings, setSettings] = useState<WallpaperSettings | null>(null)

  useEffect(() => {
    // 初始加载
    const saved = localStorage.getItem("wallpaper-settings")
    if (saved) {
      try {
        setSettings(JSON.parse(saved))
      } catch (e) {
        console.error("Failed to parse wallpaper settings:", e)
      }
    }

    // 监听设置变化
    const handleChange = (e: CustomEvent<WallpaperSettings>) => {
      setSettings(e.detail)
    }

    window.addEventListener("wallpaper-changed" as any, handleChange)
    return () => window.removeEventListener("wallpaper-changed" as any, handleChange)
  }, [])

  if (!settings?.imageUrl) return null

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 bg-cover bg-no-repeat transition-all duration-300"
      style={{
        backgroundImage: `url(${settings.imageUrl})`,
        backgroundPosition: `${settings.position.x}% ${settings.position.y}%`,
        backgroundSize: `${settings.scale}%`,
        opacity: settings.opacity,
      }}
      aria-hidden="true"
    />
  )
}
