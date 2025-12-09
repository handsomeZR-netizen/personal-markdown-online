'use client';

/**
 * Collaboration Demo Component
 * Demonstrates CollaborationCursor extension with multiple users
 * This component is for testing and demonstration purposes
 */

import React, { useEffect, useState } from 'react';
import { CollaborativeTiptapEditor } from '@/components/editor/collaborative-tiptap-editor';
import { PresenceAvatars } from './presence-avatars';
import { useCollaboration } from '@/hooks/use-collaboration';
import { PresenceManager } from '@/lib/collaboration/presence-manager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface CollaborationDemoProps {
  noteId: string;
  userId: string;
  userName: string;
  userEmail?: string;
  userAvatar?: string;
}

/**
 * Demo component showing collaborative editing with cursors
 */
export function CollaborationDemo({
  noteId,
  userId,
  userName,
  userEmail,
  userAvatar,
}: CollaborationDemoProps) {
  const [presenceManager, setPresenceManager] = useState<PresenceManager | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);

  // Generate a random color for this user
  const userColor = React.useMemo(
    () => '#' + Math.floor(Math.random() * 16777215).toString(16),
    []
  );

  // Initialize collaboration
  const {
    awareness,
    status,
    isSynced,
    isReady,
  } = useCollaboration({
    noteId,
    userId,
    userName,
    userColor,
    enabled: true,
  });

  // Initialize presence manager when awareness is ready
  useEffect(() => {
    if (!awareness || !isReady) {
      return;
    }

    const manager = new PresenceManager(awareness, userId);
    
    // Set local user info
    manager.setLocalUser({
      id: userId,
      name: userName,
      email: userEmail,
      avatar: userAvatar,
      color: userColor,
      cursor: null,
    });

    setPresenceManager(manager);

    // Listen to user changes
    const unsubscribe = manager.onUsersChange((users) => {
      setOnlineUsers(users);
    });

    return () => {
      unsubscribe();
      manager.destroy();
    };
  }, [awareness, isReady, userId, userName, userEmail, userAvatar, userColor]);

  return (
    <div className="space-y-4">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>协作状态</span>
            <Badge variant={status === 'connected' ? 'default' : 'secondary'}>
              {status === 'connected' ? '已连接' : status === 'connecting' ? '连接中' : '离线'}
            </Badge>
          </CardTitle>
          <CardDescription>
            实时协作编辑 - {isSynced ? '已同步' : '同步中...'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">在线用户</span>
              <span className="text-sm font-medium">{onlineUsers.length + 1}</span>
            </div>
            
            {/* Presence Avatars */}
            {onlineUsers.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">协作者:</span>
                <PresenceAvatars users={onlineUsers} maxVisible={5} />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Editor */}
      <Card>
        <CardHeader>
          <CardTitle>协作编辑器</CardTitle>
          <CardDescription>
            多人可以同时编辑此文档，您可以看到其他用户的光标位置
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CollaborativeTiptapEditor
            noteId={noteId}
            userId={userId}
            userName={userName}
            userColor={userColor}
            enableCollaboration={true}
            placeholder="开始输入以测试协作功能..."
          />
        </CardContent>
      </Card>

      {/* User List */}
      {onlineUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>在线用户详情</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {onlineUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-2 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium"
                      style={{ backgroundColor: user.color }}
                    >
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{user.name}</p>
                      {user.email && (
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      )}
                    </div>
                  </div>
                  <Badge variant={user.cursor ? 'default' : 'secondary'}>
                    {user.cursor ? '正在编辑' : '查看中'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
