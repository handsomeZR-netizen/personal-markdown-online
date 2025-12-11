import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface PublicNotePageProps {
  params: Promise<{
    slug: string;
  }>;
}

async function getPublicNote(slug: string) {
  const note = await prisma.note.findUnique({
    where: {
      publicSlug: slug,
      isPublic: true,
    },
    include: {
      User_Note_ownerIdToUser: {
        select: {
          name: true,
          email: true,
        },
      },
      Tag: {
        select: {
          id: true,
          name: true,
        },
      },
      Category: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return note;
}

export async function generateMetadata({
  params,
}: PublicNotePageProps): Promise<Metadata> {
  const { slug } = await params;
  const note = await getPublicNote(slug);

  if (!note) {
    return {
      title: 'Note Not Found',
    };
  }

  return {
    title: note.title,
    description: note.summary || `Shared note: ${note.title}`,
  };
}

export default async function PublicNotePage({ params }: PublicNotePageProps) {
  const { slug } = await params;
  const note = await getPublicNote(slug);

  if (!note) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">团队协作知识库</h1>
            <Badge variant="secondary">公开分享</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost">登录</Button>
            </Link>
            <Link href="/register">
              <Button>注册以编辑</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <div className="space-y-4">
              <CardTitle className="text-3xl">{note.title}</CardTitle>
              
              {/* Metadata */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div>
                  作者: {note.User_Note_ownerIdToUser.name || note.User_Note_ownerIdToUser.email}
                </div>
                <div>
                  更新于{' '}
                  {formatDistanceToNow(new Date(note.updatedAt), {
                    addSuffix: true,
                    locale: zhCN,
                  })}
                </div>
              </div>

              {/* Tags and Category */}
              {(note.Tag.length > 0 || note.Category) && (
                <div className="flex flex-wrap items-center gap-2">
                  {note.Category && (
                    <Badge variant="outline">{note.Category.name}</Badge>
                  )}
                  {note.Tag.map((tag) => (
                    <Badge key={tag.id} variant="secondary">
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent>
            {/* Read-only content display */}
            <div className="prose prose-slate dark:prose-invert max-w-none">
              {note.contentType === 'tiptap-json' ? (
                <TiptapReadOnlyViewer content={note.content} />
              ) : (
                // Security: Render plain text content safely without HTML injection
                <div className="whitespace-pre-wrap">
                  {note.content}
                </div>
              )}
            </div>

            {/* Call to action */}
            <div className="mt-8 p-6 bg-muted rounded-lg text-center">
              <h3 className="text-lg font-semibold mb-2">
                想要编辑这篇笔记？
              </h3>
              <p className="text-muted-foreground mb-4">
                注册账号即可创建和编辑自己的笔记，还能与团队成员实时协作
              </p>
              <div className="flex items-center justify-center gap-2">
                <Link href="/register">
                  <Button size="lg">免费注册</Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline">
                    已有账号？登录
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>
            这是一篇公开分享的笔记。创建您自己的账号来体验完整功能。
          </p>
        </div>
      </footer>
    </div>
  );
}

// Read-only Tiptap viewer component
function TiptapReadOnlyViewer({ content }: { content: string }) {
  // First check if content looks like JSON (starts with { or [)
  const trimmedContent = content.trim();
  const looksLikeJson = trimmedContent.startsWith('{') || trimmedContent.startsWith('[');
  
  if (!looksLikeJson) {
    // Content is plain text or Markdown, render as-is with whitespace preserved
    return (
      <div className="whitespace-pre-wrap">
        {content}
      </div>
    );
  }
  
  try {
    const parsedContent = JSON.parse(content);
    
    // Simple renderer for Tiptap JSON content
    // In a real implementation, you'd use Tiptap's generateHTML or a proper renderer
    return (
      <div className="tiptap-content">
        {renderTiptapContent(parsedContent)}
      </div>
    );
  } catch (error) {
    console.error('Error parsing Tiptap content:', error);
    // Fallback: render as plain text if JSON parsing fails
    return (
      <div className="whitespace-pre-wrap">
        {content}
      </div>
    );
  }
}

// Helper function to render Tiptap JSON content
function renderTiptapContent(content: any): React.ReactNode {
  if (!content || !content.content) {
    return null;
  }

  return content.content.map((node: any, index: number) => {
    switch (node.type) {
      case 'paragraph':
        return (
          <p key={index}>
            {node.content?.map((child: any, childIndex: number) =>
              renderInlineContent(child, childIndex)
            )}
          </p>
        );
      
      case 'heading':
        const HeadingTag = `h${node.attrs?.level || 1}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
        return (
          <HeadingTag key={index}>
            {node.content?.map((child: any, childIndex: number) =>
              renderInlineContent(child, childIndex)
            )}
          </HeadingTag>
        );
      
      case 'bulletList':
        return (
          <ul key={index}>
            {node.content?.map((item: any, itemIndex: number) => (
              <li key={itemIndex}>
                {item.content?.map((child: any, childIndex: number) =>
                  renderTiptapContent(child)
                )}
              </li>
            ))}
          </ul>
        );
      
      case 'orderedList':
        return (
          <ol key={index}>
            {node.content?.map((item: any, itemIndex: number) => (
              <li key={itemIndex}>
                {item.content?.map((child: any, childIndex: number) =>
                  renderTiptapContent(child)
                )}
              </li>
            ))}
          </ol>
        );
      
      case 'codeBlock':
        return (
          <pre key={index}>
            <code>
              {node.content?.map((child: any) => child.text).join('') || ''}
            </code>
          </pre>
        );
      
      case 'image':
        return (
          <img
            key={index}
            src={node.attrs?.src}
            alt={node.attrs?.alt || ''}
            className="max-w-full h-auto rounded-lg"
          />
        );
      
      case 'blockquote':
        return (
          <blockquote key={index}>
            {node.content?.map((child: any, childIndex: number) =>
              renderTiptapContent(child)
            )}
          </blockquote>
        );
      
      case 'horizontalRule':
        return <hr key={index} />;
      
      default:
        return null;
    }
  });
}

// Helper function to render inline content (text with marks)
function renderInlineContent(node: any, index: number): React.ReactNode {
  if (node.type === 'text') {
    let text: React.ReactNode = node.text;
    
    if (node.marks) {
      node.marks.forEach((mark: any) => {
        switch (mark.type) {
          case 'bold':
            text = <strong key={`${index}-bold`}>{text}</strong>;
            break;
          case 'italic':
            text = <em key={`${index}-italic`}>{text}</em>;
            break;
          case 'code':
            text = <code key={`${index}-code`}>{text}</code>;
            break;
          case 'link':
            text = (
              <a
                key={`${index}-link`}
                href={mark.attrs?.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                {text}
              </a>
            );
            break;
          case 'strike':
            text = <s key={`${index}-strike`}>{text}</s>;
            break;
        }
      });
    }
    
    return text;
  }
  
  if (node.type === 'hardBreak') {
    return <br key={index} />;
  }
  
  return null;
}
