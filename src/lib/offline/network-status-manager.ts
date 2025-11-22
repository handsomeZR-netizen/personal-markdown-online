/**
 * Network Status Manager
 * 
 * Manages network connectivity detection and status change notifications.
 * Implements Requirements 4.1, 4.2 from the offline-and-ai-enhancements spec.
 */

type StatusChangeCallback = (isOnline: boolean) => void;

export class NetworkStatusManager {
  private listeners: Set<StatusChangeCallback>;
  private currentStatus: boolean;

  constructor() {
    this.currentStatus = navigator.onLine;
    this.listeners = new Set();
    this.setupListeners();
  }

  /**
   * Get current network status
   * @returns true if online, false if offline
   */
  isOnline(): boolean {
    return this.currentStatus;
  }

  /**
   * Register a callback for network status changes
   * @param callback Function to call when status changes
   * @returns Cleanup function to remove the listener
   */
  onStatusChange(callback: StatusChangeCallback): () => void {
    this.listeners.add(callback);
    
    // Return cleanup function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Manually check network connection by attempting to fetch a resource
   * @returns Promise resolving to true if online, false if offline
   */
  async checkConnection(): Promise<boolean> {
    try {
      // Try to fetch a small resource with no-cache to verify real connectivity
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      
      const isOnline = response.ok;
      
      // Update status if it changed
      if (isOnline !== this.currentStatus) {
        this.handleStatusChange(isOnline);
      }
      
      return isOnline;
    } catch (error) {
      // Network error means we're offline
      if (this.currentStatus !== false) {
        this.handleStatusChange(false);
      }
      return false;
    }
  }

  /**
   * Setup browser event listeners for online/offline events
   */
  private setupListeners(): void {
    window.addEventListener('online', () => this.handleStatusChange(true));
    window.addEventListener('offline', () => this.handleStatusChange(false));
  }

  /**
   * Handle network status change and notify all listeners
   */
  private handleStatusChange(isOnline: boolean): void {
    this.currentStatus = isOnline;
    this.listeners.forEach(callback => {
      try {
        callback(isOnline);
      } catch (error) {
        console.error('Error in network status change callback:', error);
      }
    });
  }

  /**
   * Cleanup all listeners (call when unmounting)
   */
  destroy(): void {
    this.listeners.clear();
    window.removeEventListener('online', () => this.handleStatusChange(true));
    window.removeEventListener('offline', () => this.handleStatusChange(false));
  }
}

// Singleton instance
let instance: NetworkStatusManager | null = null;

/**
 * Get the singleton instance of NetworkStatusManager
 */
export function getNetworkStatusManager(): NetworkStatusManager {
  if (!instance) {
    instance = new NetworkStatusManager();
  }
  return instance;
}
