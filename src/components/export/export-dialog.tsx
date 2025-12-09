"use client";

/**
 * Export Dialog Component
 * Allows users to export notes in different formats (Markdown, PDF, HTML)
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Download, FileText, FileCode, File, Loader2 } from 'lucide-react';
import { exportManager, type NoteData } from '@/lib/export/export-manager';

interface ExportDialogProps {
  note: NoteData;
  trigger?: React.ReactNode;
}

type ExportFormat = 'markdown' | 'pdf' | 'html';

export function ExportDialog({ note, trigger }: ExportDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('markdown');
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const formats = [
    {
      id: 'markdown' as ExportFormat,
      name: 'Markdown',
      description: '纯文本格式，保留格式标记',
      icon: FileText,
      extension: 'md',
    },
    {
      id: 'pdf' as ExportFormat,
      name: 'PDF',
      description: '可打印的文档格式',
      icon: File,
      extension: 'pdf',
    },
    {
      id: 'html' as ExportFormat,
      name: 'HTML',
      description: '独立的网页文件',
      icon: FileCode,
      extension: 'html',
    },
  ];

  const handleExport = async () => {
    setIsExporting(true);
    setProgress(0);

    try {
      // Simulate progress
      setProgress(20);

      let blob: Blob;
      let extension: string;

      switch (selectedFormat) {
        case 'markdown':
          setProgress(40);
          blob = await exportManager.exportToMarkdown(note);
          extension = 'md';
          setProgress(80);
          break;
        case 'pdf':
          setProgress(30);
          blob = await exportManager.exportToPDF(note);
          extension = 'pdf';
          setProgress(80);
          break;
        case 'html':
          setProgress(40);
          blob = await exportManager.exportToHTML(note);
          extension = 'html';
          setProgress(80);
          break;
        default:
          throw new Error('不支持的导出格式');
      }

      setProgress(90);

      // Generate filename and download
      const filename = exportManager.generateFilename(note.title, extension);
      exportManager.downloadBlob(blob, filename);

      setProgress(100);
      toast.success(`成功导出为 ${selectedFormat.toUpperCase()} 格式`);

      // Close dialog after a short delay
      setTimeout(() => {
        setOpen(false);
        setProgress(0);
      }, 1000);
    } catch (error) {
      console.error('Export error:', error);
      toast.error(
        error instanceof Error ? error.message : '导出失败，请重试'
      );
      setProgress(0);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            导出
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>导出笔记</DialogTitle>
          <DialogDescription>
            选择导出格式并下载笔记文件
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label>选择格式</Label>
            <div className="grid gap-3">
              {formats.map((format) => {
                const Icon = format.icon;
                const isSelected = selectedFormat === format.id;

                return (
                  <button
                    key={format.id}
                    onClick={() => setSelectedFormat(format.id)}
                    disabled={isExporting}
                    className={`
                      flex items-start gap-3 p-4 rounded-lg border-2 transition-all
                      ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }
                      ${isExporting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                  >
                    <Icon
                      className={`h-5 w-5 mt-0.5 ${
                        isSelected ? 'text-primary' : 'text-muted-foreground'
                      }`}
                    />
                    <div className="flex-1 text-left">
                      <div className="font-medium">{format.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {format.description}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                        <svg
                          className="h-3 w-3 text-primary-foreground"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Export Options Info */}
          <div className="rounded-lg bg-muted p-4 space-y-2 text-sm">
            <div className="font-medium">导出内容包括：</div>
            <ul className="space-y-1 text-muted-foreground">
              <li>• 笔记标题和内容</li>
              <li>• 所有格式化（标题、列表、链接、代码）</li>
              <li>
                • 图片（
                {selectedFormat === 'markdown'
                  ? '使用公开 URL'
                  : selectedFormat === 'pdf'
                  ? '嵌入 PDF'
                  : '转换为 Base64'}
                ）
              </li>
              <li>• 创建和更新时间</li>
            </ul>
          </div>

          {/* Progress Bar */}
          {isExporting && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">导出进度</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isExporting}
          >
            取消
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                导出中...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                导出
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
