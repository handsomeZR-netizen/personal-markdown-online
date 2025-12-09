// Feature: Note Templates - Use Template to Create Note
// Task 15.1: Implement Template CRUD Operations
// Task 15.3: Implement from template creation
// Requirements: 24.2

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const useTemplateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  folderId: z.string().optional(),
});

// POST /api/templates/[id]/use - Create note from template
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = useTemplateSchema.parse(body);

    // Get template
    const template = await prisma.noteTemplate.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Create note from template and increment usage count in a transaction
    const [note] = await prisma.$transaction([
      prisma.note.create({
        data: {
          title: validatedData.title,
          content: template.content,
          userId: session.user.id,
          ownerId: session.user.id,
          folderId: validatedData.folderId,
        },
      }),
      prisma.noteTemplate.update({
        where: { id: params.id },
        data: { usageCount: { increment: 1 } },
      }),
    ]);

    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Error creating note from template:', error);
    return NextResponse.json(
      { error: 'Failed to create note from template' },
      { status: 500 }
    );
  }
}
