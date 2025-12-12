// Feature: Note Templates - Server Actions
// Task 15.1: Implement Template CRUD Operations
// Requirements: 24.1, 24.2, 24.3, 24.4, 24.5

'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export interface Template {
  id: string;
  name: string;
  description: string | null;
  content: string;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTemplateInput {
  name: string;
  description?: string;
  content: string;
}

export interface UpdateTemplateInput {
  name?: string;
  description?: string;
  content?: string;
}

// Get all templates for current user
export async function getTemplates(): Promise<Template[]> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const templates = await prisma.noteTemplate.findMany({
    where: { userId: session.user.id },
    orderBy: [
      { usageCount: 'desc' },
      { updatedAt: 'desc' },
    ],
  });

  return templates;
}

// Get single template
export async function getTemplate(id: string): Promise<Template | null> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const template = await prisma.noteTemplate.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
  });

  return template;
}

// Create new template
export async function createTemplate(
  input: CreateTemplateInput
): Promise<Template> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const { createId } = await import('@paralleldrive/cuid2')
  const template = await prisma.noteTemplate.create({
    data: {
      id: createId(),
      name: input.name,
      description: input.description,
      content: input.content,
      userId: session.user.id,
      updatedAt: new Date(),
    },
  });

  revalidatePath('/templates');
  return template;
}

// Save note as template
export async function saveNoteAsTemplate(
  noteId: string,
  name: string,
  description?: string
): Promise<Template> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  // Get note content
  const note = await prisma.note.findFirst({
    where: {
      id: noteId,
      userId: session.user.id,
    },
  });

  if (!note) {
    throw new Error('Note not found');
  }

  const { createId: createId2 } = await import('@paralleldrive/cuid2')
  const template = await prisma.noteTemplate.create({
    data: {
      id: createId2(),
      name,
      description,
      content: note.content,
      userId: session.user.id,
      updatedAt: new Date(),
    },
  });

  revalidatePath('/templates');
  return template;
}

// Update template
export async function updateTemplate(
  id: string,
  input: UpdateTemplateInput
): Promise<Template> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  // Verify ownership
  const existing = await prisma.noteTemplate.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
  });

  if (!existing) {
    throw new Error('Template not found');
  }

  const template = await prisma.noteTemplate.update({
    where: { id },
    data: input,
  });

  revalidatePath('/templates');
  return template;
}

// Delete template
export async function deleteTemplate(id: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  // Verify ownership
  const existing = await prisma.noteTemplate.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
  });

  if (!existing) {
    throw new Error('Template not found');
  }

  await prisma.noteTemplate.delete({
    where: { id },
  });

  revalidatePath('/templates');
}

// Use template to create note
export async function createNoteFromTemplate(
  templateId: string,
  title: string,
  folderId?: string
): Promise<{ id: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  // Get template
  const template = await prisma.noteTemplate.findFirst({
    where: {
      id: templateId,
      userId: session.user.id,
    },
  });

  if (!template) {
    throw new Error('Template not found');
  }

  // Create note from template and increment usage count
  const { createId } = await import('@paralleldrive/cuid2');
  const noteId = createId();
  
  const [note] = await prisma.$transaction([
    prisma.note.create({
      data: {
        id: noteId,
        title,
        content: template.content,
        userId: session.user.id,
        ownerId: session.user.id,
        folderId,
        updatedAt: new Date(),
      },
    }),
    prisma.noteTemplate.update({
      where: { id: templateId },
      data: { usageCount: { increment: 1 } },
    }),
  ]);

  revalidatePath('/notes');
  revalidatePath('/templates');
  return { id: note.id };
}
