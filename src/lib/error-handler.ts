import { toast } from 'sonner'

/**
 * Error types for better error handling
 */
export enum ErrorType {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NOT_FOUND = 'not_found',
  SERVER = 'server',
  NETWORK = 'network',
  UNKNOWN = 'unknown',
}

/**
 * Custom error class with type information
 */
export class AppError extends Error {
  type: ErrorType
  statusCode?: number

  constructor(message: string, type: ErrorType = ErrorType.UNKNOWN, statusCode?: number) {
    super(message)
    this.name = 'AppError'
    this.type = type
    this.statusCode = statusCode
  }
}

/**
 * Get user-friendly error message based on error type
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  return '发生了一个未知错误'
}

/**
 * Handle error and show toast notification
 */
export function handleError(error: unknown, customMessage?: string): void {
  const message = customMessage || getErrorMessage(error)
  
  console.error('Error:', error)
  toast.error(message)
}

/**
 * Handle success and show toast notification
 */
export function handleSuccess(message: string): void {
  toast.success(message)
}

/**
 * Handle info and show toast notification
 */
export function handleInfo(message: string): void {
  toast.info(message)
}

/**
 * Wrap async function with error handling
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  errorMessage?: string
): Promise<T | null> {
  try {
    return await fn()
  } catch (error) {
    handleError(error, errorMessage)
    return null
  }
}

/**
 * Create a safe async handler for form submissions
 */
export function createSafeHandler<T extends any[]>(
  handler: (...args: T) => Promise<void>,
  errorMessage?: string
) {
  return async (...args: T) => {
    try {
      await handler(...args)
    } catch (error) {
      handleError(error, errorMessage)
    }
  }
}
