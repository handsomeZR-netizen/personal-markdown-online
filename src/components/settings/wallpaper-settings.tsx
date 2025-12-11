"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { ImageIcon, Upload, Trash2, RotateCcw, Move } from "lucide-react"
import { cn } from "@/lib/utils"

interface WallpaperSettings {
  imageUrl: string | null
  opacity: number
  position: { x: number; y: number }
  scale: number
}

const DEFAULT_SETTINGS: WallpaperSettings = {
  imageUrl: null,
  opacity: 0.15,
  position: { x: 50, y: 50 },
  scale: 100,
}

export function WallpaperSettingsComponent() {
  const [settings, setSettings] = useState<WallpaperSettings>(DEFAULT_SETTINGS)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem("wallpaper-settings")
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setSettings(parsed)
        setPreviewUrl(parsed.imageUrl)
      } catch (e) {
        console.error("Failed to parse wallpaper settings:", e)
      }
    }
  }, [])

  const saveSettings = (newSettings: WallpaperSettings) => {
    setSettings(newSettings)
    localStorage.setItem("wallpaper-settings", JSON.stringify(newSettings))
    window.dispatchEvent(new CustomEvent("wallpaper-changed", { detail: newSettings }))
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("请选择图片文件")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("图片大小不能超过 5MB")
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      setPreviewUrl(dataUrl)
      saveSettings({ ...settings, imageUrl: dataUrl })
      toast.success("壁纸已设置")
    }
    reader.readAsDataURL(file)
  }


  const handleUrlInput = (url: string) => {
    if (!url) {
      setPreviewUrl(null)
      saveSettings({ ...settings, imageUrl: null })
      return
    }
    setPreviewUrl(url)
    saveSettings({ ...settings, imageUrl: url })
    toast.success("壁纸已设置")
  }

  const handleOpacityChange = (value: number[]) => {
    saveSettings({ ...settings, opacity: value[0] })
  }

  const handleScaleChange = (value: number[]) => {
    saveSettings({ ...settings, scale: value[0] })
  }

  const handlePositionChange = (axis: "x" | "y", value: number[]) => {
    saveSettings({
      ...settings,
      position: { ...settings.position, [axis]: value[0] },
    })
  }

  const handlePreviewDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !previewRef.current) return
    
    const rect = previewRef.current.getBoundingClientRect()
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

  const handleClear = () => {
    setPreviewUrl(null)
    saveSettings(DEFAULT_SETTINGS)
    if (fileInputRef.current) fileInputRef.current.value = ""
    toast.success("壁纸已清除")
  }

  const handleReset = () => {
    saveSettings({ ...settings, position: { x: 50, y: 50 }, scale: 100 })
    toast.success("位置已重置")
  }

  return (
    <div className="space-y-6 py-4">
      {/* 上传区域 */}
      <div className="space-y-3">
        <Label>选择壁纸</Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1"
          >
            <Upload className="h-4 w-4 mr-2" />
            上传图片
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          {previewUrl && (
            <Button type="button" variant="destructive" size="icon" onClick={handleClear}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="或输入图片 URL..."
            onBlur={(e) => handleUrlInput(e.target.value)}
            defaultValue={settings.imageUrl?.startsWith("http") ? settings.imageUrl : ""}
          />
        </div>
      </div>

      {/* 预览区域 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>预览 (拖拽调整位置)</Label>
          {previewUrl && (
            <Button type="button" variant="ghost" size="sm" onClick={handleReset}>
              <RotateCcw className="h-3 w-3 mr-1" />
              重置位置
            </Button>
          )}
        </div>
        <div
          ref={previewRef}
          className={cn(
            "relative h-48 border-2 border-dashed rounded-lg overflow-hidden cursor-crosshair transition-colors",
            isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25",
            !previewUrl && "flex items-center justify-center"
          )}
          onMouseDown={() => previewUrl && setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
          onMouseMove={handlePreviewDrag}
        >
          {previewUrl ? (
            <>
              <div
                className="absolute inset-0 bg-cover bg-no-repeat transition-all duration-150"
                style={{
                  backgroundImage: `url(${previewUrl})`,
                  backgroundPosition: `${settings.position.x}% ${settings.position.y}%`,
                  backgroundSize: `${settings.scale}%`,
                  opacity: settings.opacity,
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-background/80 backdrop-blur-sm rounded-lg p-4 text-center">
                  <Move className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">拖拽调整位置</p>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center text-muted-foreground">
              <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">暂无壁纸</p>
            </div>
          )}
        </div>
      </div>


      {/* 透明度调节 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>透明度</Label>
          <span className="text-sm text-muted-foreground">{Math.round(settings.opacity * 100)}%</span>
        </div>
        <Slider
          value={[settings.opacity]}
          onValueChange={handleOpacityChange}
          min={0.05}
          max={0.5}
          step={0.01}
          disabled={!previewUrl}
        />
      </div>

      {/* 缩放调节 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>缩放</Label>
          <span className="text-sm text-muted-foreground">{settings.scale}%</span>
        </div>
        <Slider
          value={[settings.scale]}
          onValueChange={handleScaleChange}
          min={50}
          max={200}
          step={5}
          disabled={!previewUrl}
        />
      </div>

      {/* 位置调节 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>水平位置</Label>
            <span className="text-sm text-muted-foreground">{Math.round(settings.position.x)}%</span>
          </div>
          <Slider
            value={[settings.position.x]}
            onValueChange={(v) => handlePositionChange("x", v)}
            min={0}
            max={100}
            step={1}
            disabled={!previewUrl}
          />
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>垂直位置</Label>
            <span className="text-sm text-muted-foreground">{Math.round(settings.position.y)}%</span>
          </div>
          <Slider
            value={[settings.position.y]}
            onValueChange={(v) => handlePositionChange("y", v)}
            min={0}
            max={100}
            step={1}
            disabled={!previewUrl}
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        提示：壁纸将应用到整个应用背景。建议使用浅色或低对比度的图片以保证内容可读性。
      </p>
    </div>
  )
}
