import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/auth/login/route';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
}));

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
}));

const mockPrisma = require('@/lib/prisma');
const mockBcrypt = require('bcryptjs');
const mockJwt = require('jsonwebtoken');

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-jwt-secret';
  });

  const createMockRequest = (body: any): NextRequest => {
    return new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  };

  describe('Input Validation', () => {
    it('should return 400 for missing email', async () => {
      const request = createMockRequest({ password: 'password123' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid input data');
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for missing password', async () => {
      const request = createMockRequest({ email: 'test@example.com' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid input data');
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for invalid email format', async () => {
      const request = createMockRequest({ 
        email: 'invalid-email', 
        password: 'password123' 
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid input data');
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for short password', async () => {
      const request = createMockRequest({ 
        email: 'test@example.com', 
        password: '123' 
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid input data');
      expect(data.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('User Authentication', () => {
    it('should return 401 for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const request = createMockRequest({
        email: 'nonexistent@example.com',
        password: 'password123',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Invalid credentials');
      expect(data.code).toBe('INVALID_CREDENTIALS');
    });

    it('should return 403 for deactivated user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        password: 'hashed-password',
        isActive: false,
        role: 'GUEST',
      });

      const request = createMockRequest({
        email: 'test@example.com',
        password: 'password123',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Account is deactivated. Please contact support.');
      expect(data.code).toBe('ACCOUNT_DEACTIVATED');
    });

    it('should return 403 for OAuth user without password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        password: null,
        isActive: true,
        role: 'GUEST',
      });

      const request = createMockRequest({
        email: 'test@example.com',
        password: 'password123',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('This account was created with a social login. Please use the appropriate login method.');
      expect(data.code).toBe('OAUTH_ACCOUNT');
    });

    it('should return 401 for incorrect password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        password: 'hashed-password',
        isActive: true,
        role: 'GUEST',
        name: 'Test User',
      });
      mockBcrypt.compare.mockResolvedValue(false);

      const request = createMockRequest({
        email: 'test@example.com',
        password: 'wrong-password',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Invalid credentials');
      expect(data.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('Successful Login', () => {
    it('should return 200 with user data and token for valid credentials', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        password: 'hashed-password',
        isActive: true,
        role: 'GUEST',
        name: 'Test User',
        accounts: [],
        sessions: [],
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(true);
      mockJwt.sign.mockReturnValue('mock-jwt-token');

      const request = createMockRequest({
        email: 'test@example.com',
        password: 'password123',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Login successful');
      expect(data.user).toBeDefined();
      expect(data.user.password).toBeUndefined();
      expect(data.token).toBe('mock-jwt-token');
      expect(data.expiresIn).toBe('1h');

      // Verify JWT was called with correct parameters
      expect(mockJwt.sign).toHaveBeenCalledWith(
        {
          userId: 'user-1',
          email: 'test@example.com',
          role: 'GUEST',
          name: 'Test User',
        },
        'test-jwt-secret',
        {
          expiresIn: '1h',
          issuer: 'habibistay',
          audience: 'habibistay-users',
        }
      );

      // Verify user was updated
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { updatedAt: expect.any(Date) },
      });
    });

    it('should handle email case insensitivity', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        password: 'hashed-password',
        isActive: true,
        role: 'GUEST',
        name: 'Test User',
        accounts: [],
        sessions: [],
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(true);
      mockJwt.sign.mockReturnValue('mock-jwt-token');

      const request = createMockRequest({
        email: 'TEST@EXAMPLE.COM',
        password: 'password123',
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        include: {
          accounts: true,
          sessions: true,
        },
      });
    });
  });

  describe('Error Handling', () => {
    it('should return 500 when JWT_SECRET is not defined', async () => {
      delete process.env.JWT_SECRET;

      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        password: 'hashed-password',
        isActive: true,
        role: 'GUEST',
        name: 'Test User',
        accounts: [],
        sessions: [],
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(true);

      const request = createMockRequest({
        email: 'test@example.com',
        password: 'password123',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Server configuration error');
      expect(data.code).toBe('SERVER_ERROR');
    });

    it('should return 500 for database errors', async () => {
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database error'));

      const request = createMockRequest({
        email: 'test@example.com',
        password: 'password123',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('An unexpected error occurred during login');
      expect(data.code).toBe('INTERNAL_ERROR');
    });

    it('should return 500 for bcrypt errors', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        password: 'hashed-password',
        isActive: true,
        role: 'GUEST',
        name: 'Test User',
        accounts: [],
        sessions: [],
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockRejectedValue(new Error('Bcrypt error'));

      const request = createMockRequest({
        email: 'test@example.com',
        password: 'password123',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('An unexpected error occurred during login');
      expect(data.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('Rate Limiting', () => {
    it('should implement rate limiting for login attempts', async () => {
      // This test would require mocking the rate limiting implementation
      // For now, we'll test that the rate limiting function exists
      const request = createMockRequest({
        email: 'test@example.com',
        password: 'password123',
      });

      // Make multiple requests to the same email
      for (let i = 0; i < 6; i++) {
        const response = await POST(request);
        if (i < 5) {
          expect(response.status).not.toBe(429);
        } else {
          expect(response.status).toBe(429);
        }
      }
    });
  });
});