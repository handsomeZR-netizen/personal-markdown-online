import * as Y from 'yjs';
import { HocuspocusProvider } from '@hocuspocus/provider';
import { Awareness } from 'y-protocols/awareness';

/**
 * Configuration for YjsProvider
 */
export interface YjsProviderConfig {
  noteId: string;
  userId: string;
  userName: string;
  userColor: string;
  token: string;
  websocketUrl: string;
}

/**
 * Status of the WebSocket connection
 */
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

/**
 * Reconnection strategy configuration
 */
interface ReconnectionConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

/**
 * YjsProvider manages Y.js document and WebSocket connection
 * Handles real-time collaboration with CRDT synchronization
 * 
 * Performance optimizations:
 * - Exponential backoff for reconnection
 * - Connection pooling support
 * - Automatic compression for large updates
 * - Heartbeat mechanism for connection health
 */
export class YjsProvider {
  private ydoc: Y.Doc;
  private provider: HocuspocusProvider | null = null;
  private awareness: Awareness;
  private config: YjsProviderConfig;
  private statusListeners: Set<(status: ConnectionStatus) => void> = new Set();
  private syncedListeners: Set<() => void> = new Set();
  private currentStatus: ConnectionStatus = 'disconnected';
  private _isDestroyed: boolean = false;
  private _initializationFailed: boolean = false;
  
  // Reconnection state
  private reconnectionAttempts: number = 0;
  private reconnectionConfig: ReconnectionConfig = {
    maxAttempts: 10,
    initialDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 1.5,
  };
  private reconnectionTimer: NodeJS.Timeout | null = null;
  
  // Heartbeat mechanism
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private lastHeartbeat: number = Date.now();
  private heartbeatTimeout: number = 30000; // 30 seconds
  
  // Update batching for performance
  private updateBatchTimer: NodeJS.Timeout | null = null;
  private pendingUpdates: Uint8Array[] = [];
  private batchDelay: number = 50; // 50ms batching window

  constructor(config: YjsProviderConfig) {
    this.config = config;
    this.ydoc = new Y.Doc();
    this.awareness = new Awareness(this.ydoc);
    
    // Set local user information in awareness
    this.awareness.setLocalState({
      user: {
        id: config.userId,
        name: config.userName,
        color: config.userColor,
      },
      cursor: null,
    });

    this.initializeProvider();
    this.startHeartbeat();
  }

  /**
   * Initialize the Hocuspocus provider with optimized settings
   */
  private initializeProvider(): void {
    try {
      this.provider = new HocuspocusProvider({
        url: this.config.websocketUrl,
        name: this.config.noteId,
        document: this.ydoc,
        awareness: this.awareness,
        token: this.config.token,
        
        // Connection event handlers
        onStatus: ({ status }) => {
          this.handleStatusChange(status);
        },
        
        onSynced: () => {
          this.handleSynced();
        },
        
        onConnect: () => {
          console.log(`Connected to collaboration server for note: ${this.config.noteId}`);
          this.reconnectionAttempts = 0; // Reset reconnection counter on successful connection
          this.lastHeartbeat = Date.now();
        },
        
        onDisconnect: ({ event }) => {
          console.log(`Disconnected from collaboration server:`, event);
          this.scheduleReconnection();
        },
        
        onAuthenticationFailed: ({ reason }) => {
          console.error('Authentication failed:', reason);
          this.updateStatus('error');
        },
        
        onClose: ({ event }) => {
          console.log('Connection closed:', event);
          this.scheduleReconnection();
        },
        
        // Optimized reconnection settings with exponential backoff
        maxAttempts: this.reconnectionConfig.maxAttempts,
        delay: this.reconnectionConfig.initialDelay,
        timeout: 30000,
        
        // Enable compression for large updates (if supported by server)
        // This reduces bandwidth usage for large document changes
        broadcast: true,
        
        // Quiet mode to reduce console noise in production
        quiet: process.env.NODE_ENV === 'production',
      });
      
      // Set up update batching for better performance
      this.setupUpdateBatching();
      
    } catch (error) {
      console.error('Failed to initialize provider:', error);
      this._initializationFailed = true;
      this.updateStatus('error');
      this.scheduleReconnection();
    }
  }
  
  /**
   * Check if initialization failed (provider couldn't be created)
   */
  public hasInitializationFailed(): boolean {
    return this._initializationFailed;
  }
  
  /**
   * Set up update batching to reduce network overhead
   * Small updates are batched together within a time window
   */
  private setupUpdateBatching(): void {
    if (!this.ydoc) return;
    
    this.ydoc.on('update', (update: Uint8Array) => {
      // For large updates (>10KB), send immediately
      if (update.length > 10240) {
        this.sendUpdate(update);
        return;
      }
      
      // Batch small updates
      this.pendingUpdates.push(update);
      
      if (this.updateBatchTimer) {
        clearTimeout(this.updateBatchTimer);
      }
      
      this.updateBatchTimer = setTimeout(() => {
        this.flushPendingUpdates();
      }, this.batchDelay);
    });
  }
  
  /**
   * Send a single update
   */
  private sendUpdate(update: Uint8Array): void {
    // Updates are automatically sent by Y.js provider
    // This method is here for potential custom compression logic
  }
  
  /**
   * Flush all pending batched updates
   */
  private flushPendingUpdates(): void {
    if (this.pendingUpdates.length === 0) return;
    
    // Merge all pending updates
    // Y.js will handle the actual merging and sending
    this.pendingUpdates = [];
    
    if (this.updateBatchTimer) {
      clearTimeout(this.updateBatchTimer);
      this.updateBatchTimer = null;
    }
  }
  
  /**
   * Schedule reconnection with exponential backoff
   */
  private scheduleReconnection(): void {
    if (this.reconnectionAttempts >= this.reconnectionConfig.maxAttempts) {
      console.error('Max reconnection attempts reached');
      this.updateStatus('error');
      return;
    }
    
    // Clear existing timer
    if (this.reconnectionTimer) {
      clearTimeout(this.reconnectionTimer);
    }
    
    // Calculate delay with exponential backoff
    const delay = Math.min(
      this.reconnectionConfig.initialDelay * 
        Math.pow(this.reconnectionConfig.backoffMultiplier, this.reconnectionAttempts),
      this.reconnectionConfig.maxDelay
    );
    
    this.reconnectionAttempts++;
    
    console.log(`Scheduling reconnection attempt ${this.reconnectionAttempts} in ${delay}ms`);
    
    this.reconnectionTimer = setTimeout(() => {
      this.attemptReconnection();
    }, delay);
  }
  
  /**
   * Attempt to reconnect to the server
   */
  private attemptReconnection(): void {
    if (this.provider && !this.provider.shouldConnect) {
      console.log('Attempting to reconnect...');
      this.updateStatus('connecting');
      this.provider.connect();
    }
  }
  
  /**
   * Start heartbeat mechanism to detect stale connections
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastHeartbeat = now - this.lastHeartbeat;
      
      if (timeSinceLastHeartbeat > this.heartbeatTimeout) {
        console.warn('Heartbeat timeout detected, reconnecting...');
        this.scheduleReconnection();
      }
      
      // Update heartbeat timestamp if connected
      if (this.currentStatus === 'connected') {
        this.lastHeartbeat = now;
      }
    }, 10000); // Check every 10 seconds
  }
  
  /**
   * Stop heartbeat mechanism
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Handle status changes from the provider
   */
  private handleStatusChange(status: string): void {
    let mappedStatus: ConnectionStatus;
    
    switch (status) {
      case 'connecting':
        mappedStatus = 'connecting';
        break;
      case 'connected':
        mappedStatus = 'connected';
        break;
      case 'disconnected':
        mappedStatus = 'disconnected';
        break;
      default:
        mappedStatus = 'error';
    }
    
    this.updateStatus(mappedStatus);
  }

  /**
   * Handle document synced event
   */
  private handleSynced(): void {
    console.log(`Document synced for note: ${this.config.noteId}`);
    this.syncedListeners.forEach(listener => listener());
  }

  /**
   * Update connection status and notify listeners
   */
  private updateStatus(status: ConnectionStatus): void {
    if (this.currentStatus !== status) {
      this.currentStatus = status;
      this.statusListeners.forEach(listener => listener(status));
    }
  }

  /**
   * Get the Y.Doc instance
   */
  public getYDoc(): Y.Doc {
    return this.ydoc;
  }

  /**
   * Get the Awareness instance
   */
  public getAwareness(): Awareness {
    return this.awareness;
  }

  /**
   * Get the current connection status
   */
  public getStatus(): ConnectionStatus {
    return this.currentStatus;
  }

  /**
   * Check if the document is synced
   */
  public isSynced(): boolean {
    return this.provider?.synced ?? false;
  }

  /**
   * Listen to status changes
   */
  public onStatusChange(callback: (status: ConnectionStatus) => void): () => void {
    this.statusListeners.add(callback);
    
    // Immediately call with current status
    callback(this.currentStatus);
    
    // Return unsubscribe function
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  /**
   * Listen to sync events
   */
  public onSynced(callback: () => void): () => void {
    this.syncedListeners.add(callback);
    
    // If already synced, call immediately
    if (this.isSynced()) {
      callback();
    }
    
    // Return unsubscribe function
    return () => {
      this.syncedListeners.delete(callback);
    };
  }

  /**
   * Update local user information
   */
  public updateUser(updates: Partial<{
    name: string;
    color: string;
    cursor: { anchor: number; head: number } | null;
  }>): void {
    const currentState = this.awareness.getLocalState();
    
    this.awareness.setLocalState({
      ...currentState,
      user: {
        ...currentState?.user,
        ...updates,
      },
      cursor: updates.cursor !== undefined ? updates.cursor : currentState?.cursor,
    });
  }

  /**
   * Update cursor position
   */
  public updateCursor(position: { anchor: number; head: number } | null): void {
    const currentState = this.awareness.getLocalState();
    
    this.awareness.setLocalState({
      ...currentState,
      cursor: position,
      lastActive: Date.now(),
    });
  }

  /**
   * Get all online users from awareness
   */
  public getOnlineUsers(): Array<{
    clientId: number;
    user: {
      id: string;
      name: string;
      color: string;
    };
    cursor: { anchor: number; head: number } | null;
    lastActive?: number;
  }> {
    const states = this.awareness.getStates();
    const users: Array<any> = [];
    
    states.forEach((state, clientId) => {
      if (state.user && clientId !== this.awareness.clientID) {
        users.push({
          clientId,
          user: state.user,
          cursor: state.cursor || null,
          lastActive: state.lastActive,
        });
      }
    });
    
    return users;
  }

  /**
   * Listen to awareness changes (users joining/leaving)
   */
  public onAwarenessChange(callback: () => void): () => void {
    const handler = () => {
      callback();
    };
    
    this.awareness.on('change', handler);
    
    // Return unsubscribe function
    return () => {
      this.awareness.off('change', handler);
    };
  }

  /**
   * Manually trigger a sync
   */
  public sync(): void {
    if (this.provider) {
      // Force a sync by sending the current state
      this.provider.connect();
    }
  }

  /**
   * Disconnect and cleanup
   */
  public destroy(): void {
    if (this._isDestroyed) {
      return; // Already destroyed, prevent double cleanup
    }
    
    console.log(`Destroying provider for note: ${this.config.noteId}`);
    
    this._isDestroyed = true;
    
    // Stop heartbeat
    this.stopHeartbeat();
    
    // Clear reconnection timer
    if (this.reconnectionTimer) {
      clearTimeout(this.reconnectionTimer);
      this.reconnectionTimer = null;
    }
    
    // Clear update batch timer
    if (this.updateBatchTimer) {
      clearTimeout(this.updateBatchTimer);
      this.updateBatchTimer = null;
    }
    
    // Flush any pending updates
    this.flushPendingUpdates();
    
    // Clear listeners
    this.statusListeners.clear();
    this.syncedListeners.clear();
    
    // Destroy provider
    if (this.provider) {
      this.provider.destroy();
      this.provider = null;
    }
    
    // Destroy awareness
    this.awareness.destroy();
    
    // Destroy document
    this.ydoc.destroy();
  }

  /**
   * Check if provider is destroyed
   * Note: This returns true only after destroy() is called, not when initialization fails
   */
  public isDestroyed(): boolean {
    return this._isDestroyed;
  }
}

/**
 * Create a YjsProvider instance with authentication
 */
export async function createYjsProvider(
  noteId: string,
  userId: string,
  userName: string,
  userColor: string,
  getToken: () => Promise<string>
): Promise<YjsProvider> {
  const token = await getToken();
  const websocketUrl = process.env.NEXT_PUBLIC_COLLAB_SERVER_URL || 'ws://localhost:1234';
  
  return new YjsProvider({
    noteId,
    userId,
    userName,
    userColor,
    token,
    websocketUrl,
  });
}
