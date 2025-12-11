"use client";

/**
 * Complete Tiptap Editor with Toolbar and Image Lightbox
 * Integrates all image upload and viewing features
 */

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { EditorToolbar } from './editor-toolbar';
import { ImageLightbox } from './image-lightbox';
import { useImageLightbox } from '@/hooks/use-image-lightbox';

interface TiptapEditorWithToolbarProps {
  noteId: string;
  initialContent?: string;
  onSave?: (content: string) => void;
  readOnly?: boolean;
  placeholder?: string;
  className?: string;
}

export function TiptapEditorWithToolbar({
  noteId,
  initialContent = '',
  onSave,
  readOnly = false,
  placeholder = '开始输入...',
  className = '',
}: TiptapEditorWithToolbarProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const { isOpen, images, currentIndex, openLightbox, closeLightbox } = useImageLightbox();

  // Custom image upload handler
  const handleImageUpload = useCallback(
    async (file: File): Promise<string> => {
      setIsUploading(true);
      setUploadProgress('上传中...');

      try {
        // Validate file size (10MB)
        if (file.size > 10 * 1024 * 1024) {
          throw new Error('图片大小不能超过 10MB');
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
          throw new Error('只支持图片文件');
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('noteId', noteId);

        const response = await fetch('/api/images/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || '上传失败');
        }

        const result = await response.json();
        
        if (!result.success || !result.data?.url) {
          throw new Error('上传失败：未返回图片URL');
        }

        setUploadProgress('上传成功');
        toast.success('图片上传成功');
        
        return result.data.url;
      } catch (error) {
        console.error('Image upload error:', error);
        const errorMessage = error instanceof Error ? error.message : '上传图片失败';
        toast.error(errorMessage);
        throw error;
      } finally {
        setIsUploading(false);
        setTimeout(() => setUploadProgress(''), 2000);
      }
    },
    [noteId]
  );

  // Handle multiple image uploads
  const handleMultipleImageUploads = useCallback(
    async (files: File[]) => {
      setIsUploading(true);
      setUploadProgress(`上传 ${files.length} 张图片...`);

      try {
        const formData = new FormData();
        files.forEach((file) => formData.append('files', file));
        formData.append('noteId', noteId);

        const response = await fetch('/api/images/upload', {
          method: 'PUT',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || '上传失败');
        }

        const result = await response.json();
        
        if (!result.success || !result.data) {
          throw new Error('上传失败：未返回图片URL');
        }

        setUploadProgress('上传成功');
        toast.success(`成功上传 ${files.length} 张图片`);
        
        return result.data.map((item: { url: string }) => item.url);
      } catch (error) {
        console.error('Multiple image upload error:', error);
        const errorMessage = error instanceof Error ? error.message : '上传图片失败';
        toast.error(errorMessage);
        throw error;
      } finally {
        setIsUploading(false);
        setTimeout(() => setUploadProgress(''), 2000);
      }
    },
    [noteId]
  );

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        inline: true,
        allowBase64: false,
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: initialContent,
    editable: !readOnly,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none min-h-[500px] p-4 max-w-none',
      },
      // Handle paste events for images
      handlePaste: (view, event) => {
        const items = Array.from(event.clipboardData?.items || []);
        const imageItems = items.filter((item) => item.type.startsWith('image/'));

        if (imageItems.length > 0) {
          event.preventDefault();

          imageItems.forEach((item) => {
            const file = item.getAsFile();
            if (file) {
              handleImageUpload(file)
                .then((url) => {
                  editor?.chain().focus().setImage({ src: url }).run();
                })
                .catch((error) => {
                  console.error('Failed to upload pasted image:', error);
                });
            }
          });

          return true;
        }

        return false;
      },
      // Handle drop events for images
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer?.files) {
          const files = Array.from(event.dataTransfer.files);
          const imageFiles = files.filter((file) => file.type.startsWith('image/'));

          if (imageFiles.length > 0) {
            event.preventDefault();

            if (imageFiles.length === 1) {
              handleImageUpload(imageFiles[0])
                .then((url) => {
                  const { schema } = view.state;
                  const coordinates = view.posAtCoords({
                    left: event.clientX,
                    top: event.clientY,
                  });

                  if (coordinates) {
                    const node = schema.nodes.image.create({ src: url });
                    const transaction = view.state.tr.insert(coordinates.pos, node);
                    view.dispatch(transaction);
                  }
                })
                .catch((error) => {
                  console.error('Failed to upload dropped image:', error);
                });
            } else {
              handleMultipleImageUploads(imageFiles)
                .then((urls) => {
                  const { schema } = view.state;
                  const coordinates = view.posAtCoords({
                    left: event.clientX,
                    top: event.clientY,
                  });

                  if (coordinates) {
                    let pos = coordinates.pos;
                    urls.forEach((url: string) => {
                      const node = schema.nodes.image.create({ src: url });
                      const transaction = view.state.tr.insert(pos, node);
                      view.dispatch(transaction);
                      pos += node.nodeSize;
                    });
                  }
                })
                .catch((error) => {
                  console.error('Failed to upload dropped images:', error);
                });
            }

            return true;
          }
        }

        return false;
      },
      // Handle image clicks for lightbox
      handleClickOn: (view, pos, node, nodePos, event) => {
        if (node.type.name === 'image') {
          event.preventDefault();
          
          // Get all images in the document
          const images: string[] = [];
          view.state.doc.descendants((node) => {
            if (node.type.name === 'image') {
              images.push(node.attrs.src);
            }
          });
          
          // Find the index of the clicked image
          const clickedIndex = images.indexOf(node.attrs.src);
          
          if (clickedIndex !== -1) {
            openLightbox(images, clickedIndex);
          }
          
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      if (onSave) {
        onSave(editor.getHTML());
      }
    },
  });

  return (
    <>
      <div className={`relative border rounded-lg overflow-hidden bg-background ${className}`}>
        {/* Upload progress indicator */}
        {isUploading && (
          <div className="absolute top-2 right-2 z-10 flex items-center gap-2 bg-background/90 backdrop-blur-sm px-3 py-2 rounded-md shadow-md">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">{uploadProgress}</span>
          </div>
        )}

        {/* Toolbar */}
        {!readOnly && (
          <EditorToolbar editor={editor} onImageUpload={handleImageUpload} />
        )}

        {/* Editor content */}
        <div
          className="relative"
          onDragOver={(e) => {
            e.preventDefault();
            e.currentTarget.classList.add('bg-primary/5');
          }}
          onDragLeave={(e) => {
            e.currentTarget.classList.remove('bg-primary/5');
          }}
          onDrop={(e) => {
            e.currentTarget.classList.remove('bg-primary/5');
          }}
        >
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Image lightbox */}
      <ImageLightbox
        images={images}
        initialIndex={currentIndex}
        isOpen={isOpen}
        onClose={closeLightbox}
      />
    </>
  );
}
