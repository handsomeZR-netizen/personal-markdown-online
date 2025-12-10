/**
 * Database Configuration Module
 * 
 * This module handles database configuration, environment variable validation,
 * and database mode detection (local vs Supabase).
 */

/**
 * Database configuration interface
 */
export interface DatabaseConfig {
  mode: 'local' | 'supabase';
  connectionString: string;
  directUrl?: string;
  isSupabaseAvailable: boolean;
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  mode: 'local' | 'supabase';
}

/**
 * Custom error for missing environment variables
 */
export class MissingEnvVarError extends Error {
  constructor(
    public readonly missingVars: string[],
    public readonly mode: 'local' | 'supabase'
  ) {
    super(`Missing required environment variables for ${mode} mode: ${missingVars.join(', ')}`);
    this.name = 'MissingEnvVarError';
  }
}

/**
 * Get the current database mode from environment variables
 */
export function getDatabaseMode(): 'local' | 'supabase' {
  const mode = process.env.DATABASE_MODE?.toLowerCase();
  
  if (mode === 'supabase') {
    return 'supabase';
  }
  
  // Default to local mode
  return 'local';
}

/**
 * Check if Supabase is available and properly configured
 */
export function isSupabaseAvailable(): boolean {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  return !!(supabaseUrl && supabaseAnonKey);
}

/**
 * Get required environment variables for a given mode
 */
function getRequiredEnvVars(mode: 'local' | 'supabase'): string[] {
  const commonVars = ['DATABASE_URL'];
  
  if (mode === 'local') {
    return [...commonVars, 'NEXTAUTH_SECRET', 'AUTH_SECRET'];
  } else {
    return [
      ...commonVars,
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY'
    ];
  }
}

/**
 * Validate environment variables for the current mode
 */
export function validateEnvironmentVariables(mode: 'local' | 'supabase'): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const requiredVars = getRequiredEnvVars(mode);
  const missingVars: string[] = [];
  
  // Check for missing required variables
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
      errors.push(`Missing required environment variable: ${varName}`);
    }
  }
  
  // If there are missing variables, throw an error
  if (missingVars.length > 0) {
    throw new MissingEnvVarError(missingVars, mode);
  }
  
  // Check for optional but recommended variables
  if (mode === 'local') {
    if (!process.env.LOCAL_STORAGE_PATH) {
      warnings.push('LOCAL_STORAGE_PATH not set, using default: ./uploads');
    }
  }
  
  // Check for DIRECT_URL (recommended for migrations)
  if (!process.env.DIRECT_URL) {
    warnings.push('DIRECT_URL not set, using DATABASE_URL for migrations');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    mode
  };
}

/**
 * Get the complete database configuration
 */
export function getDatabaseConfig(): DatabaseConfig {
  const mode = getDatabaseMode();
  
  // Validate environment variables for the current mode
  const validation = validateEnvironmentVariables(mode);
  
  if (!validation.isValid) {
    throw new Error(`Invalid database configuration: ${validation.errors.join(', ')}`);
  }
  
  const connectionString = process.env.DATABASE_URL!;
  const directUrl = process.env.DIRECT_URL;
  const isSupabaseConfigured = isSupabaseAvailable();
  
  return {
    mode,
    connectionString,
    directUrl,
    isSupabaseAvailable: isSupabaseConfigured
  };
}

/**
 * Validate database configuration and return detailed results
 */
export function validateDatabaseConfig(): ValidationResult {
  const mode = getDatabaseMode();
  
  try {
    const validation = validateEnvironmentVariables(mode);
    return validation;
  } catch (error) {
    if (error instanceof MissingEnvVarError) {
      return {
        isValid: false,
        errors: [`Missing required environment variables: ${error.missingVars.join(', ')}`],
        warnings: [],
        mode: error.mode
      };
    }
    
    return {
      isValid: false,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      warnings: [],
      mode
    };
  }
}

/**
 * Get setup instructions for missing environment variables
 */
export function getSetupInstructions(mode: 'local' | 'supabase'): string {
  if (mode === 'local') {
    return `
Local Database Setup Instructions:
1. Copy .env.local.example to .env.local
2. Start the local PostgreSQL database:
   docker-compose up -d
3. Set the following environment variables in .env.local:
   - DATABASE_URL=postgresql://postgres:postgres@localhost:5432/noteapp
   - NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
   - AUTH_SECRET=<same as NEXTAUTH_SECRET>
4. Run database migrations:
   npm run db:migrate
5. Restart the development server

For more details, see: docs/LOCAL_DATABASE_SETUP.md
`;
  } else {
    return `
Supabase Setup Instructions:
1. Copy .env.production.example to .env.local (or .env.production)
2. Create a Supabase project at https://supabase.com
3. Set the following environment variables:
   - DATABASE_URL=<your Supabase connection string>
   - NEXT_PUBLIC_SUPABASE_URL=<your Supabase project URL>
   - NEXT_PUBLIC_SUPABASE_ANON_KEY=<your Supabase anon key>
4. Run database migrations:
   npm run db:migrate
5. Restart the development server

For more details, see: docs/DATABASE_MODES.md
`;
  }
}
