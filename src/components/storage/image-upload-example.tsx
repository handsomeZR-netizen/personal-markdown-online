/**
 * Example component demonstrating image upload functionality
 * This can be used as a reference for implementing image upload in the editor
 */

'use client';

import { useState } from 'react';
import { uploadImage, uploadImages } from '@/lib/storage/image-upload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface ImageUploadExampleProps {
  noteId: string;
  onImageUploaded?: (url: string) => void;
}

export function ImageUploadExample({ noteId, onImageUploaded }: ImageUploadExampleProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      if (files.length === 1) {
        // Single file upload
        const result = await uploadImage(files[0], noteId);
        setUploadedImages((prev) => [...prev, result.url]);
        onImageUploaded?.(result.url);
        toast.success('图片上传成功！');
      } else {
        // Multiple files upload
        const results = await uploadImages(Array.from(files), noteId);
        const urls = results.map((r) => r.url);
        setUploadedImages((prev) => [...prev, ...urls]);
        urls.forEach((url) => onImageUploaded?.(url));
        toast.success(`成功上传 ${results.length} 张图片！`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : '上传失败');
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const imageFiles: File[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) imageFiles.push(file);
      }
    }

    if (imageFiles.length === 0) return;

    e.preventDefault();
    setUploading(true);

    try {
      const results = await uploadImages(imageFiles, noteId);
      const urls = results.map((r) => r.url);
      setUploadedImages((prev) => [...prev, ...urls]);
      urls.forEach((url) => onImageUploaded?.(url));
      toast.success(`粘贴上传 ${results.length} 张图片成功！`);
    } catch (error) {
      console.error('Paste upload error:', error);
      toast.error(error instanceof Error ? error.message : '粘贴上传失败');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;

    // Filter only image files
    const imageFiles = Array.from(files).filter((file) =>
      file.type.startsWith('image/')
    );

    if (imageFiles.length === 0) {
      toast.error('请拖放图片文件');
      return;
    }

    setUploading(true);

    try {
      const results = await uploadImages(imageFiles, noteId);
      const urls = results.map((r) => r.url);
      setUploadedImages((prev) => [...prev, ...urls]);
      urls.forEach((url) => onImageUploaded?.(url));
      toast.success(`拖放上传 ${results.length} 张图片成功！`);
    } catch (error) {
      console.error('Drop upload error:', error);
      toast.error(error instanceof Error ? error.message : '拖放上传失败');
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">图片上传示例</h3>
        <p className="text-sm text-muted-foreground">
          支持三种上传方式：选择文件、粘贴图片、拖放图片
        </p>
      </div>

      {/* File input */}
      <div className="space-y-2">
        <label htmlFor="image-upload" className="text-sm font-medium">
          选择图片
        </label>
        <div className="flex gap-2">
          <Input
            id="image-upload"
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            disabled={uploading}
          />
          <Button disabled={uploading}>
            {uploading ? '上传中...' : '选择文件'}
          </Button>
        </div>
      </div>

      {/* Paste area */}
      <div className="space-y-2">
        <label className="text-sm font-medium">粘贴图片</label>
        <div
          className="border-2 border-dashed rounded-lg p-8 text-center"
          onPaste={handlePaste}
          tabIndex={0}
        >
          <p className="text-sm text-muted-foreground">
            点击此区域，然后按 Ctrl+V 粘贴图片
          </p>
        </div>
      </div>

      {/* Drop area */}
      <div className="space-y-2">
        <label className="text-sm font-medium">拖放图片</label>
        <div
          className="border-2 border-dashed rounded-lg p-8 text-center"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <p className="text-sm text-muted-foreground">
            将图片拖放到此区域
          </p>
        </div>
      </div>

      {/* Uploaded images preview */}
      {uploadedImages.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">已上传的图片</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {uploadedImages.map((url, index) => (
              <div key={index} className="relative aspect-square">
                <img
                  src={url}
                  alt={`Uploaded ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {uploading && (
        <div className="text-sm text-muted-foreground">
          正在上传图片...
        </div>
      )}
    </div>
  );
}
