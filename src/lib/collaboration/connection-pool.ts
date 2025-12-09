/**
 * WebSocket Connection Pool Manager
 * Manages multiple WebSocket connections efficiently to reduce overhead
 * and improve performance when working with multiple documents
 */

import { YjsProvider, type YjsProviderConfig } from './yjs-provider';

interface PooledConnection {
  provider: YjsProvider;
  noteId: string;
  lastAccessed: number;
  refCount: number;
}

/**
 * Connection pool configuration
 */
interface ConnectionPoolConfig {
  maxConnections: number;
  idleTimeout: number; // Time in ms before closing idle connections
  cleanupInterval: number; // How often to check for idle connections
}

/**
 * ConnectionPool manages a pool of WebSocket connections
 * to optimize resource usage and connection overhead
 */
export class ConnectionPool {
  private connections: Map<string, PooledConnection> = new Map();
  private config: ConnectionPoolConfig;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(config?: Partial<ConnectionPoolConfig>) {
    this.config = {
      maxConnections: 10,
      idleTimeout: 5 * 60 * 1000, // 5 minutes
      cleanupInterval: 60 * 1000, // 1 minute
      ...config,
    };

    this.startCleanup();
  }

  /**
   * Get or create a connection for a note
   */
  public async getConnection(
    config: YjsProviderConfig
  ): Promise<YjsProvider> {
    const existing = this.connections.get(config.noteId);

    if (existing) {
      // Reuse existing connection
      existing.refCount++;
      existing.lastAccessed = Date.now();
      console.log(`Reusing connection for note ${config.noteId} (refs: ${existing.refCount})`);
      return existing.provider;
    }

    // Check if we need to evict a connection
    if (this.connections.size >= this.config.maxConnections) {
      this.evictLeastRecentlyUsed();
    }

    // Create new connection
    const provider = new YjsProvider(config);
    
    this.connections.set(config.noteId, {
      provider,
      noteId: config.noteId,
      lastAccessed: Date.now(),
      refCount: 1,
    });

    console.log(`Created new connection for note ${config.noteId} (total: ${this.connections.size})`);
    
    return provider;
  }

  /**
   * Release a connection (decrement reference count)
   */
  public releaseConnection(noteId: string): void {
    const connection = this.connections.get(noteId);
    
    if (!connection) {
      console.warn(`Attempted to release non-existent connection: ${noteId}`);
      return;
    }

    connection.refCount--;
    connection.lastAccessed = Date.now();

    console.log(`Released connection for note ${noteId} (refs: ${connection.refCount})`);

    // If no more references and idle, schedule for cleanup
    if (connection.refCount <= 0) {
      connection.refCount = 0;
    }
  }

  /**
   * Force close a specific connection
   */
  public closeConnection(noteId: string): void {
    const connection = this.connections.get(noteId);
    
    if (!connection) {
      return;
    }

    console.log(`Closing connection for note ${noteId}`);
    connection.provider.destroy();
    this.connections.delete(noteId);
  }

  /**
   * Evict the least recently used connection
   */
  private evictLeastRecentlyUsed(): void {
    let oldestConnection: PooledConnection | null = null;
    let oldestNoteId: string | null = null;

    // Find the oldest connection with refCount = 0
    for (const [noteId, connection] of this.connections.entries()) {
      if (connection.refCount === 0) {
        if (!oldestConnection || connection.lastAccessed < oldestConnection.lastAccessed) {
          oldestConnection = connection;
          oldestNoteId = noteId;
        }
      }
    }

    // If no idle connections, evict the oldest one regardless
    if (!oldestConnection) {
      for (const [noteId, connection] of this.connections.entries()) {
        if (!oldestConnection || connection.lastAccessed < oldestConnection.lastAccessed) {
          oldestConnection = connection;
          oldestNoteId = noteId;
        }
      }
    }

    if (oldestNoteId && oldestConnection) {
      console.log(`Evicting connection for note ${oldestNoteId} (LRU policy)`);
      oldestConnection.provider.destroy();
      this.connections.delete(oldestNoteId);
    }
  }

  /**
   * Start periodic cleanup of idle connections
   */
  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupIdleConnections();
    }, this.config.cleanupInterval);
  }

  /**
   * Clean up idle connections that have exceeded the timeout
   */
  private cleanupIdleConnections(): void {
    const now = Date.now();
    const connectionsToClose: string[] = [];

    for (const [noteId, connection] of this.connections.entries()) {
      // Only clean up connections with no active references
      if (connection.refCount === 0) {
        const idleTime = now - connection.lastAccessed;
        
        if (idleTime > this.config.idleTimeout) {
          connectionsToClose.push(noteId);
        }
      }
    }

    if (connectionsToClose.length > 0) {
      console.log(`Cleaning up ${connectionsToClose.length} idle connections`);
      
      for (const noteId of connectionsToClose) {
        this.closeConnection(noteId);
      }
    }
  }

  /**
   * Get pool statistics
   */
  public getStats(): {
    totalConnections: number;
    activeConnections: number;
    idleConnections: number;
  } {
    let active = 0;
    let idle = 0;

    for (const connection of this.connections.values()) {
      if (connection.refCount > 0) {
        active++;
      } else {
        idle++;
      }
    }

    return {
      totalConnections: this.connections.size,
      activeConnections: active,
      idleConnections: idle,
    };
  }

  /**
   * Close all connections and cleanup
   */
  public destroy(): void {
    console.log('Destroying connection pool');
    
    // Stop cleanup timer
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    // Close all connections
    for (const [noteId, connection] of this.connections.entries()) {
      console.log(`Closing connection for note ${noteId}`);
      connection.provider.destroy();
    }

    this.connections.clear();
  }
}

/**
 * Global connection pool instance
 * Use this singleton to manage all WebSocket connections in the application
 */
export const globalConnectionPool = new ConnectionPool({
  maxConnections: 10,
  idleTimeout: 5 * 60 * 1000, // 5 minutes
  cleanupInterval: 60 * 1000, // 1 minute
});

/**
 * Helper function to get a connection from the global pool
 */
export async function getPooledConnection(
  config: YjsProviderConfig
): Promise<YjsProvider> {
  return globalConnectionPool.getConnection(config);
}

/**
 * Helper function to release a connection back to the pool
 */
export function releasePooledConnection(noteId: string): void {
  globalConnectionPool.releaseConnection(noteId);
}
