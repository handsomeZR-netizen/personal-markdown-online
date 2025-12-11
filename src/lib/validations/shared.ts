/**
 * Shared validation schemas for Zod 4 compatibility
 */

import { z } from 'zod'

/**
 * ID validation - accepts CUID format or any non-empty string ID
 * CUID format: c + 24 alphanumeric characters (e.g., c1234567890123456789abcde)
 * Also accepts other ID formats used in the database
 */
export const cuidSchema = z.string().min(1, 'ID is required')

/**
 * ID schema with custom error message
 * Accepts any non-empty string ID for flexibility with different ID formats
 */
export function cuid(message?: string) {
  return z.string().min(1, message || 'ID is required')
}

/**
 * Email schema using Zod 4 top-level API
 */
export const emailSchema = z.email('Invalid email address')
