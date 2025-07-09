import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';

// Simple in-memory rate limiter (replace with rate-limiter-flexible when installed)
class SimpleRateLimiter {
  private requests: Map<string, { count: number; resetTime: number }> = new Map();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  async consume(key: string): Promise<void> {
    const now = Date.now();
    const record = this.requests.get(key);

    if (!record || now > record.resetTime) {
      this.requests.set(key, { count: 1, resetTime: now + this.windowMs });
      return;
    }

    if (record.count >= this.maxRequests) {
      throw new Error('Rate limit exceeded');
    }

    record.count++;
  }
}

// Define a type for the JWT payload
interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

// Rate limiter configuration
const rateLimiter = new SimpleRateLimiter(
  parseInt(process.env.RATE_LIMIT_MAX ?? '100'), // Number of requests
  parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '900000') // Per 15 minutes
);

// Enhanced route permissions with more granular control
const routePermissions: Record<string, {
  roles: UserRole[];
  methods: string[];
  rateLimit?: number;
}> = {
  // Admin routes
  '/api/admin': {
    roles: [UserRole.ADMIN],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    rateLimit: 50,
  },
  
  // Property management routes
  '/api/properties/create': {
    roles: [UserRole.HOST, UserRole.ADMIN, UserRole.PROPERTY_MANAGER],
    methods: ['POST'],
    rateLimit: 10,
  },
  '/api/properties/update': {
    roles: [UserRole.HOST, UserRole.ADMIN, UserRole.PROPERTY_MANAGER],
    methods: ['PUT', 'PATCH'],
    rateLimit: 20,
  },
  '/api/properties/delete': {
    roles: [UserRole.HOST, UserRole.ADMIN, UserRole.PROPERTY_MANAGER],
    methods: ['DELETE'],
    rateLimit: 5,
  },
  
  // Booking routes
  '/api/bookings': {
    roles: [UserRole.GUEST, UserRole.HOST, UserRole.ADMIN, UserRole.PROPERTY_MANAGER],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    rateLimit: 30,
  },
  
  // Payment routes
  '/api/payments': {
    roles: [UserRole.GUEST, UserRole.HOST, UserRole.ADMIN],
    methods: ['GET', 'POST'],
    rateLimit: 20,
  },
  
  // User profile routes
  '/api/users/profile': {
    roles: [UserRole.GUEST, UserRole.HOST, UserRole.PROPERTY_MANAGER, UserRole.ADMIN, UserRole.INVESTOR],
    methods: ['GET', 'PUT', 'PATCH'],
    rateLimit: 50,
  },
  
  // AI Assistant routes
  '/api/ai-assistant': {
    roles: [UserRole.GUEST, UserRole.HOST, UserRole.ADMIN],
    methods: ['POST'],
    rateLimit: 15,
  },
  
  // Notification routes
  '/api/notifications': {
    roles: [UserRole.GUEST, UserRole.HOST, UserRole.PROPERTY_MANAGER, UserRole.ADMIN, UserRole.INVESTOR],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    rateLimit: 40,
  },
};

// Public routes that don't require authentication
const publicRoutes = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/request-password-reset',
  '/api/auth/reset-password',
  '/api/public-data',
  '/api/properties/search',
  '/api/properties/public',
];

// Security headers configuration
const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'X-DNS-Prefetch-Control': 'on',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-XSS-Protection': '1; mode=block',
  'X-Permitted-Cross-Domain-Policies': 'none',
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
};

// Input validation schemas
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password: string): boolean => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

// Error response helper
const createErrorResponse = (message: string, status: number, code?: string) => {
  return NextResponse.json(
    {
      error: message,
      code: code || 'UNKNOWN_ERROR',
      timestamp: new Date().toISOString(),
    },
    { status }
  );
};

// Rate limiting helper
const checkRateLimit = async (request: NextRequest): Promise<NextResponse | null> => {
  try {
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : request.ip ?? 'unknown';
    await rateLimiter.consume(ip);
    return null;
  } catch (rejRes) {
    return createErrorResponse(
      'Too many requests. Please try again later.',
      429,
      'RATE_LIMIT_EXCEEDED'
    );
  }
};

// JWT verification helper
const verifyJWT = (token: string): TokenPayload | null => {
  const jwtSecret = process.env.JWT_SECRET;
  
  if (!jwtSecret) {
    console.error('JWT_SECRET is not defined in environment variables.');
    return null;
  }

  try {
    return jwt.verify(token, jwtSecret) as TokenPayload;
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
};

// Permission checking helper
const checkPermissions = (
  pathname: string,
  method: string,
  userRole: UserRole
): boolean => {
  // Find matching route permission
  const matchingRoute = Object.keys(routePermissions).find(route => 
    pathname.startsWith(route)
  );

  if (!matchingRoute) {
    // If no specific permission is defined, allow authenticated users
    return true;
  }

  const permission = routePermissions[matchingRoute];
  
  if (!permission) {
    return false;
  }
  
  // Check if user role is allowed
  if (!permission.roles.includes(userRole)) {
    return false;
  }

  // Check if HTTP method is allowed
  if (!permission.methods.includes(method)) {
    return false;
  }

  return true;
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;

  // Add security headers to all responses
  const response = NextResponse.next();
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Allow public routes to pass through
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return response;
  }

  // Apply rate limiting to all API routes
  if (pathname.startsWith('/api/')) {
    const rateLimitResponse = await checkRateLimit(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
  }

  // For all other /api routes, expect authentication
  if (pathname.startsWith('/api/')) {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return createErrorResponse(
        'Unauthorized: Missing or invalid token format',
        401,
        'MISSING_TOKEN'
      );
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyJWT(token);
    
    if (!decoded || !decoded.userId) {
      return createErrorResponse(
        'Unauthorized: Invalid or expired token',
        401,
        'INVALID_TOKEN'
      );
    }

    // Check permissions
    if (!checkPermissions(pathname, method, decoded.role)) {
      return createErrorResponse(
        'Forbidden: Insufficient permissions',
        403,
        'INSUFFICIENT_PERMISSIONS'
      );
    }

    // Add user info to request headers for easy access in API handlers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', decoded.userId);
    requestHeaders.set('x-user-email', decoded.email);
    requestHeaders.set('x-user-role', decoded.role);
    requestHeaders.set('x-user-permissions', JSON.stringify({
      role: decoded.role,
      permissions: routePermissions[pathname] || {}
    }));

    // Validate request body for sensitive operations
    if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
      try {
        const contentType = request.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const body = await request.clone().json();
          
          // Validate email if present
          if (body.email && !validateEmail(body.email)) {
            return createErrorResponse(
              'Invalid email format',
              400,
              'INVALID_EMAIL'
            );
          }

          // Validate password if present
          if (body.password && !validatePassword(body.password)) {
            return createErrorResponse(
              'Password must be at least 8 characters with uppercase, lowercase, and number',
              400,
              'INVALID_PASSWORD'
            );
          }

          // Sanitize input (basic XSS prevention)
          const sanitizedBody = JSON.parse(JSON.stringify(body).replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ''));
          
          // Create new request with sanitized body
          const newRequest = new Request(request.url, {
            method: request.method,
            headers: requestHeaders,
            body: JSON.stringify(sanitizedBody),
          });

          return NextResponse.next({
            request: newRequest,
          });
        }
      } catch (error) {
        // If JSON parsing fails, continue with original request
        console.warn('Failed to validate request body:', error);
      }
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|images|public).*)',
  ],
};
