import { HocuspocusProvider } from '@hocuspocus/provider';
import * as Y from 'yjs';
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
 */
export class YjsProvider {
  private ydoc: Y.Doc;
  private provider: HocuspocusProvider | null = null;
  private awareness: Awareness;
  private config: YjsProviderConfig;
  private statusListeners: Set<(status: ConnectionStatus) => void> = new Set();
  private syncedListeners: Set<() => void> = new Set();
  private currentStatus: ConnectionStatus = 'disconnected';
  private _isDestroyed = false;
  private _initializationFailed = false;

  // Reconnection state
  private reconnectionAttempts = 0;
  private reconnectionConfig: ReconnectionConfig = {
    maxAttempts: 10,
    initialDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 1.6,
  };
  private reconnectionTimer: NodeJS.Timeout | null = null;

  // Heartbeat
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private lastHeartbeat = Date.now();
  private heartbeatTimeout = 30000;

  constructor(config: YjsProviderConfig) {
    this.config = config;
    this.ydoc = new Y.Doc();
    this.awareness = new Awareness(this.ydoc);

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

  private initializeProvider(): void {
    try {
      this.provider = new HocuspocusProvider({
        url: this.config.websocketUrl,
        name: this.config.noteId,
        document: this.ydoc,
        awareness: this.awareness,
        token: this.config.token,
        onStatus: ({ status }) => this.handleStatusChange(status),
        onSynced: () => this.handleSynced(),
        onConnect: () => {
          this.reconnectionAttempts = 0;
          this.lastHeartbeat = Date.now();
        },
        onDisconnect: () => this.scheduleReconnection(),
        onAuthenticationFailed: () => this.updateStatus('error'),
        onClose: () => this.scheduleReconnection(),
        maxAttempts: this.reconnectionConfig.maxAttempts,
        delay: this.reconnectionConfig.initialDelay,
        timeout: 30000,
        quiet: process.env.NODE_ENV === 'production',
      });
    } catch (error) {
      console.error('Failed to initialize provider:', error);
      this._initializationFailed = true;
      this.updateStatus('error');
      this.scheduleReconnection();
    }
  }

  public hasInitializationFailed(): boolean {
    return this._initializationFailed;
  }

  private scheduleReconnection(): void {
    if (this.reconnectionAttempts >= this.reconnectionConfig.maxAttempts) {
      this.updateStatus('error');
      return;
    }
    if (this.reconnectionTimer) {
      clearTimeout(this.reconnectionTimer);
    }
    const delay = Math.min(
      this.reconnectionConfig.initialDelay *
        Math.pow(this.reconnectionConfig.backoffMultiplier, this.reconnectionAttempts),
      this.reconnectionConfig.maxDelay,
    );
    this.reconnectionAttempts += 1;
    this.reconnectionTimer = setTimeout(() => this.attemptReconnection(), delay);
  }

  private attemptReconnection(): void {
    if (this.provider && !this.provider.shouldConnect) {
      this.updateStatus('connecting');
      this.provider.connect();
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      if (now - this.lastHeartbeat > this.heartbeatTimeout) {
        this.scheduleReconnection();
      }
      if (this.currentStatus === 'connected') {
        this.lastHeartbeat = now;
      }
    }, 10000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private handleStatusChange(status: string): void {
    const mapped: ConnectionStatus =
      status === 'connected'
        ? 'connected'
        : status === 'connecting'
          ? 'connecting'
          : status === 'disconnected'
            ? 'disconnected'
            : 'error';
    this.updateStatus(mapped);
  }

  private handleSynced(): void {
    this.syncedListeners.forEach((listener) => listener());
  }

  private updateStatus(status: ConnectionStatus): void {
    if (this.currentStatus !== status) {
      this.currentStatus = status;
      this.statusListeners.forEach((listener) => listener(status));
    }
  }

  public getYDoc(): Y.Doc {
    return this.ydoc;
  }

  public getAwareness(): Awareness {
    return this.awareness;
  }

  public getStatus(): ConnectionStatus {
    return this.currentStatus;
  }

  public isSynced(): boolean {
    return this.provider?.synced ?? false;
  }

  public onStatusChange(callback: (status: ConnectionStatus) => void): () => void {
    this.statusListeners.add(callback);
    callback(this.currentStatus);
    return () => this.statusListeners.delete(callback);
  }

  public onSynced(callback: () => void): () => void {
    this.syncedListeners.add(callback);
    if (this.isSynced()) {
      callback();
    }
    return () => this.syncedListeners.delete(callback);
  }

  public updateUser(updates: Partial<{ name: string; color: string; cursor: { anchor: number; head: number } | null }>): void {
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

  public updateCursor(position: { anchor: number; head: number } | null): void {
    const currentState = this.awareness.getLocalState();
    this.awareness.setLocalState({
      ...currentState,
      cursor: position,
      lastActive: Date.now(),
    });
  }

  public getOnlineUsers(): Array<{
    clientId: number;
    user: { id: string; name: string; color: string };
    cursor: { anchor: number; head: number } | null;
    lastActive?: number;
  }> {
    const users: Array<any> = [];
    this.awareness.getStates().forEach((state, clientId) => {
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

  public onAwarenessChange(callback: () => void): () => void {
    const handler = () => callback();
    this.awareness.on('change', handler);
    return () => this.awareness.off('change', handler);
  }

  public sync(): void {
    if (this.provider) {
      this.provider.connect();
    }
  }

  public destroy(): void {
    if (this._isDestroyed) return;
    this._isDestroyed = true;
    this.stopHeartbeat();
    if (this.reconnectionTimer) {
      clearTimeout(this.reconnectionTimer);
      this.reconnectionTimer = null;
    }
    this.statusListeners.clear();
    this.syncedListeners.clear();
    this.provider?.destroy();
    this.awareness.destroy();
    this.ydoc.destroy();
  }

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
  getToken: () => Promise<string>,
): Promise<YjsProvider> {
  const token = await getToken();
  const websocketUrl = process.env.NEXT_PUBLIC_COLLAB_SERVER_URL || 'ws://localhost:1234';
  return new YjsProvider({ noteId, userId, userName, userColor, token, websocketUrl });
}
