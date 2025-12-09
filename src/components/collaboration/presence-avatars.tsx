'use client';

import React from 'react';
import { PresenceUser } from '@/lib/collaboration/presence-manager';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface PresenceAvatarsProps {
  users: PresenceUser[];
  maxVisible?: number;
  className?: string;
}

/**
 * PresenceAvatars displays online user avatars in the header
 * Shows up to maxVisible avatars, with "+N" for additional users
 * Displays tooltips with user names and status on hover
 */
export function PresenceAvatars({
  users,
  maxVisible = 5,
  className,
}: PresenceAvatarsProps) {
  const visibleUsers = users.slice(0, maxVisible);
  const remainingCount = Math.max(0, users.length - maxVisible);

  if (users.length === 0) {
    return null;
  }

  return (
    <TooltipProvider>
      <div className={cn('flex items-center -space-x-2', className)}>
        {visibleUsers.map((user) => (
          <UserAvatar key={user.id} user={user} />
        ))}
        
        {remainingCount > 0 && (
          <RemainingUsersIndicator
            count={remainingCount}
            users={users.slice(maxVisible)}
          />
        )}
      </div>
    </TooltipProvider>
  );
}

/**
 * Individual user avatar with tooltip
 */
function UserAvatar({ user }: { user: PresenceUser }) {
  const isEditing = user.cursor !== null;
  const status = isEditing ? '正在编辑' : '查看中';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            'relative inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-background ring-2 transition-all hover:z-10 hover:scale-110',
            isEditing ? 'ring-green-500' : 'ring-gray-300'
          )}
          style={{ backgroundColor: user.color }}
        >
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            <span className="text-xs font-medium text-white">
              {getInitials(user.name)}
            </span>
          )}
          
          {/* Active indicator dot */}
          {isEditing && (
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-background" />
          )}
        </div>
      </TooltipTrigger>
      
      <TooltipContent>
        <div className="text-center">
          <p className="font-medium">{user.name}</p>
          {user.email && (
            <p className="text-xs text-muted-foreground">{user.email}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">{status}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * "+N" indicator for remaining users
 */
function RemainingUsersIndicator({
  count,
  users,
}: {
  count: number;
  users: PresenceUser[];
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="relative inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted ring-2 ring-gray-300 transition-all hover:z-10 hover:scale-110 cursor-pointer">
          <span className="text-xs font-medium text-muted-foreground">
            +{count}
          </span>
        </div>
      </TooltipTrigger>
      
      <TooltipContent>
        <div className="max-w-xs">
          <p className="font-medium mb-2">其他在线用户 ({count})</p>
          <div className="space-y-1">
            {users.map((user) => (
              <div key={user.id} className="flex items-center gap-2">
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: user.color }}
                />
                <span className="text-xs">{user.name}</span>
                {user.cursor !== null && (
                  <span className="text-xs text-green-500">●</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * Get user initials from name
 */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  
  if (parts.length === 0) {
    return '?';
  }
  
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  
  // Take first letter of first and last name
  return (
    parts[0].charAt(0).toUpperCase() +
    parts[parts.length - 1].charAt(0).toUpperCase()
  );
}
