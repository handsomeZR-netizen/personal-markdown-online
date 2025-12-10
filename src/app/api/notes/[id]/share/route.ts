import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';

// Enable public sharing for a note
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: noteId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is the owner of the note
    const note = await prisma.note.findUnique({
      where: { id: noteId },
      select: { ownerId: true, publicSlug: true, isPublic: true },
    });

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    if (note.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only the note owner can enable public sharing' },
        { status: 403 }
      );
    }

    // If already public, return existing slug
    if (note.isPublic && note.publicSlug) {
      return NextResponse.json({
        isPublic: true,
        publicSlug: note.publicSlug,
        publicUrl: `${process.env.NEXT_PUBLIC_APP_URL || ''}/public/${note.publicSlug}`,
      });
    }

    // Generate a unique slug
    let publicSlug = nanoid(10); // 10 character random string
    let attempts = 0;
    const maxAttempts = 5;

    // Ensure uniqueness
    while (attempts < maxAttempts) {
      const existing = await prisma.note.findUnique({
        where: { publicSlug },
      });

      if (!existing) {
        break;
      }

      publicSlug = nanoid(10);
      attempts++;
    }

    if (attempts >= maxAttempts) {
      return NextResponse.json(
        { error: 'Failed to generate unique slug' },
        { status: 500 }
      );
    }

    // Update note with public slug
    const updatedNote = await prisma.note.update({
      where: { id: noteId },
      data: {
        isPublic: true,
        publicSlug,
      },
      select: {
        id: true,
        isPublic: true,
        publicSlug: true,
      },
    });

    return NextResponse.json({
      isPublic: updatedNote.isPublic,
      publicSlug: updatedNote.publicSlug,
      publicUrl: `${process.env.NEXT_PUBLIC_APP_URL || ''}/public/${updatedNote.publicSlug}`,
    });
  } catch (error) {
    console.error('Error enabling public sharing:', error);
    return NextResponse.json(
      { error: 'Failed to enable public sharing' },
      { status: 500 }
    );
  }
}

// Disable public sharing for a note
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: noteId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is the owner of the note
    const note = await prisma.note.findUnique({
      where: { id: noteId },
      select: { ownerId: true },
    });

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    if (note.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only the note owner can disable public sharing' },
        { status: 403 }
      );
    }

    // Disable public sharing
    await prisma.note.update({
      where: { id: noteId },
      data: {
        isPublic: false,
        publicSlug: null,
      },
    });

    return NextResponse.json({
      isPublic: false,
      publicSlug: null,
    });
  } catch (error) {
    console.error('Error disabling public sharing:', error);
    return NextResponse.json(
      { error: 'Failed to disable public sharing' },
      { status: 500 }
    );
  }
}

// Get public sharing status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: noteId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const note = await prisma.note.findUnique({
      where: { id: noteId },
      select: {
        id: true,
        isPublic: true,
        publicSlug: true,
        ownerId: true,
      },
    });

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Only owner can view sharing status
    if (note.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only the note owner can view sharing status' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      isPublic: note.isPublic,
      publicSlug: note.publicSlug,
      publicUrl: note.publicSlug
        ? `${process.env.NEXT_PUBLIC_APP_URL || ''}/public/${note.publicSlug}`
        : null,
    });
  } catch (error) {
    console.error('Error getting sharing status:', error);
    return NextResponse.json(
      { error: 'Failed to get sharing status' },
      { status: 500 }
    );
  }
}
