import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';

/**
 * PATCH /api/properties/[propertyId]/images/[imageId]/caption
 * Update the caption of a property image
 */
export async function PATCH(
  request: Request, // Used to parse request body
  { params }: { params: { propertyId: string; imageId: string } }
) {
  try {
    const { propertyId, imageId } = params;
    
    // 1. Get the current user session
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'You must be logged in to update image captions' },
        { status: 401 }
      );
    }
    
    // 2. Parse the request body
    const { caption } = await request.json();
    
    if (typeof caption !== 'string' && caption !== null) {
      return NextResponse.json(
        { error: 'Invalid caption format' },
        { status: 400 }
      );
    }
    
    // 3. Get the image and property with owner/manager info
    const image = await prisma.image.findUnique({
      where: { id: imageId },
      include: {
        property: {
          select: {
            id: true,
            ownerId: true,
            managers: {
              where: { 
                managerId: session.user.id
              },
              select: { id: true }
            }
          }
        }
      }
    });
    
    if (!image) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }
    
    // 4. Check if the property exists and the user has permission
    const property = image.property;
    if (!property || property.id !== propertyId) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }
    
    // 5. Check if user is the owner, a manager, or an admin
    const isOwner = property.ownerId === session.user.id;
    const isManager = property.managers.length > 0;
    const isAdmin = session.user.role === UserRole.ADMIN;
    
    if (!isOwner && !isManager && !isAdmin) {
      return NextResponse.json(
        { error: 'You do not have permission to update captions for this property' },
        { status: 403 }
      );
    }
    
    // 6. Update the image caption
    const updatedImage = await prisma.image.update({
      where: { id: imageId },
      data: { caption: caption || null },
      select: {
        id: true,
        caption: true,
        // Model doesn't have updatedAt field
        createdAt: true
      }
    });
    
    return NextResponse.json({ 
      message: 'Image caption updated successfully',
      data: updatedImage
    });
    
  } catch (error) {
    console.error('Error updating image caption:', error);
    return NextResponse.json(
      { error: 'An error occurred while updating the image caption' },
      { status: 500 }
    );
  }
}
