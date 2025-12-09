'use client';

import React from 'react';
import { Edit3, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface EditingIndicatorProps {
  isEditing: boolean;
  editorNames?: string[];
  className?: string;
  showLabel?: boolean;
}

/**
 * EditingIndicator shows whether collaborators are actively editing a note
 * Displays in the sidebar next to note titles
 */
export function EditingIndicator({
  isEditing,
  editorNames = [],
  className,
  showLabel = false,
}: EditingIndicatorProps) {
  if (!isEditing && editorNames.length === 0) {
    return null;
  }

  const Icon = isEditing ? Edit3 : Eye;
  const label = isEditing ? '正在编辑' : '查看中';
  const colorClass = isEditing
    ? 'text-green-500 dark:text-green-400'
    : 'text-blue-500 dark:text-blue-400';

  const content = (
    <div className={cn('flex items-center gap-1', className)}>
      <Icon className={cn('h-3.5 w-3.5', colorClass)} />
      {showLabel && (
        <span className={cn('text-xs font-medium', colorClass)}>{label}</span>
      )}
    </div>
  );

  // If we have editor names, show them in a tooltip
  if (editorNames.length > 0) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="cursor-help">{content}</div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p className="font-medium text-xs">{label}</p>
              <div className="space-y-0.5">
                {editorNames.map((name, index) => (
                  <p key={index} className="text-xs text-muted-foreground">
                    {name}
                  </p>
                ))}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
}

/**
 * Animated pulse indicator for active editing
 */
export function EditingPulse({ className }: { className?: string }) {
  return (
    <span className={cn('relative flex h-2 w-2', className)}>
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
    </span>
  );
}

/**
 * Hook to track if a note is being edited by collaborators
 * This would typically connect to the presence manager
 */
export function useNoteEditingStatus(noteId: string) {
  // This is a placeholder - in a real implementation, this would:
  // 1. Connect to the presence manager for this note
  // 2. Check if any collaborators have active cursors
  // 3. Return the editing status and list of editors
  
  const [isEditing, setIsEditing] = React.useState(false);
  const [editors, setEditors] = React.useState<string[]>([]);

  // TODO: Implement actual presence tracking
  // This would subscribe to awareness changes for the specific note
  
  return {
    isEditing,
    editors,
  };
}
