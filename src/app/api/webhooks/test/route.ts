/**
 * Webhook Test API
 * 
 * Tests webhook delivery
 * Validates: Requirements 18.1
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { webhookManager } from '@/lib/webhooks/webhook-manager';

/**
 * POST /api/webhooks/test - Test webhook delivery
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

    if (!webhookUrl) {
      return NextResponse.json(
        { error: 'Webhook URL is required' },
        { status: 400 }
      );
    }

    // Test the webhook
    const result = await webhookManager.testWebhook(webhookUrl);

    return NextResponse.json({
      success: result.success,
      attempts: result.attempts,
      error: result.error,
      timestamp: result.timestamp,
    });
  } catch (error) {
    console.error('Error testing webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
