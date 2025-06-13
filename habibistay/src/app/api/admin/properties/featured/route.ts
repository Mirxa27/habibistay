import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';

/**
 * PATCH /api/admin/properties/featured - Update property featured status
 * 
 * Allows admins to mark/unmark properties as featured for the Sara chatbot
 * Request body: { propertyId: string, isFeatured: boolean }
 */
export async function PATCH(request: NextRequest) {
  try {
    // Get user ID and role from the request headers (set by middleware)
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role') as UserRole;

    // Check if user is authenticated
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required' }, 
        { status: 401 }
      );
    }

    // Check if user has admin role
    if (userRole !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Forbidden: Only admins can update featured properties' }, 
        { status: 403 }
      );
    }

    // Parse request body
    const { propertyId, isFeatured } = await request.json();

    // Validate required fields
    if (!propertyId) {
      return NextResponse.json(
        { error: 'Property ID is required' }, 
        { status: 400 }
      );
    }

    if (typeof isFeatured !== 'boolean') {
      return NextResponse.json(
        { error: 'isFeatured must be a boolean' }, 
        { status: 400 }
      );
    }

    // Check if property exists
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true }
    });

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' }, 
        { status: 404 }
      );
    }

    // Update property featured status
    const updatedProperty = await prisma.property.update({
      where: { id: propertyId },
      data: { isFeatured },
      select: {
        id: true,
        title: true,
        isFeatured: true,
      }
    });

    return NextResponse.json({
      message: `Property ${isFeatured ? 'marked as' : 'removed from'} featured`,
      property: updatedProperty
    });

  } catch (error) {
    console.error('Error updating property featured status:', error);
    return NextResponse.json(
      { error: 'Failed to update property featured status' },
      { status: 500 }
    );
  }
}

// Add OPTIONS handler for CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// Add CORS headers to all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Export a custom response handler to add CORS headers
function withCors(response: NextResponse) {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

// Export the PATCH handler with CORS
const PATCHWithCors = async (request: NextRequest) => {
  const response = await PATCH(request);
  return withCors(response);
};

export { PATCHWithCors as PATCH };
