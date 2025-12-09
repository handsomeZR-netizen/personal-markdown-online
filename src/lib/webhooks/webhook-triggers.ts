/**
 * Webhook Triggers
 * 
 * Handles triggering webhooks for note events.
 * Validates: Requirements 18.2, 18.3
 */

import { webhookManager, type WebhookPayload } from './webhook-manager';
import { prisma } from '@/lib/prisma';

/**
 * Trigger webhook for note creation
 * Validates: Requirements 18.2, 18.3
 */
export async function triggerNoteCreated(
  noteId: string,
  title: string,
  userId: string
): Promise<void> {
  try {
    // Get user information
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, webhookUrl: true },
    });

    if (!user) {
      console.warn('[Webhook] User not found for note creation event', { userId, noteId });
      return;
    }

    // Build webhook payload
    const payload: WebhookPayload = {
      event: 'note.created',
      noteId,
      title,
      userId,
      userName: user.name || user.email,
      timestamp: new Date().toISOString(),
    };

    // Send webhook if configured
    if (user.webhookUrl) {
      await webhookManager.sendWebhook(user.webhookUrl, payload);
    }
  } catch (error) {
    console.error('[Webhook] Error triggering note.created webhook', {
      error,
      noteId,
      userId,
    });
    // Don't throw - webhook failures shouldn't break the main flow
  }
}

/**
 * Trigger webhook for note update
 * Validates: Requirements 18.2, 18.3
 */
export async function triggerNoteUpdated(
  noteId: string,
  title: string,
  userId: string
): Promise<void> {
  try {
    // Get user information
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, webhookUrl: true },
    });

    if (!user) {
      console.warn('[Webhook] User not found for note update event', { userId, noteId });
      return;
    }

    // Build webhook payload
    const payload: WebhookPayload = {
      event: 'note.updated',
      noteId,
      title,
      userId,
      userName: user.name || user.email,
      timestamp: new Date().toISOString(),
    };

    // Send webhook if configured
    if (user.webhookUrl) {
      await webhookManager.sendWebhook(user.webhookUrl, payload);
    }
  } catch (error) {
    console.error('[Webhook] Error triggering note.updated webhook', {
      error,
      noteId,
      userId,
    });
    // Don't throw - webhook failures shouldn't break the main flow
  }
}

/**
 * Trigger webhook for note deletion
 * Validates: Requirements 18.2, 18.3
 */
export async function triggerNoteDeleted(
  noteId: string,
  title: string,
  userId: string
): Promise<void> {
  try {
    // Get user information
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, webhookUrl: true },
    });

    if (!user) {
      console.warn('[Webhook] User not found for note deletion event', { userId, noteId });
      return;
    }

    // Build webhook payload
    const payload: WebhookPayload = {
      event: 'note.deleted',
      noteId,
      title,
      userId,
      userName: user.name || user.email,
      timestamp: new Date().toISOString(),
    };

    // Send webhook if configured
    if (user.webhookUrl) {
      await webhookManager.sendWebhook(user.webhookUrl, payload);
    }
  } catch (error) {
    console.error('[Webhook] Error triggering note.deleted webhook', {
      error,
      noteId,
      userId,
    });
    // Don't throw - webhook failures shouldn't break the main flow
  }
}

/**
 * Trigger webhooks for batch operations
 */
export async function triggerBatchWebhooks(
  events: Array<{
    event: 'note.created' | 'note.updated' | 'note.deleted';
    noteId: string;
    title: string;
    userId: string;
  }>
): Promise<void> {
  // Process webhooks in parallel
  await Promise.allSettled(
    events.map(({ event, noteId, title, userId }) => {
      switch (event) {
        case 'note.created':
          return triggerNoteCreated(noteId, title, userId);
        case 'note.updated':
          return triggerNoteUpdated(noteId, title, userId);
        case 'note.deleted':
          return triggerNoteDeleted(noteId, title, userId);
      }
    })
  );
}
