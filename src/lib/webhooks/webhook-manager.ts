/**
 * Webhook Manager
 * 
 * Manages webhook delivery with retry logic and error handling.
 * Validates webhook URLs and ensures reliable delivery of note events.
 */

export interface WebhookPayload {
  event: 'note.created' | 'note.updated' | 'note.deleted';
  noteId: string;
  title: string;
  userId: string;
  userName: string;
  timestamp: string;
}

export interface WebhookConfig {
  url: string;
  events: Array<'note.created' | 'note.updated' | 'note.deleted'>;
  enabled: boolean;
}

export interface WebhookDeliveryResult {
  success: boolean;
  attempts: number;
  error?: string;
  timestamp: string;
}

export class WebhookError extends Error {
  constructor(
    message: string,
    public readonly attempts: number,
    public readonly lastError?: Error
  ) {
    super(message);
    this.name = 'WebhookError';
  }
}

export class WebhookManager {
  private maxRetries: number;
  private retryDelay: number;
  private timeout: number;

  constructor(
    maxRetries: number = 3,
    retryDelay: number = 5000,
    timeout: number = 10000
  ) {
    this.maxRetries = maxRetries;
    this.retryDelay = retryDelay;
    this.timeout = timeout;
  }

  /**
   * Send a webhook with retry logic
   * Validates: Requirements 18.2, 18.4
   */
  async sendWebhook(url: string, payload: WebhookPayload): Promise<WebhookDeliveryResult> {
    let lastError: Error | null = null;
    let attempts = 0;

    // Validate URL before attempting delivery
    if (!this.validateWebhookUrl(url)) {
      const error = new Error('Invalid webhook URL: must use HTTPS protocol');
      this.logError(url, payload, error, 0);
      return {
        success: false,
        attempts: 0,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }

    for (attempts = 1; attempts <= this.maxRetries; attempts++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'TeamKnowledgeBase/1.0',
            'X-Webhook-Event': payload.event,
            'X-Webhook-Delivery-ID': this.generateDeliveryId(),
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          // Success - log and return
          this.logSuccess(url, payload, attempts);
          return {
            success: true,
            attempts,
            timestamp: new Date().toISOString(),
          };
        }

        // Non-2xx response
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      } catch (error) {
        lastError = error as Error;

        // Log the attempt
        this.logAttempt(url, payload, error as Error, attempts);

        // If this isn't the last attempt, wait before retrying
        if (attempts < this.maxRetries) {
          await this.delay(this.retryDelay * attempts); // Exponential backoff
        }
      }
    }

    // All retries failed
    this.logError(url, payload, lastError!, this.maxRetries);
    
    return {
      success: false,
      attempts: this.maxRetries,
      error: lastError?.message || 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Send webhooks to multiple URLs
   */
  async sendWebhooks(
    urls: string[],
    payload: WebhookPayload
  ): Promise<WebhookDeliveryResult[]> {
    const promises = urls.map(url =>
      this.sendWebhook(url, payload).catch(error => ({
        success: false,
        attempts: 0,
        error: error.message,
        timestamp: new Date().toISOString(),
      }))
    );

    return Promise.all(promises);
  }

  /**
   * Validate webhook URL
   * Validates: Requirements 18.1
   */
  validateWebhookUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      
      // Must use HTTPS for security
      if (urlObj.protocol !== 'https:') {
        return false;
      }

      // Must have a valid hostname
      if (!urlObj.hostname || urlObj.hostname === 'localhost') {
        return false;
      }

      // Reject private IP ranges (basic check)
      if (this.isPrivateIP(urlObj.hostname)) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Test webhook URL by sending a test payload
   */
  async testWebhook(url: string): Promise<WebhookDeliveryResult> {
    const testPayload: WebhookPayload = {
      event: 'note.created',
      noteId: 'test-note-id',
      title: 'Test Webhook',
      userId: 'test-user-id',
      userName: 'Test User',
      timestamp: new Date().toISOString(),
    };

    return this.sendWebhook(url, testPayload);
  }

  /**
   * Check if hostname is a private IP address
   */
  private isPrivateIP(hostname: string): boolean {
    // Basic check for common private IP ranges
    const privateRanges = [
      /^127\./,           // 127.0.0.0/8
      /^10\./,            // 10.0.0.0/8
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12
      /^192\.168\./,      // 192.168.0.0/16
      /^169\.254\./,      // 169.254.0.0/16 (link-local)
    ];

    return privateRanges.some(range => range.test(hostname));
  }

  /**
   * Generate unique delivery ID for tracking
   */
  private generateDeliveryId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Delay helper for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Log successful webhook delivery
   */
  private logSuccess(url: string, payload: WebhookPayload, attempts: number): void {
    console.log('[Webhook] Delivery successful', {
      url,
      event: payload.event,
      noteId: payload.noteId,
      attempts,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log webhook delivery attempt
   */
  private logAttempt(url: string, payload: WebhookPayload, error: Error, attempt: number): void {
    console.warn('[Webhook] Delivery attempt failed', {
      url,
      event: payload.event,
      noteId: payload.noteId,
      attempt,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log webhook delivery failure
   */
  private logError(url: string, payload: WebhookPayload, error: Error, attempts: number): void {
    console.error('[Webhook] Delivery failed after all retries', {
      url,
      event: payload.event,
      noteId: payload.noteId,
      attempts: attempts,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}

// Export singleton instance
export const webhookManager = new WebhookManager();
