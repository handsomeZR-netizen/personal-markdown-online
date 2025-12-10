/**
 * Integration Test: Database Mode Switching
 * Tests seamless switching between local and Supabase modes
 * Requirements: 3.4, 4.3 from local-database-migration spec
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { 
  getDatabaseMode, 
  getDatabaseConfig,
  isSupabaseAvailable,
  validateEnvironmentVariables,
  getSetupInstructions
} from '@/lib/db-config';

describe('Integration: Database Mode Switching', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('1. Basic Mode Switching', () => {
    it('should switch from local to Supabase mode seamlessly', () => {
      // Requirement 3.4: Mode switching via environment variables only
      
      // Start in local mode
      process.env.DATABASE_MODE = 'local';
      process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/noteapp';
      process.env.NEXTAUTH_SECRET = 'test-secret';
      process.env.AUTH_SECRET = 'test-secret';
      
      let mode = getDatabaseMode();
      let config = getDatabaseConfig();
      
      expect(mode).toBe('local');
      expect(config.mode).toBe('local');
      expect(config.connectionString).toContain('localhost');
      expect(config.isSupabaseAvailable).toBe(false);
      
      // Switch to Supabase mode
      process.env.DATABASE_MODE = 'supabase';
      process.env.DATABASE_URL = 'postgresql://postgres:password@db.project.supabase.co:6543/postgres';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
      
      mode = getDatabaseMode();
      config = getDatabaseConfig();
      
      expect(mode).toBe('supabase');
      expect(config.mode).toBe('supabase');
      expect(config.connectionString).toContain('supabase.co');
      expect(config.isSupabaseAvailable).toBe(true);
    });

    it('should switch from Supabase to local mode seamlessly', () => {
      // Requirement 3.4: Bidirectional mode switching
      
      // Start in Supabase mode
      process.env.DATABASE_MODE = 'supabase';
      process.env.DATABASE_URL = 'postgresql://postgres:password@db.project.supabase.co:6543/postgres';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
      
      let mode = getDatabaseMode();
      let config = getDatabaseConfig();
      
      expect(mode).toBe('supabase');
      expect(config.isSupabaseAvailable).toBe(true);
      
      // Switch to local mode
      process.env.DATABASE_MODE = 'local';
      process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/noteapp';
      process.env.NEXTAUTH_SECRET = 'test-secret';
      process.env.AUTH_SECRET = 'test-secret';
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      mode = getDatabaseMode();
      config = getDatabaseConfig();
      
      expect(mode).toBe('local');
      expect(config.mode).toBe('local');
      expect(config.connectionString).toContain('localhost');
      expect(config.isSupabaseAvailable).toBe(false);
    });

    it('should handle multiple mode switches', () => {
      // Requirement 3.4: Repeated mode switching
      const modes: ('local' | 'supabase')[] = [];
      
      // Local
      process.env.DATABASE_MODE = 'local';
      process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/noteapp';
      process.env.NEXTAUTH_SECRET = 'test-secret';
      process.env.AUTH_SECRET = 'test-secret';
      modes.push(getDatabaseMode());
      
      // Supabase
      process.env.DATABASE_MODE = 'supabase';
      process.env.DATABASE_URL = 'postgresql://postgres:password@db.project.supabase.co:6543/postgres';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
      modes.push(getDatabaseMode());
      
      // Local again
      process.env.DATABASE_MODE = 'local';
      process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/noteapp';
      modes.push(getDatabaseMode());
      
      // Supabase again
      process.env.DATABASE_MODE = 'supabase';
      modes.push(getDatabaseMode());
      
      expect(modes).toEqual(['local', 'supabase', 'local', 'supabase']);
    });
  });

  describe('2. Configuration Consistency During Switching', () => {
    it('should maintain configuration integrity when switching modes', () => {
      // Requirement 4.3: No code changes required for mode switching
      
      // Local mode configuration
      const localEnv = {
        DATABASE_MODE: 'local',
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/noteapp',
        DIRECT_URL: 'postgresql://postgres:postgres@localhost:5432/noteapp',
        NEXTAUTH_SECRET: 'local-secret',
        AUTH_SECRET: 'local-secret',
        LOCAL_STORAGE_PATH: './uploads'
      };
      
      // Supabase mode configuration
      const supabaseEnv = {
        DATABASE_MODE: 'supabase',
        DATABASE_URL: 'postgresql://postgres:password@db.project.supabase.co:6543/postgres',
        DIRECT_URL: 'postgresql://postgres:password@db.project.supabase.co:5432/postgres',
        NEXT_PUBLIC_SUPABASE_URL: 'https://project.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'supabase-anon-key',
        SUPABASE_SERVICE_ROLE_KEY: 'supabase-service-key'
      };
      
      // Test local mode
      Object.assign(process.env, localEnv);
      let config = getDatabaseConfig();
      expect(config.mode).toBe('local');
      expect(config.connectionString).toBe(localEnv.DATABASE_URL);
      expect(config.directUrl).toBe(localEnv.DIRECT_URL);
      
      // Test Supabase mode
      Object.assign(process.env, supabaseEnv);
      config = getDatabaseConfig();
      expect(config.mode).toBe('supabase');
      expect(config.connectionString).toBe(supabaseEnv.DATABASE_URL);
      expect(config.directUrl).toBe(supabaseEnv.DIRECT_URL);
    });

    it('should validate configuration correctly after mode switch', () => {
      // Requirement 3.4, 7.1: Validation after mode switching
      
      // Start in local mode
      process.env.DATABASE_MODE = 'local';
      process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/noteapp';
      process.env.NEXTAUTH_SECRET = 'test-secret';
      process.env.AUTH_SECRET = 'test-secret';
      
      let validation = validateEnvironmentVariables('local');
      expect(validation.isValid).toBe(true);
      expect(validation.mode).toBe('local');
      
      // Switch to Supabase mode
      process.env.DATABASE_MODE = 'supabase';
      process.env.DATABASE_URL = 'postgresql://postgres:password@db.project.supabase.co:6543/postgres';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
      
      validation = validateEnvironmentVariables('supabase');
      expect(validation.isValid).toBe(true);
      expect(validation.mode).toBe('supabase');
    });

    it('should provide correct setup instructions for each mode', () => {
      // Requirement 6.1, 6.2: Mode-specific documentation
      
      // Local mode instructions
      process.env.DATABASE_MODE = 'local';
      const localInstructions = getSetupInstructions('local');
      expect(localInstructions).toContain('docker-compose');
      expect(localInstructions).toContain('NEXTAUTH_SECRET');
      expect(localInstructions).not.toContain('supabase.com');
      
      // Supabase mode instructions
      process.env.DATABASE_MODE = 'supabase';
      const supabaseInstructions = getSetupInstructions('supabase');
      expect(supabaseInstructions).toContain('supabase.com');
      expect(supabaseInstructions).toContain('NEXT_PUBLIC_SUPABASE_URL');
      expect(supabaseInstructions).not.toContain('docker-compose');
    });
  });

  describe('3. Hybrid Mode Support', () => {
    it('should support local database with Supabase features', () => {
      // Requirement 3.2, 3.3: Optional Supabase features
      
      // Local mode with Supabase configured
      process.env.DATABASE_MODE = 'local';
      process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/noteapp';
      process.env.NEXTAUTH_SECRET = 'test-secret';
      process.env.AUTH_SECRET = 'test-secret';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
      
      const mode = getDatabaseMode();
      const config = getDatabaseConfig();
      const supabaseAvailable = isSupabaseAvailable();
      
      expect(mode).toBe('local');
      expect(config.mode).toBe('local');
      expect(config.connectionString).toContain('localhost');
      expect(supabaseAvailable).toBe(true); // Supabase features available
    });

    it('should handle Supabase mode without optional features', () => {
      // Requirement 3.3: Graceful degradation
      
      // Supabase mode with minimal configuration
      process.env.DATABASE_MODE = 'supabase';
      process.env.DATABASE_URL = 'postgresql://postgres:password@db.project.supabase.co:6543/postgres';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      const mode = getDatabaseMode();
      const config = getDatabaseConfig();
      
      expect(mode).toBe('supabase');
      expect(config.isSupabaseAvailable).toBe(true);
    });
  });

  describe('4. Error Handling During Mode Switching', () => {
    it('should detect missing variables when switching to local mode', () => {
      // Requirement 7.2: Error detection during mode switching
      
      // Start in Supabase mode
      process.env.DATABASE_MODE = 'supabase';
      process.env.DATABASE_URL = 'postgresql://postgres:password@db.project.supabase.co:6543/postgres';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
      
      // Switch to local mode without proper configuration
      process.env.DATABASE_MODE = 'local';
      delete process.env.NEXTAUTH_SECRET;
      delete process.env.AUTH_SECRET;
      
      expect(() => {
        validateEnvironmentVariables('local');
      }).toThrow();
    });

    it('should detect missing variables when switching to Supabase mode', () => {
      // Requirement 7.2: Error detection during mode switching
      
      // Start in local mode
      process.env.DATABASE_MODE = 'local';
      process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/noteapp';
      process.env.NEXTAUTH_SECRET = 'test-secret';
      process.env.AUTH_SECRET = 'test-secret';
      
      // Switch to Supabase mode without proper configuration
      process.env.DATABASE_MODE = 'supabase';
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      expect(() => {
        validateEnvironmentVariables('supabase');
      }).toThrow();
    });

    it('should provide helpful error messages during failed mode switch', () => {
      // Requirement 7.2, 7.4: Actionable error messages
      
      process.env.DATABASE_MODE = 'supabase';
      process.env.DATABASE_URL = 'postgresql://postgres:password@db.project.supabase.co:6543/postgres';
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      try {
        validateEnvironmentVariables('supabase');
        fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).toContain('NEXT_PUBLIC_SUPABASE_URL');
        expect(error.message).toContain('NEXT_PUBLIC_SUPABASE_ANON_KEY');
        expect(error.missingVars).toContain('NEXT_PUBLIC_SUPABASE_URL');
        expect(error.missingVars).toContain('NEXT_PUBLIC_SUPABASE_ANON_KEY');
      }
    });
  });

  describe('5. Complete Mode Switching Workflows', () => {
    it('should complete development to production workflow', () => {
      // Integration test: Requirements 3.4, 3.5, 4.3
      
      // Step 1: Development with local database
      process.env.DATABASE_MODE = 'local';
      process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/noteapp';
      process.env.NEXTAUTH_SECRET = 'dev-secret';
      process.env.AUTH_SECRET = 'dev-secret';
      
      let mode = getDatabaseMode();
      let config = getDatabaseConfig();
      
      expect(mode).toBe('local');
      expect(config.connectionString).toContain('localhost');
      
      // Step 2: Deploy to production with Supabase
      process.env.DATABASE_MODE = 'supabase';
      process.env.DATABASE_URL = 'postgresql://postgres:prod-password@db.project.supabase.co:6543/postgres';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'prod-anon-key';
      
      mode = getDatabaseMode();
      config = getDatabaseConfig();
      
      expect(mode).toBe('supabase');
      expect(config.connectionString).toContain('supabase.co');
      expect(config.isSupabaseAvailable).toBe(true);
    });

    it('should handle testing environment mode switching', () => {
      // Integration test: Requirements 3.4, 4.3
      
      const environments = [
        {
          name: 'development',
          mode: 'local' as const,
          url: 'postgresql://postgres:postgres@localhost:5432/noteapp_dev'
        },
        {
          name: 'testing',
          mode: 'local' as const,
          url: 'postgresql://postgres:postgres@localhost:5432/noteapp_test'
        },
        {
          name: 'staging',
          mode: 'supabase' as const,
          url: 'postgresql://postgres:password@db.staging.supabase.co:6543/postgres'
        },
        {
          name: 'production',
          mode: 'supabase' as const,
          url: 'postgresql://postgres:password@db.prod.supabase.co:6543/postgres'
        }
      ];
      
      environments.forEach(env => {
        process.env.DATABASE_MODE = env.mode;
        process.env.DATABASE_URL = env.url;
        
        if (env.mode === 'local') {
          process.env.NEXTAUTH_SECRET = `${env.name}-secret`;
          process.env.AUTH_SECRET = `${env.name}-secret`;
        } else {
          process.env.NEXT_PUBLIC_SUPABASE_URL = `https://${env.name}.supabase.co`;
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = `${env.name}-anon-key`;
        }
        
        const mode = getDatabaseMode();
        const config = getDatabaseConfig();
        
        expect(mode).toBe(env.mode);
        expect(config.connectionString).toBe(env.url);
      });
    });
  });
});
