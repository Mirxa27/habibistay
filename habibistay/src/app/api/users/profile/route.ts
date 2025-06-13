import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import prisma from '@habibistay/lib/prisma'; // Assumes @/ maps to habibistay/src

export async function GET(request: NextRequest) {
  try {
    // The middleware (from subtask 5.2) should have added user info to headers
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      // This case should ideally be caught by the middleware if the route is protected
      return NextResponse.json({ error: 'Unauthorized: User ID not found in request' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        role: true,
        phone: true,
        bio: true,
        address: true,
        city: true,
        country: true,
        createdAt: true,
        updatedAt: true,
        isInvestor: true,
        // Exclude password and other sensitive fields not needed for a general profile view
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });

  } catch (error) {
    console.error('Get user profile error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred while fetching the profile.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized: User ID not found in request' }, { status: 401 });
    }

    const body = await request.json();
    const { name, phone, bio, address, city, country, image } = body;

    // Construct a data object with only the fields that are provided in the request
    const dataToUpdate: {
      name?: string;
      phone?: string;
      bio?: string;
      address?: string;
      city?: string;
      country?: string;
      image?: string;
    } = {};

    if (name !== undefined) dataToUpdate.name = name;
    if (phone !== undefined) dataToUpdate.phone = phone;
    if (bio !== undefined) dataToUpdate.bio = bio;
    if (address !== undefined) dataToUpdate.address = address;
    if (city !== undefined) dataToUpdate.city = city;
    if (country !== undefined) dataToUpdate.country = country;
    if (image !== undefined) dataToUpdate.image = image; // Assuming image is a URL

    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json({ error: 'No fields to update provided' }, { status: 400 });
    }
    
    // Add basic validation if needed, e.g., for string lengths or formats
    // For example:
    // if (dataToUpdate.name && dataToUpdate.name.length > 100) {
    //   return NextResponse.json({ error: 'Name is too long' }, { status: 400 });
    // }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
      select: { // Return the same fields as the GET endpoint
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        role: true,
        phone: true,
        bio: true,
        address: true,
        city: true,
        country: true,
        createdAt: true,
        updatedAt: true,
        isInvestor: true,
      },
    });

    return NextResponse.json(updatedUser, { status: 200 });

  } catch (error) {
    console.error('Update user profile error:', error);
    // Check for specific Prisma errors, e.g., P2025 (Record to update not found)
    if (error instanceof Error && (error as any).code === 'P2025') {
        return NextResponse.json({ error: 'User not found or concurrent update issue.' }, { status: 404 });
    }
    return NextResponse.json({ error: 'An unexpected error occurred while updating the profile.' }, { status: 500 });
  }
}
