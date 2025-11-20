"use client"

import { Button } from "@/components/ui/button"
import { 
  Bold, 
  Italic, 
  Heading1, 
  Heading2, 
  Heading3,
  List, 
  ListOrdered, 
  Link as LinkIcon,
  Code,
  Quote
} from "lucide-react"
import { t } from "@/lib/i18n"

interface EditorToolbarProps {
  onInsert: (before: string, after?: string) => void
}

export function EditorToolbar({ onInsert }: EditorToolbarProps) {
  const tools = [
    {
      icon: Bold,
      label: t('editor.bold'),
      action: () => onInsert('**', '**'),
    },
    {
      icon: Italic,
      label: t('editor.italic'),
      action: () => onInsert('*', '*'),
    },
    {
      icon: Heading1,
      label: t('editor.heading') + ' 1',
      action: () => onInsert('# '),
    },
    {
      icon: Heading2,
      label: t('editor.heading') + ' 2',
      action: () => onInsert('## '),
    },
    {
      icon: Heading3,
      label: t('editor.heading') + ' 3',
      action: () => onInsert('### '),
    },
    {
      icon: List,
      label: t('editor.unorderedList'),
      action: () => onInsert('- '),
    },
    {
      icon: ListOrdered,
      label: t('editor.orderedList'),
      action: () => onInsert('1. '),
    },
    {
      icon: LinkIcon,
      label: t('editor.link'),
      action: () => onInsert('[', '](url)'),
    },
    {
      icon: Code,
      label: t('editor.code'),
      action: () => onInsert('`', '`'),
    },
    {
      icon: Quote,
      label: t('editor.quote'),
      action: () => onInsert('> '),
    },
  ]

  return (
    <div className="flex flex-wrap gap-1 p-2 border rounded-md bg-muted/30">
      {tools.map((tool, index) => (
        <Button
          key={index}
          type="button"
          variant="ghost"
          size="sm"
          onClick={tool.action}
          title={tool.label}
          className="h-8 w-8 p-0"
        >
          <tool.icon className="h-4 w-4" />
          <span className="sr-only">{tool.label}</span>
        </Button>
      ))}
    </div>
  )
}
