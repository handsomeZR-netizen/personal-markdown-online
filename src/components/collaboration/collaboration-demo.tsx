'use client';

/**
 * Collaboration Demo Component
 * Demonstrates CollaborationCursor extension with multiple users
 * This component is for testing and demonstration purposes
 */

import { useMemo } from 'react';
import { CollaborativeTiptapEditor } from '@/components/editor/collaborative-tiptap-editor';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface CollaborationDemoProps {
  noteId: string;
  userId: string;
  userName: string;
  userEmail?: string;
  userAvatar?: string;
}

/**
 * Demo component showing collaborative editing with cursors
 * Note: This component relies on CollaborativeTiptapEditor's internal collaboration
 * to avoid duplicate WebSocket connections
 */
export function CollaborationDemo({
  noteId,
  userId,
  userName,
}: CollaborationDemoProps) {
  // Generate a stable random color for this user (memoized to prevent changes on re-render)
  const userColor = useMemo(
    () => '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'),
    []
  );

  return (
    <div className="space-y-4">
      {/* Editor - this component manages its own collaboration state */}
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
    </div>
  );
}
