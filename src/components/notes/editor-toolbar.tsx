"use client"

import { Button } from "@/components/ui/button"
import { 
  Bold, 
  Italic, 
  Strikethrough,
  Heading1, 
  Heading2, 
  Heading3,
  List, 
  ListOrdered, 
  ListChecks,
  Link as LinkIcon,
  Code,
  FileCode2,
  Quote,
  Minus,
  Image,
  Table
} from "lucide-react"
import { t } from "@/lib/i18n"

interface EditorToolbarProps {
  onInsert: (before: string, after?: string) => void
}

export function EditorToolbar({ onInsert }: EditorToolbarProps) {
  const tools = [
    { icon: Bold, label: t('editor.bold'), action: () => onInsert('**', '**') },
    { icon: Italic, label: t('editor.italic'), action: () => onInsert('*', '*') },
    { icon: Strikethrough, label: '删除线', action: () => onInsert('~~', '~~') },
    { icon: Heading1, label: t('editor.heading') + ' 1', action: () => onInsert('# ') },
    { icon: Heading2, label: t('editor.heading') + ' 2', action: () => onInsert('## ') },
    { icon: Heading3, label: t('editor.heading') + ' 3', action: () => onInsert('### ') },
    { icon: List, label: t('editor.unorderedList'), action: () => onInsert('- ') },
    { icon: ListOrdered, label: t('editor.orderedList'), action: () => onInsert('1. ') },
    { icon: ListChecks, label: '任务列表', action: () => onInsert('- [ ] ') },
    { icon: LinkIcon, label: t('editor.link'), action: () => onInsert('[', '](url)') },
    { icon: Image, label: '图片', action: () => onInsert('![alt](', ')') },
    { icon: Code, label: t('editor.code'), action: () => onInsert('`', '`') },
    { icon: FileCode2, label: '代码块', action: () => onInsert('```\n', '\n```') },
    { icon: Quote, label: t('editor.quote'), action: () => onInsert('> ') },
    { icon: Minus, label: '分隔线', action: () => onInsert('\n---\n') },
    { icon: Table, label: '表格', action: () => onInsert('| 列1 | 列2 | 列3 |\n| --- | --- | --- |\n| ', ' |  |  |') },
  ]

  return (
    <div className="flex items-center gap-1 p-1.5 border rounded-md bg-muted/30">
      {tools.map((tool, index) => (
        <Button
          key={index}
          type="button"
          variant="ghost"
          size="sm"
          onClick={tool.action}
          title={tool.label}
          className="h-7 w-7 p-0"
        >
          <tool.icon className="h-4 w-4" />
          <span className="sr-only">{tool.label}</span>
        </Button>
      ))}
    </div>
  )
}
