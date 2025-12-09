// Feature: Note Templates - Template Library UI
// Task 15.2: Create Template Library UI
// Requirements: 24.2, 24.5

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, Trash2, Eye, Loader2 } from 'lucide-react';
import { getTemplates, createNoteFromTemplate, deleteTemplate, type Template } from '@/lib/actions/templates';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface TemplateLibraryProps {
  onSelectTemplate?: (templateId: string) => void;
}

export function TemplateLibrary({ onSelectTemplate }: TemplateLibraryProps) {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [useDialogOpen, setUseDialogOpen] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await getTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Failed to load templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = (template: Template) => {
    setSelectedTemplate(template);
    setPreviewOpen(true);
  };

  const handleUseTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setNoteTitle(`${template.name} - Copy`);
    setUseDialogOpen(true);
  };

  const handleCreateNote = async () => {
    if (!selectedTemplate || !noteTitle.trim()) {
      toast.error('Please enter a note title');
      return;
    }

    try {
      setCreating(true);
      const result = await createNoteFromTemplate(
        selectedTemplate.id,
        noteTitle.trim()
      );
      
      toast.success('Note created from template');
      setUseDialogOpen(false);
      setNoteTitle('');
      
      // Reload templates to update usage count
      await loadTemplates();
      
      // Navigate to the new note or call callback
      if (onSelectTemplate) {
        onSelectTemplate(result.id);
      } else {
        router.push(`/notes/${result.id}/edit`);
      }
    } catch (error) {
      console.error('Failed to create note from template:', error);
      toast.error('Failed to create note from template');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleting(templateId);
      await deleteTemplate(templateId);
      toast.success('Template deleted');
      await loadTemplates();
    } catch (error) {
      console.error('Failed to delete template:', error);
      toast.error('Failed to delete template');
    } finally {
      setDeleting(null);
    }
  };

  const getContentPreview = (content: string): string => {
    try {
      // Try to parse as JSON (Tiptap format)
      const parsed = JSON.parse(content);
      if (parsed.type === 'doc' && parsed.content) {
        // Extract text from Tiptap JSON
        const extractText = (node: any): string => {
          if (node.text) return node.text;
          if (node.content) {
            return node.content.map(extractText).join(' ');
          }
          return '';
        };
        const text = extractText(parsed);
        return text.slice(0, 150) + (text.length > 150 ? '...' : '');
      }
    } catch {
      // If not JSON, treat as plain text
      return content.slice(0, 150) + (content.length > 150 ? '...' : '');
    }
    return 'No preview available';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No templates yet</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Create your first template by saving a note as a template
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <Card key={template.id} className="flex flex-col">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {template.name}
                  </CardTitle>
                  {template.description && (
                    <CardDescription className="mt-1">
                      {template.description}
                    </CardDescription>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-sm text-muted-foreground line-clamp-3">
                {getContentPreview(template.content)}
              </p>
              <div className="mt-4 flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  Used {template.usageCount} {template.usageCount === 1 ? 'time' : 'times'}
                </Badge>
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePreview(template)}
                className="flex-1"
              >
                <Eye className="h-4 w-4 mr-1" />
                Preview
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => handleUseTemplate(template)}
                className="flex-1"
              >
                <Plus className="h-4 w-4 mr-1" />
                Use
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(template.id)}
                disabled={deleting === template.id}
              >
                {deleting === template.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{selectedTemplate?.name}</DialogTitle>
            {selectedTemplate?.description && (
              <DialogDescription>{selectedTemplate.description}</DialogDescription>
            )}
          </DialogHeader>
          <ScrollArea className="h-[400px] w-full rounded-md border p-4">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <pre className="whitespace-pre-wrap text-sm">
                {selectedTemplate?.content}
              </pre>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              Close
            </Button>
            <Button
              onClick={() => {
                setPreviewOpen(false);
                if (selectedTemplate) {
                  handleUseTemplate(selectedTemplate);
                }
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Use Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Use Template Dialog */}
      <Dialog open={useDialogOpen} onOpenChange={setUseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Note from Template</DialogTitle>
            <DialogDescription>
              Enter a title for your new note. The template content will be copied.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="note-title">Note Title</Label>
              <Input
                id="note-title"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="Enter note title..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !creating) {
                    handleCreateNote();
                  }
                }}
              />
            </div>
            {selectedTemplate && (
              <div className="text-sm text-muted-foreground">
                Template: <span className="font-medium">{selectedTemplate.name}</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUseDialogOpen(false)}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateNote} disabled={creating || !noteTitle.trim()}>
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-1" />
                  Create Note
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}