/**
 * Authentication module exports
 */

export {
  type User,
  type Credentials,
  type UserData,
  type Session,
  type AuthResult,
  type AuthAdapter,
  NextAuthAdapter,
  SupabaseAuthAdapter,
  getAuthAdapter,
} from './auth-adapter';
