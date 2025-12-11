"use client";

/**
 * Collaborative Tiptap Editor with Y.js Integration
 * Supports real-time multi-user editing with CRDT synchronization
 */

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Loader2, Wifi, WifiOff, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCollaboration } from '@/hooks/use-collaboration';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface CollaborativeTiptapEditorProps {
  noteId: string;
  userId: string;
  userName: string;
  userColor?: string;
  initialContent?: string;
  onSave?: (content: string) => void;
  readOnly?: boolean;
  placeholder?: string;
  enableCollaboration?: boolean;
}

export function CollaborativeTiptapEditor({
  noteId,
  userId,
  userName,
  userColor = '#' + Math.floor(Math.random() * 16777215).toString(16),
  initialContent = '',
  onSave,
  readOnly = false,
  placeholder = '开始输入...',
  enableCollaboration = true,
}: CollaborativeTiptapEditorProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');

  // Magic border effect state
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, []);

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);

  // Initialize collaboration
  const {
    ydoc,
    awareness,
    provider,
    status,
    isSynced,
    onlineUsers,
    updateCursor,
    isReady,
  } = useCollaboration({
    noteId,
    userId,
    userName,
    userColor,
    enabled: enableCollaboration,
    onError: (error) => {
      console.error('Collaboration error:', error);
      toast.error('协作连接失败');
    },
  });

  // Custom image upload handler
  const handleImageUpload = useCallback(
    async (file: File): Promise<string> => {
      setIsUploading(true);
      setUploadProgress('上传中...');

      try {
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
    async (files: File[]): Promise<string[]> => {
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

  // Build extensions array
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const extensions: any[] = [
    StarterKit.configure({
      // Disable history when using collaboration
      history: (!enableCollaboration || !ydoc) ? {} : false,
    }),
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
  ];

  // Add collaboration extensions if enabled and ready
  if (enableCollaboration && ydoc && awareness) {
    extensions.push(
      Collaboration.configure({
        document: ydoc,
      })
    );

    extensions.push(
      CollaborationCursor.configure({
        provider: provider as any,
        user: {
          name: userName,
          color: userColor,
        },
      })
    );
  }

  const editor = useEditor({
    extensions,
    content: !enableCollaboration ? initialContent : undefined,
    editable: !readOnly,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none min-h-[500px] p-4',
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
                    urls.forEach((url) => {
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
    },
    onUpdate: ({ editor }) => {
      if (onSave && !enableCollaboration) {
        onSave(editor.getHTML());
      }
    },
    onSelectionUpdate: ({ editor }) => {
      // Update cursor position in awareness
      if (enableCollaboration && editor) {
        const { from, to } = editor.state.selection;
        updateCursor({ anchor: from, head: to });
      }
    },
  }, [ydoc, awareness, enableCollaboration, isReady]);

  // Connection status indicator
  const getStatusIcon = () => {
    switch (status) {
      case 'connected':
        return <Wifi className="h-4 w-4 text-green-500" />;
      case 'connecting':
        return <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />;
      case 'disconnected':
      case 'error':
        return <WifiOff className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return isSynced ? '已同步' : '同步中...';
      case 'connecting':
        return '连接中...';
      case 'disconnected':
        return '已断开';
      case 'error':
        return '连接错误';
      default:
        return '离线';
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative group rounded-lg"
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Animated gradient border - subtle in light mode, prominent in dark mode */}
      <div
        className={cn(
          "absolute -inset-[1px] rounded-lg pointer-events-none transition-opacity duration-500",
          "opacity-0 group-hover:opacity-20 dark:group-hover:opacity-50",
          "bg-gradient-to-r from-violet-500 via-blue-500 to-purple-600"
        )}
      />

      {/* Mouse-following glow effect */}
      <div
        className="absolute -inset-[1px] rounded-lg pointer-events-none transition-opacity duration-300"
        style={{
          opacity: isHovered ? 0.15 : 0,
          background: `radial-gradient(400px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(139, 92, 246, 0.4), transparent 40%)`,
        }}
      />

      {/* Animated border beam - flowing gradient effect */}
      <div className="absolute -inset-[1px] rounded-lg pointer-events-none overflow-hidden">
        <div
          className={cn(
            "absolute inset-0 transition-opacity duration-500",
            "opacity-0 dark:opacity-30",
            isHovered && "opacity-10 dark:opacity-60"
          )}
          style={{
            background: `conic-gradient(from var(--border-angle, 0deg) at 50% 50%, transparent 0%, rgb(139, 92, 246) 10%, rgb(59, 130, 246) 20%, rgb(147, 51, 234) 30%, transparent 40%)`,
            animation: "border-beam 4s linear infinite",
          }}
        />
      </div>

      {/* Main editor container */}
      <div className="relative border rounded-lg overflow-hidden bg-background">
      {/* Collaboration status bar */}
      {enableCollaboration && (
        <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b">
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2">
                    {getStatusIcon()}
                    <span className="text-sm text-muted-foreground">{getStatusText()}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>协作状态: {getStatusText()}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Online users */}
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {onlineUsers.length + 1} 在线
            </span>
            
            {/* User avatars */}
            <div className="flex -space-x-2">
              {onlineUsers.slice(0, 5).map((user) => (
                <TooltipProvider key={user.clientId}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className="w-6 h-6 rounded-full border-2 border-background flex items-center justify-center text-xs font-medium text-white"
                        style={{ backgroundColor: user.user.color }}
                      >
                        {user.user.name.charAt(0).toUpperCase()}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{user.user.name}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
              {onlineUsers.length > 5 && (
                <div className="w-6 h-6 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-medium">
                  +{onlineUsers.length - 5}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upload progress indicator */}
      {isUploading && (
        <div className="absolute top-2 right-2 z-10 flex items-center gap-2 bg-background/90 backdrop-blur-sm px-3 py-2 rounded-md shadow-md">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">{uploadProgress}</span>
        </div>
      )}

      {/* Drop zone overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        onDragOver={(e) => {
          e.preventDefault();
          e.currentTarget.classList.add('bg-primary/5', 'border-primary');
        }}
        onDragLeave={(e) => {
          e.currentTarget.classList.remove('bg-primary/5', 'border-primary');
        }}
        onDrop={(e) => {
          e.currentTarget.classList.remove('bg-primary/5', 'border-primary');
        }}
      />

      <EditorContent editor={editor} />
      </div>
    </div>
  );
}
