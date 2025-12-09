/**
 * Webhook Configuration API
 * 
 * Handles webhook URL configuration and testing
 * Validates: Requirements 18.1
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { webhookManager } from '@/lib/webhooks/webhook-manager';

/**
 * GET /api/webhooks - Get user's webhook configuration
 */
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { webhookUrl: true },
    });

    return NextResponse.json({
      webhookUrl: user?.webhookUrl || null,
    });
  } catch (error) {
    console.error('Error fetching webhook config:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/webhooks - Update webhook configuration
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { webhookUrl } = body;

    // Validate webhook URL if provided
    if (webhookUrl && !webhookManager.validateWebhookUrl(webhookUrl)) {
      return NextResponse.json(
        { error: 'Invalid webhook URL. Must use HTTPS and be a valid URL.' },
        { status: 400 }
      );
    }

    // Update user's webhook URL
    await prisma.user.update({
      where: { id: session.user.id },
      data: { webhookUrl: webhookUrl || null },
    });

    return NextResponse.json({
      success: true,
      webhookUrl: webhookUrl || null,
    });
  } catch (error) {
    console.error('Error updating webhook config:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/webhooks - Remove webhook configuration
 */
export async function DELETE() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { webhookUrl: null },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Error deleting webhook config:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
