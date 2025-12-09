/**
 * PublicShareControls component for managing public note sharing
 * Allows enabling/disabling public access and copying public links
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, Copy, Loader2, Check, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface PublicShareControlsProps {
  noteId: string;
  isOwner: boolean;
}

interface PublicShareStatus {
  isPublic: boolean;
  publicSlug: string | null;
  publicUrl: string | null;
}

export function PublicShareControls({ noteId, isOwner }: PublicShareControlsProps) {
  const [status, setStatus] = useState<PublicShareStatus>({
    isPublic: false,
    publicSlug: null,
    publicUrl: null,
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadStatus();
  }, [noteId]);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/notes/${noteId}/share`);
      
      if (!response.ok) {
        throw new Error('Failed to load sharing status');
      }

      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Error loading sharing status:', error);
      toast.error('无法加载分享状态');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublicSharing = async (enabled: boolean) => {
    if (!isOwner) {
      toast.error('只有笔记所有者可以管理公开分享');
      return;
    }

    try {
      setUpdating(true);

      if (enabled) {
        // Enable public sharing
        const response = await fetch(`/api/notes/${noteId}/share`, {
          method: 'POST',
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to enable public sharing');
        }

        const data = await response.json();
        setStatus(data);
        toast.success('公开分享已启用');
      } else {
        // Disable public sharing
        const response = await fetch(`/api/notes/${noteId}/share`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to disable public sharing');
        }

        const data = await response.json();
        setStatus(data);
        toast.success('公开分享已禁用');
      }
    } catch (error) {
      console.error('Error toggling public sharing:', error);
      toast.error(error instanceof Error ? error.message : '操作失败');
      // Revert the switch
      await loadStatus();
    } finally {
      setUpdating(false);
    }
  };

  const handleCopyLink = async () => {
    if (!status.publicUrl) return;

    try {
      await navigator.clipboard.writeText(status.publicUrl);
      setCopied(true);
      toast.success('链接已复制到剪贴板');
      
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Error copying link:', error);
      toast.error('复制失败');
    }
  };

  const handleOpenPublicLink = () => {
    if (!status.publicUrl) return;
    window.open(status.publicUrl, '_blank');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            <CardTitle>公开分享</CardTitle>
          </div>
          {isOwner && (
            <Switch
              checked={status.isPublic}
              onCheckedChange={handleTogglePublicSharing}
              disabled={updating}
            />
          )}
        </div>
        <CardDescription>
          {status.isPublic
            ? '任何人都可以通过链接查看这篇笔记'
            : '只有协作者可以访问这篇笔记'}
        </CardDescription>
      </CardHeader>

      {status.isPublic && status.publicUrl && (
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="public-url">公开链接</Label>
            <div className="flex gap-2">
              <Input
                id="public-url"
                value={status.publicUrl}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyLink}
                disabled={copied}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleOpenPublicLink}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="text-sm text-muted-foreground space-y-1">
            <p>• 访客可以查看笔记内容，但无法编辑</p>
            <p>• 笔记中的图片对所有人可见</p>
            <p>• 您可以随时禁用公开分享</p>
          </div>
        </CardContent>
      )}

      {!isOwner && (
        <CardContent>
          <p className="text-sm text-muted-foreground">
            只有笔记所有者可以管理公开分享设置
          </p>
        </CardContent>
      )}
    </Card>
  );
}
