"use client"

import { useState, useCallback, useRef } from "react"
import { Upload, Loader2, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { uploadImage } from "@/lib/storage/image-upload"

interface ImageUploadZoneProps {
  noteId?: string
  onImageInsert: (url: string) => void
  className?: string
  children?: React.ReactNode
}

export function ImageUploadZone({ noteId, onImageInsert, className, children }: ImageUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const dragCounter = useRef(0)

  const handleUpload = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files)
    const imageFiles = fileArray.filter(file => file.type.startsWith('image/'))

    if (imageFiles.length === 0) {
      toast.error('请选择图片文件')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i]
        
        // 显示上传进度
        setUploadProgress(Math.round(((i + 0.5) / imageFiles.length) * 100))
        
        // 上传图片
        const result = await uploadImage(file, noteId || 'temp')
        
        // 插入图片到编辑器
        onImageInsert(result.url)
        
        setUploadProgress(Math.round(((i + 1) / imageFiles.length) * 100))
      }

      toast.success(`成功上传 ${imageFiles.length} 张图片`)
    } catch (error) {
      console.error('图片上传失败:', error)
      toast.error('图片上传失败，请重试')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }, [noteId, onImageInsert])

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current++
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true)
    }
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current--
    if (dragCounter.current === 0) {
      setIsDragging(false)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    dragCounter.current = 0

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      handleUpload(files)
    }
  }, [handleUpload])

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return

    const files: File[] = []
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile()
        if (file) files.push(file)
      }
    }

    if (files.length > 0) {
      e.preventDefault()
      handleUpload(files)
    }
  }, [handleUpload])

  return (
    <div
      className={cn(
        "relative rounded-lg transition-all duration-200",
        isDragging && "ring-2 ring-primary ring-offset-2",
        className
      )}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onPaste={handlePaste}
    >
      {children}
      
      {isDragging && (
        <div className="absolute inset-0 flex items-center justify-center bg-primary/10 rounded-lg z-50 pointer-events-none">
          <div className="text-center">
            <Upload className="h-12 w-12 text-primary mx-auto mb-2" />
            <p className="text-sm font-medium text-primary">释放以上传图片</p>
          </div>
        </div>
      )}

      {isUploading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg z-50">
          <div className="text-center space-y-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-sm font-medium">上传中... {uploadProgress}%</p>
            <div className="w-48 h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
