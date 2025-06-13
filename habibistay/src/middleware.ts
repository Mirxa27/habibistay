import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client'; // Assuming UserRole enum is available

// Define a type for the JWT payload
interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

// Placeholder for detailed permission checks based on permissions_matrix.md
// This would map roles to allowed routes/methods
const routePermissions: Record<string, UserRole[]> = {
  // Example: Only ADMIN can access /api/admin/*
  '/api/admin': [UserRole.ADMIN],
  // Example: HOST or ADMIN can access /api/properties/create
  '/api/properties/create': [UserRole.HOST, UserRole.ADMIN, UserRole.PROPERTY_MANAGER], 
  // Example: Authenticated users can access their profile
  '/api/users/profile': [UserRole.GUEST, UserRole.HOST, UserRole.PROPERTY_MANAGER, UserRole.ADMIN, UserRole.INVESTOR],
  // Add more specific route-permission mappings here
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const jwtSecret = process.env.JWT_SECRET;

  // Allow public API routes (e.g., auth routes, public data) to pass through
  if (pathname.startsWith('/api/auth/') || pathname === '/api/public-data') {
    return NextResponse.next();
  }

  // For all other /api routes, expect a token
  if (pathname.startsWith('/api/')) {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing or invalid token format' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];

    if (!jwtSecret) {
      console.error('JWT_SECRET is not defined in environment variables.');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    try {
      const decoded = jwt.verify(token, jwtSecret) as TokenPayload;
      
      // Basic check: Is user authenticated?
      if (!decoded || !decoded.userId) {
        return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
      }

      // Role-based permission check (simplified example)
      // Find a matching prefix for the current path
      const matchingPermissionPath = Object.keys(routePermissions).find(p => pathname.startsWith(p));
      
      if (matchingPermissionPath) {
        const allowedRoles = routePermissions[matchingPermissionPath];
        if (!allowedRoles.includes(decoded.role)) {
          return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
        }
      } else {
        // If no specific permission is defined for a path prefix,
        // you might default to denying access for non-public API routes,
        // or allow if user is generally authenticated.
        // For now, if authenticated and no specific rule blocks, allow.
        // This part needs careful design based on security requirements.
        console.warn(`No specific permission rule for API path: ${pathname}. Allowing for authenticated user.`);
      }

      // Add user info to request headers for easy access in API handlers
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', decoded.userId);
      requestHeaders.set('x-user-email', decoded.email);
      requestHeaders.set('x-user-role', decoded.role);

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });

    } catch (error) {
      // Token verification failed (expired, tampered, etc.)
      console.error('JWT verification error:', error);
      return NextResponse.json({ error: 'Unauthorized: Token verification failed' }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - / (root path, if it's a public landing page)
     * - /auth/* (authentication pages like login, register) - if these are pages
     * This matcher is broad. For API protection, you might refine it to mostly '/api/:path*'.
     * Or, handle page protections separately if needed.
     */
    '/((?!_next/static|_next/image|favicon.ico|auth/).*)', 
    // Explicitly include /api routes if the above doesn't cover them well enough
    // or if you want middleware to run on specific page routes too.
    // '/api/:path*', // More specific for API routes
  ],
};
