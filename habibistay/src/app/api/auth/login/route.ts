import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

// Input validation schema
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// Rate limiting for login attempts
const loginAttempts = new Map<string, { count: number; resetTime: number }>();

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

// Helper function to check rate limiting
const checkLoginRateLimit = (email: string): boolean => {
  const now = Date.now();
  const record = loginAttempts.get(email);

  if (!record || now > record.resetTime) {
    loginAttempts.set(email, { count: 1, resetTime: now + LOCKOUT_DURATION });
    return true;
  }

  if (record.count >= MAX_LOGIN_ATTEMPTS) {
    return false; // Rate limit exceeded
  }

  record.count++;
  return true;
};

// Helper function to create error response
const createErrorResponse = (message: string, status: number, code?: string) => {
  return NextResponse.json(
    {
      error: message,
      code: code || 'LOGIN_ERROR',
      timestamp: new Date().toISOString(),
    },
    { status }
  );
};

// Helper function to create success response
const createSuccessResponse = (user: any, token: string) => {
  const { password: _, ...userWithoutPassword } = user;
  
  return NextResponse.json({
    message: 'Login successful',
    user: userWithoutPassword,
    token,
    expiresIn: '1h',
  }, {
    status: 200,
    headers: {
      'Set-Cookie': `auth-token=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=3600; Path=/`,
    },
  });
};

export async function POST(request: Request) {
  try {
    // Parse and validate request body
    const body = await request.json();
    
    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      return createErrorResponse(
        'Invalid input data',
        400,
        'VALIDATION_ERROR'
      );
    }

    const { email, password } = validationResult.data;

    // Check rate limiting
    if (!checkLoginRateLimit(email)) {
      return createErrorResponse(
        'Too many login attempts. Please try again in 15 minutes.',
        429,
        'RATE_LIMIT_EXCEEDED'
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        accounts: true,
        sessions: true,
      },
    });

    if (!user) {
      return createErrorResponse(
        'Invalid credentials',
        401,
        'INVALID_CREDENTIALS'
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return createErrorResponse(
        'Account is deactivated. Please contact support.',
        403,
        'ACCOUNT_DEACTIVATED'
      );
    }

    // Check if user has password (OAuth users might not have passwords)
    if (!user.password) {
      return createErrorResponse(
        'This account was created with a social login. Please use the appropriate login method.',
        403,
        'OAUTH_ACCOUNT'
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return createErrorResponse(
        'Invalid credentials',
        401,
        'INVALID_CREDENTIALS'
      );
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET is not defined in environment variables.');
      return createErrorResponse(
        'Server configuration error',
        500,
        'SERVER_ERROR'
      );
    }

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    const token = jwt.sign(tokenPayload, jwtSecret, {
      expiresIn: '1h',
      issuer: 'habibistay',
      audience: 'habibistay-users',
    });

    // Update last login time
    await prisma.user.update({
      where: { id: user.id },
      data: { updatedAt: new Date() },
    });

    // Clear login attempts on successful login
    loginAttempts.delete(email);

    // Log successful login (in production, use proper logging service)
    console.log(`Successful login for user: ${user.email} (${user.id})`);

    return createSuccessResponse(user, token);

  } catch (error) {
    console.error('Login error:', error);
    
    // Don't expose internal errors to client
    return createErrorResponse(
      'An unexpected error occurred during login',
      500,
      'INTERNAL_ERROR'
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return createErrorResponse(
    'Method not allowed',
    405,
    'METHOD_NOT_ALLOWED'
  );
}

export async function PUT() {
  return createErrorResponse(
    'Method not allowed',
    405,
    'METHOD_NOT_ALLOWED'
  );
}

export async function DELETE() {
  return createErrorResponse(
    'Method not allowed',
    405,
    'METHOD_NOT_ALLOWED'
  );
}
