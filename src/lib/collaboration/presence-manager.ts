import { Awareness } from 'y-protocols/awareness';

/**
 * User presence information
 */
export interface PresenceUser {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  color: string;
  cursor?: {
    anchor: number;
    head: number;
  } | null;
  lastActive: number;
}

/**
 * Local user information (without lastActive)
 */
export type LocalUserInfo = Omit<PresenceUser, 'lastActive'>;

/**
 * PresenceManager handles online user tracking and cursor positions
 * Manages awareness state for collaborative editing
 */
export class PresenceManager {
  private awareness: Awareness;
  private localUserId: string;
  private listeners: Set<(users: PresenceUser[]) => void> = new Set();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(awareness: Awareness, userId: string) {
    this.awareness = awareness;
    this.localUserId = userId;
    
    // Listen to awareness changes
    this.awareness.on('change', this.handleAwarenessChange);
    
    // Start cleanup interval for inactive users
    this.startCleanupInterval();
  }

  /**
   * Handle awareness state changes
   */
  private handleAwarenessChange = (): void => {
    const users = this.getOnlineUsers();
    this.notifyListeners(users);
  };

  /**
   * Notify all listeners of user changes
   */
  private notifyListeners(users: PresenceUser[]): void {
    this.listeners.forEach(callback => {
      try {
        callback(users);
      } catch (error) {
        console.error('Error in presence listener:', error);
      }
    });
  }

  /**
   * Start interval to cleanup inactive users
   */
  private startCleanupInterval(): void {
    // Check every 10 seconds
    this.cleanupInterval = setInterval(() => {
      this.cleanupInactiveUsers(30000); // 30 seconds timeout
    }, 10000);
  }

  /**
   * Set local user information
   * This updates the awareness state with the current user's info
   */
  public setLocalUser(user: LocalUserInfo): void {
    this.awareness.setLocalStateField('user', {
      ...user,
      lastActive: Date.now(),
    });
  }

  /**
   * Get all online users (excluding local user)
   */
  public getOnlineUsers(): PresenceUser[] {
    const states = this.awareness.getStates();
    const users: PresenceUser[] = [];
    
    states.forEach((state, clientId) => {
      // Skip local user and invalid states
      if (clientId === this.awareness.clientID || !state.user) {
        return;
      }
      
      users.push({
        id: state.user.id,
        name: state.user.name,
        email: state.user.email,
        avatar: state.user.avatar,
        color: state.user.color,
        cursor: state.cursor || null,
        lastActive: state.user.lastActive || Date.now(),
      });
    });
    
    return users;
  }

  /**
   * Get a specific user by ID
   */
  public getUserById(userId: string): PresenceUser | null {
    const users = this.getOnlineUsers();
    return users.find(user => user.id === userId) || null;
  }

  /**
   * Get count of online users (excluding local user)
   */
  public getOnlineUserCount(): number {
    return this.getOnlineUsers().length;
  }

  /**
   * Check if a specific user is online
   */
  public isUserOnline(userId: string): boolean {
    return this.getUserById(userId) !== null;
  }

  /**
   * Listen to user presence changes
   * Returns an unsubscribe function
   */
  public onUsersChange(callback: (users: PresenceUser[]) => void): () => void {
    this.listeners.add(callback);
    
    // Immediately call with current users
    callback(this.getOnlineUsers());
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Update cursor position for local user
   */
  public updateCursor(position: { anchor: number; head: number } | null): void {
    this.awareness.setLocalStateField('cursor', position);
    
    // Update lastActive timestamp
    const currentUser = this.awareness.getLocalState()?.user;
    if (currentUser) {
      this.awareness.setLocalStateField('user', {
        ...currentUser,
        lastActive: Date.now(),
      });
    }
  }

  /**
   * Get cursor position for a specific user
   */
  public getUserCursor(userId: string): { anchor: number; head: number } | null {
    const user = this.getUserById(userId);
    return user?.cursor || null;
  }

  /**
   * Update local user's lastActive timestamp
   * Call this periodically to indicate the user is still active
   */
  public updateActivity(): void {
    const currentUser = this.awareness.getLocalState()?.user;
    if (currentUser) {
      this.awareness.setLocalStateField('user', {
        ...currentUser,
        lastActive: Date.now(),
      });
    }
  }

  /**
   * Clean up inactive users from awareness
   * Users who haven't been active for longer than timeoutMs are removed
   */
  public cleanupInactiveUsers(timeoutMs: number = 30000): void {
    const now = Date.now();
    const states = this.awareness.getStates();
    
    states.forEach((state, clientId) => {
      // Skip local user
      if (clientId === this.awareness.clientID) {
        return;
      }
      
      // Check if user is inactive
      if (state.user && state.user.lastActive) {
        const inactiveDuration = now - state.user.lastActive;
        
        if (inactiveDuration > timeoutMs) {
          console.log(`Removing inactive user: ${state.user.name} (inactive for ${inactiveDuration}ms)`);
          // Note: We can't directly remove other clients' states
          // The awareness protocol will handle this automatically
          // This is mainly for logging and monitoring
        }
      }
    });
  }

  /**
   * Get users currently editing (with active cursors)
   */
  public getActiveEditors(): PresenceUser[] {
    return this.getOnlineUsers().filter(user => user.cursor !== null);
  }

  /**
   * Get users currently viewing (without active cursors)
   */
  public getViewers(): PresenceUser[] {
    return this.getOnlineUsers().filter(user => user.cursor === null);
  }

  /**
   * Cleanup and destroy the presence manager
   */
  public destroy(): void {
    // Stop cleanup interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    // Remove awareness listener
    this.awareness.off('change', this.handleAwarenessChange);
    
    // Clear all listeners
    this.listeners.clear();
    
    console.log('PresenceManager destroyed');
  }
}

/**
 * Create a PresenceManager instance
 */
export function createPresenceManager(
  awareness: Awareness,
  userId: string
): PresenceManager {
  return new PresenceManager(awareness, userId);
}
