/**
 * Authentication Adapter Module
 * 
 * This module provides a unified authentication interface that works with both
 * NextAuth (local mode) and Supabase Auth (Supabase mode).
 */

import { getDatabaseConfig } from '../db-config';

/**
 * User interface representing authenticated user data
 */
export interface User {
  id: string;
  email: string;
  name?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Credentials for sign in
 */
export interface Credentials {
  email: string;
  password: string;
}

/**
 * User data for sign up
 */
export interface UserData {
  email: string;
  password: string;
  name?: string;
}

/**
 * Session interface
 */
export interface Session {
  user: User;
  expires: string;
}

/**
 * Authentication result
 */
export interface AuthResult<T = User> {
  data?: T;
  error?: string;
}

/**
 * Unified authentication adapter interface
 */
export interface AuthAdapter {
  /**
   * Sign in a user with credentials
   */
  signIn(credentials: Credentials): Promise<AuthResult<User>>;
  
  /**
   * Sign up a new user
   */
  signUp(userData: UserData): Promise<AuthResult<User>>;
  
  /**
   * Sign out the current user
   */
  signOut(): Promise<AuthResult<void>>;
  
  /**
   * Get the current session
   */
  getSession(): Promise<Session | null>;
  
  /**
   * Get user by ID
   */
  getUserById(id: string): Promise<AuthResult<User>>;
  
  /**
   * Get user by email
   */
  getUserByEmail(email: string): Promise<AuthResult<User>>;
}

/**
 * NextAuth adapter for local authentication
 */
export class NextAuthAdapter implements AuthAdapter {
  async signIn(credentials: Credentials): Promise<AuthResult<User>> {
    try {
      const { prisma } = await import('../prisma');
      const bcrypt = await import('bcryptjs');
      
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email: credentials.email },
        select: {
          id: true,
          email: true,
          name: true,
          password: true,
          createdAt: true,
          updatedAt: true,
        }
      });
      
      if (!user) {
        return { error: 'Invalid credentials' };
      }
      
      // Verify password
      const isValid = await bcrypt.compare(credentials.password, user.password);
      
      if (!isValid) {
        return { error: 'Invalid credentials' };
      }
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      return { data: userWithoutPassword };
    } catch (error) {
      console.error('NextAuth sign in error:', error);
      return { error: 'Failed to sign in' };
    }
  }
  
  async signUp(userData: UserData): Promise<AuthResult<User>> {
    try {
      const { prisma } = await import('../prisma');
      const bcrypt = await import('bcryptjs');
      
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });
      
      if (existingUser) {
        return { error: 'User already exists' };
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      // Create user
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          password: hashedPassword,
          name: userData.name || null,
        },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        }
      });
      
      return { data: user };
    } catch (error) {
      console.error('NextAuth sign up error:', error);
      return { error: 'Failed to sign up' };
    }
  }
  
  async signOut(): Promise<AuthResult<void>> {
    try {
      // NextAuth sign out is handled by the framework
      // This is a placeholder for consistency
      return { data: undefined, error: undefined };
    } catch (error) {
      console.error('NextAuth sign out error:', error);
      return { data: undefined, error: 'Failed to sign out' };
    }
  }
  
  async getSession(): Promise<Session | null> {
    try {
      const { auth } = await import('../../auth');
      const session = await auth();
      
      if (!session || !session.user) {
        return null;
      }
      
      return session as Session;
    } catch (error) {
      console.error('NextAuth get session error:', error);
      return null;
    }
  }
  
  async getUserById(id: string): Promise<AuthResult<User>> {
    try {
      const { prisma } = await import('../prisma');
      
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        }
      });
      
      if (!user) {
        return { error: 'User not found' };
      }
      
      return { data: user };
    } catch (error) {
      console.error('NextAuth get user by ID error:', error);
      return { error: 'Failed to get user' };
    }
  }
  
  async getUserByEmail(email: string): Promise<AuthResult<User>> {
    try {
      const { prisma } = await import('../prisma');
      
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        }
      });
      
      if (!user) {
        return { error: 'User not found' };
      }
      
      return { data: user };
    } catch (error) {
      console.error('NextAuth get user by email error:', error);
      return { error: 'Failed to get user' };
    }
  }
}

/**
 * Supabase Auth adapter
 */
export class SupabaseAuthAdapter implements AuthAdapter {
  async signIn(credentials: Credentials): Promise<AuthResult<User>> {
    try {
      const { signIn: supabaseSignIn } = await import('../supabase-auth');
      const result = await supabaseSignIn(credentials);
      
      if (result.error) {
        return { error: result.error };
      }
      
      return { data: result.data as User };
    } catch (error) {
      console.error('Supabase sign in error:', error);
      return { error: 'Failed to sign in' };
    }
  }
  
  async signUp(userData: UserData): Promise<AuthResult<User>> {
    try {
      const { signUp: supabaseSignUp } = await import('../supabase-auth');
      const result = await supabaseSignUp(userData);
      
      if (result.error) {
        return { error: result.error };
      }
      
      return { data: result.data as User };
    } catch (error) {
      console.error('Supabase sign up error:', error);
      return { error: 'Failed to sign up' };
    }
  }
  
  async signOut(): Promise<AuthResult<void>> {
    try {
      // Supabase sign out would be handled by Supabase client
      // This is a placeholder for consistency
      return { data: undefined, error: undefined };
    } catch (error) {
      console.error('Supabase sign out error:', error);
      return { data: undefined, error: 'Failed to sign out' };
    }
  }
  
  async getSession(): Promise<Session | null> {
    try {
      // In Supabase mode, session is typically managed by Supabase client
      // This would need to be implemented based on your Supabase setup
      return null;
    } catch (error) {
      console.error('Supabase get session error:', error);
      return null;
    }
  }
  
  async getUserById(id: string): Promise<AuthResult<User>> {
    try {
      const { getUserById: supabaseGetUserById } = await import('../supabase-auth');
      const result = await supabaseGetUserById(id);
      
      if (result.error) {
        return { error: result.error };
      }
      
      return { data: result.data as User };
    } catch (error) {
      console.error('Supabase get user by ID error:', error);
      return { error: 'Failed to get user' };
    }
  }
  
  async getUserByEmail(email: string): Promise<AuthResult<User>> {
    try {
      const { getUserByEmail: supabaseGetUserByEmail } = await import('../supabase-auth');
      const result = await supabaseGetUserByEmail(email);
      
      if (result.error) {
        return { error: result.error };
      }
      
      return { data: result.data as User };
    } catch (error) {
      console.error('Supabase get user by email error:', error);
      return { error: 'Failed to get user' };
    }
  }
}

/**
 * Factory function to get the appropriate auth adapter based on configuration
 */
export function getAuthAdapter(): AuthAdapter {
  const config = getDatabaseConfig();
  
  if (config.mode === 'supabase' && config.isSupabaseAvailable) {
    return new SupabaseAuthAdapter();
  }
  
  // Default to NextAuth for local mode
  return new NextAuthAdapter();
}
