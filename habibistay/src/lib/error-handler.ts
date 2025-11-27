import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';

/**
 * Custom error classes for different error types
 */

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'You do not have permission to perform this action') {
    super(message, 403, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT_ERROR');
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests. Please try again later.') {
    super(message, 429, 'RATE_LIMIT_ERROR');
    this.name = 'RateLimitError';
  }
}

export class PaymentError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 402, 'PAYMENT_ERROR', details);
    this.name = 'PaymentError';
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message?: string) {
    super(
      message || `External service ${service} is currently unavailable`,
      503,
      'EXTERNAL_SERVICE_ERROR',
      { service }
    );
    this.name = 'ExternalServiceError';
  }
}

/**
 * Error response formatter
 */
export interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    statusCode: number;
    details?: any;
    stack?: string;
  };
}

/**
 * Format error for API response
 */
export function formatErrorResponse(error: unknown, includeStack: boolean = false): ErrorResponse {
  // Handle custom AppError instances
  if (error instanceof AppError) {
    return {
      success: false,
      error: {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        details: error.details,
        ...(includeStack && { stack: error.stack }),
      },
    };
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const formattedErrors = error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
    }));

    return {
      success: false,
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        statusCode: 400,
        details: formattedErrors,
      },
    };
  }

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return handlePrismaError(error);
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return {
      success: false,
      error: {
        message: 'Invalid data provided',
        code: 'VALIDATION_ERROR',
        statusCode: 400,
      },
    };
  }

  // Handle standard Error instances
  if (error instanceof Error) {
    return {
      success: false,
      error: {
        message: error.message || 'An unexpected error occurred',
        code: 'INTERNAL_SERVER_ERROR',
        statusCode: 500,
        ...(includeStack && { stack: error.stack }),
      },
    };
  }

  // Handle unknown errors
  return {
    success: false,
    error: {
      message: 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
      statusCode: 500,
    },
  };
}

/**
 * Handle Prisma-specific errors
 */
function handlePrismaError(error: Prisma.PrismaClientKnownRequestError): ErrorResponse {
  switch (error.code) {
    case 'P2002':
      // Unique constraint violation
      const field = (error.meta?.target as string[])?.join(', ') || 'field';
      return {
        success: false,
        error: {
          message: `A record with this ${field} already exists`,
          code: 'DUPLICATE_ENTRY',
          statusCode: 409,
          details: { field },
        },
      };

    case 'P2025':
      // Record not found
      return {
        success: false,
        error: {
          message: 'Record not found',
          code: 'NOT_FOUND',
          statusCode: 404,
        },
      };

    case 'P2003':
      // Foreign key constraint violation
      return {
        success: false,
        error: {
          message: 'Related record not found',
          code: 'FOREIGN_KEY_VIOLATION',
          statusCode: 400,
        },
      };

    case 'P2014':
      // Required relation violation
      return {
        success: false,
        error: {
          message: 'Required relation is missing',
          code: 'REQUIRED_RELATION_MISSING',
          statusCode: 400,
        },
      };

    default:
      return {
        success: false,
        error: {
          message: 'Database operation failed',
          code: 'DATABASE_ERROR',
          statusCode: 500,
          details: { prismaCode: error.code },
        },
      };
  }
}

/**
 * Create NextResponse from error
 */
export function createErrorResponse(error: unknown, includeStack: boolean = false): NextResponse {
  const errorResponse = formatErrorResponse(error, includeStack);
  return NextResponse.json(errorResponse, { status: errorResponse.error.statusCode });
}

/**
 * Async error handler wrapper for API routes
 */
export function asyncHandler<T extends any[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R | NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error('API Error:', error);
      const isDevelopment = process.env.NODE_ENV === 'development';
      return createErrorResponse(error, isDevelopment) as any;
    }
  };
}

/**
 * Try-catch wrapper with error transformation
 */
export async function tryCatch<T>(
  fn: () => Promise<T>,
  errorMessage?: string
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (errorMessage && !(error instanceof AppError)) {
      throw new AppError(errorMessage, 500, 'OPERATION_FAILED', {
        originalError: error instanceof Error ? error.message : 'Unknown error',
      });
    }
    throw error;
  }
}

/**
 * Validate and execute with automatic error handling
 */
export async function validateAndExecute<TInput, TOutput>(
  data: unknown,
  validator: (data: unknown) => TInput,
  executor: (validData: TInput) => Promise<TOutput>
): Promise<TOutput> {
  try {
    const validData = validator(data);
    return await executor(validData);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ValidationError('Invalid input data', error.errors);
    }
    throw error;
  }
}

/**
 * Log error with context
 */
export function logError(error: unknown, context?: Record<string, any>): void {
  const timestamp = new Date().toISOString();
  const errorInfo = {
    timestamp,
    context,
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : error,
  };

  // In production, you would send this to a logging service like Sentry, LogRocket, etc.
  console.error('Error logged:', JSON.stringify(errorInfo, null, 2));
}

/**
 * Assert condition and throw error if false
 */
export function assert(condition: boolean, message: string, statusCode: number = 400): asserts condition {
  if (!condition) {
    throw new AppError(message, statusCode);
  }
}

/**
 * Assert resource exists or throw NotFoundError
 */
export function assertExists<T>(
  resource: T | null | undefined,
  resourceName: string = 'Resource'
): asserts resource is T {
  if (resource === null || resource === undefined) {
    throw new NotFoundError(resourceName);
  }
}

/**
 * Assert user is authenticated
 */
export function assertAuthenticated(userId: string | null | undefined): asserts userId is string {
  if (!userId) {
    throw new AuthenticationError();
  }
}

/**
 * Assert user has permission
 */
export function assertAuthorized(condition: boolean, message?: string): asserts condition {
  if (!condition) {
    throw new AuthorizationError(message);
  }
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw new AppError(
    `Operation failed after ${maxRetries} attempts: ${lastError!.message}`,
    500,
    'RETRY_EXHAUSTED'
  );
}

/**
 * Graceful degradation wrapper
 * Returns fallback value if operation fails
 */
export async function withFallback<T>(
  fn: () => Promise<T>,
  fallback: T,
  logErrors: boolean = true
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (logErrors) {
      logError(error, { fallbackUsed: true });
    }
    return fallback;
  }
}

/**
 * Circuit breaker pattern implementation
 */
export class CircuitBreaker {
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000 // 1 minute
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new ExternalServiceError('Circuit breaker', 'Service temporarily unavailable');
      }
    }

    try {
      const result = await fn();
      
      if (this.state === 'HALF_OPEN') {
        this.reset();
      }
      
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  private recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
    }
  }

  private reset(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }
}

/**
 * Rate limiter for preventing abuse
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  constructor(
    private maxRequests: number = 100,
    private windowMs: number = 60000 // 1 minute
  ) {}

  check(identifier: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < this.windowMs);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    
    return true;
  }

  reset(identifier: string): void {
    this.requests.delete(identifier);
  }
}
