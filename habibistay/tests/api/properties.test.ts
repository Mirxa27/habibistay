import { NextRequest } from 'next/server';
import { POST } from '@habibistay/app/api/properties/route';
import { prisma } from '@habibistay/lib/prisma';
import { UserRole } from '@prisma/client';

// Mock the Prisma client
jest.mock('@habibistay/lib/prisma', () => ({
  prisma: {
    property: {
      create: jest.fn(),
    },
  },
}));

describe('POST /api/properties', () => {
  let mockRequest: NextRequest;
  
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Create a mock request with required headers
    mockRequest = {
      headers: new Headers({
        'x-user-id': 'test-user-123',
        'x-user-role': UserRole.HOST,
      }),
      json: jest.fn().mockResolvedValue({
        title: 'Beautiful Beach House',
        description: 'A beautiful house by the beach',
        type: 'HOUSE',
        price: 150,
        address: '123 Beach Rd',
        city: 'Malibu',
        country: 'USA',
        bedrooms: 3,
        beds: 4,
        bathrooms: 2,
        maxGuests: 6,
        amenities: ['WIFI', 'POOL', 'AIR_CONDITIONING'],
      }),
    } as unknown as NextRequest;
  });

  it('should create a property with valid data', async () => {
    // Mock the Prisma response
    const mockProperty = {
      id: 'property-123',
      title: 'Beautiful Beach House',
      description: 'A beautiful house by the beach',
      type: 'HOUSE',
      price: 150,
      address: '123 Beach Rd',
      city: 'Malibu',
      country: 'USA',
      bedrooms: 3,
      beds: 4,
      bathrooms: 2,
      maxGuests: 6,
      amenities: ['WIFI', 'POOL', 'AIR_CONDITIONING'],
      ownerId: 'test-user-123',
      isPublished: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    (prisma.property.create as jest.Mock).mockResolvedValue(mockProperty);
    
    // Call the API
    const response = await POST(mockRequest);
    const data = await response.json();
    
    // Assert the response
    expect(response.status).toBe(201);
    expect(data).toMatchObject({
      id: expect.any(String),
      title: 'Beautiful Beach House',
      description: 'A beautiful house by the beach',
      type: 'HOUSE',
      price: 150,
      address: '123 Beach Rd',
      city: 'Malibu',
      country: 'USA',
      bedrooms: 3,
      beds: 4,
      bathrooms: 2,
      maxGuests: 6,
      amenities: expect.arrayContaining(['WIFI', 'POOL', 'AIR_CONDITIONING']),
      ownerId: 'test-user-123',
      isPublished: false,
    });
    
    // Verify Prisma was called with the correct data
    expect(prisma.property.create).toHaveBeenCalledWith({
      data: {
        title: 'Beautiful Beach House',
        description: 'A beautiful house by the beach',
        type: 'HOUSE',
        price: 150,
        address: '123 Beach Rd',
        city: 'Malibu',
        country: 'USA',
        bedrooms: 3,
        beds: 4,
        bathrooms: 2,
        maxGuests: 6,
        amenities: ['WIFI', 'POOL', 'AIR_CONDITIONING'],
        isPublished: false,
        ownerId: 'test-user-123',
      },
      select: expect.any(Object),
    });
  });

  it('should return 401 if user is not authenticated', async () => {
    // Create a request without user ID
    const unauthenticatedRequest = {
      ...mockRequest,
      headers: new Headers({}),
    } as unknown as NextRequest;
    
    const response = await POST(unauthenticatedRequest);
    const data = await response.json();
    
    expect(response.status).toBe(401);
    expect(data.error).toContain('Unauthorized');
    expect(prisma.property.create).not.toHaveBeenCalled();
  });

  it('should return 403 if user does not have permission', async () => {
    // Create a request with a role that doesn't have permission
    const unauthorizedRoleRequest = {
      ...mockRequest,
      headers: new Headers({
        'x-user-id': 'test-user-123',
        'x-user-role': UserRole.GUEST, // GUEST role doesn't have permission
      }),
    } as unknown as NextRequest;
    
    const response = await POST(unauthorizedRoleRequest);
    const data = await response.json();
    
    expect(response.status).toBe(403);
    expect(data.error).toContain('Forbidden');
    expect(prisma.property.create).not.toHaveBeenCalled();
  });

  it('should return 400 for missing required fields', async () => {
    // Create a request with missing required fields
    const invalidRequest = {
      ...mockRequest,
      json: jest.fn().mockResolvedValue({
        // Missing title, description, etc.
        price: 100,
      }),
    } as unknown as NextRequest;
    
    const response = await POST(invalidRequest);
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.error).toContain('Missing required fields');
    expect(prisma.property.create).not.toHaveBeenCalled();
  });

  it('should handle database errors gracefully', async () => {
    // Mock a database error
    (prisma.property.create as jest.Mock).mockRejectedValue(
      new Error('Database error')
    );
    
    const response = await POST(mockRequest);
    const data = await response.json();
    
    expect(response.status).toBe(500);
    expect(data.error).toContain('unexpected error');
  });
});
