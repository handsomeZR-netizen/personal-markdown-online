/**
 * 功能适配器 - Supabase 功能降级
 * Feature Adapter - Supabase Feature Degradation
 * 
 * 此模块提供 Supabase 特定功能的抽象,当 Supabase 不可用时优雅降级
 * This module provides abstraction for Supabase-specific features with graceful degradation
 */

export type SupabaseFeature = 'storage' | 'auth' | 'realtime';

export interface FeatureConfig {
  supabaseAvailable: boolean;
  supabaseUrl?: string;
  supabaseKey?: string;
}

export interface FeatureAdapter {
  isAvailable(): boolean;
  performOperation(): Promise<OperationResult>;
  getFeatureName(): SupabaseFeature;
}

export interface OperationResult {
  success: boolean;
  data?: any;
  error?: string;
  fallbackUsed: boolean;
}

/**
 * 存储功能适配器
 * Storage Feature Adapter
 */
export class StorageFeatureAdapter implements FeatureAdapter {
  constructor(private config: FeatureConfig) {}

  isAvailable(): boolean {
    return this.config.supabaseAvailable && 
           !!this.config.supabaseUrl && 
           !!this.config.supabaseKey;
  }

  async performOperation(): Promise<OperationResult> {
    if (this.isAvailable()) {
      // Supabase Storage 可用
      return {
        success: true,
        data: { provider: 'supabase', path: '/storage/uploads' },
        fallbackUsed: false,
      };
    } else {
      // 降级到本地文件系统
      return {
        success: true,
        data: { provider: 'local', path: './uploads' },
        fallbackUsed: true,
      };
    }
  }

  getFeatureName(): SupabaseFeature {
    return 'storage';
  }
}

/**
 * 认证功能适配器
 * Auth Feature Adapter
 */
export class AuthFeatureAdapter implements FeatureAdapter {
  constructor(private config: FeatureConfig) {}

  isAvailable(): boolean {
    return this.config.supabaseAvailable && 
           !!this.config.supabaseUrl && 
           !!this.config.supabaseKey;
  }

  async performOperation(): Promise<OperationResult> {
    if (this.isAvailable()) {
      // Supabase Auth 可用
      return {
        success: true,
        data: { provider: 'supabase-auth', method: 'magic-link' },
        fallbackUsed: false,
      };
    } else {
      // 降级到 NextAuth
      return {
        success: true,
        data: { provider: 'nextauth', method: 'credentials' },
        fallbackUsed: true,
      };
    }
  }

  getFeatureName(): SupabaseFeature {
    return 'auth';
  }
}

/**
 * 实时功能适配器
 * Realtime Feature Adapter
 */
export class RealtimeFeatureAdapter implements FeatureAdapter {
  constructor(private config: FeatureConfig) {}

  isAvailable(): boolean {
    return this.config.supabaseAvailable && 
           !!this.config.supabaseUrl && 
           !!this.config.supabaseKey;
  }

  async performOperation(): Promise<OperationResult> {
    if (this.isAvailable()) {
      // Supabase Realtime 可用
      return {
        success: true,
        data: { provider: 'supabase-realtime', protocol: 'websocket' },
        fallbackUsed: false,
      };
    } else {
      // 降级到轮询或禁用
      return {
        success: true,
        data: { provider: 'polling', protocol: 'http', interval: 5000 },
        fallbackUsed: true,
      };
    }
  }

  getFeatureName(): SupabaseFeature {
    return 'realtime';
  }
}

/**
 * 获取功能适配器
 * Get Feature Adapter
 */
export function getFeatureAdapter(
  feature: SupabaseFeature,
  config: FeatureConfig
): FeatureAdapter {
  switch (feature) {
    case 'storage':
      return new StorageFeatureAdapter(config);
    case 'auth':
      return new AuthFeatureAdapter(config);
    case 'realtime':
      return new RealtimeFeatureAdapter(config);
    default:
      throw new Error(`Unknown feature: ${feature}`);
  }
}

/**
 * 检查 Supabase 配置
 * Check Supabase Configuration
 */
export function checkSupabaseConfig(): FeatureConfig {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const databaseMode = process.env.DATABASE_MODE;

  return {
    supabaseAvailable: databaseMode === 'supabase' && !!supabaseUrl && !!supabaseKey,
    supabaseUrl,
    supabaseKey,
  };
}
