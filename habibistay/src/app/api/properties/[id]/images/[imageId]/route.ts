import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { deleteImage } from '@/config/cloudinary';

/**
 * GET /api/properties/[id]/images/[imageId]
 * Get a specific image by ID
 */
export async function GET(
  _request: Request,
  { params }: { params: { id: string; imageId: string } }
) {
  try {
    const { id: propertyId, imageId } = params;
    
    // 1. Check if the property exists
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
    
    // 2. Get the image
    const image = await prisma.image.findUnique({
      where: { id: imageId },
      select: {
        id: true,
        publicId: true,
        url: true,
        secureUrl: true,
        width: true,
        height: true,
        format: true,
        bytes: true,
        caption: true,
        isPrimary: true,
        createdAt: true,
        propertyId: true,
      }
    });
    
    if (!image || image.propertyId !== propertyId) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ data: image });
    
  } catch (error) {
    console.error('Error fetching image:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching the image' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/properties/[id]/images/[imageId]
 * Update an image (e.g., set as primary, update caption)
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string; imageId: string } }
) {
  try {
    const { id: propertyId, imageId } = params;
    const body = await request.json();
    
    // 1. Get the current user session
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'You must be logged in to update images' },
        { status: 401 }
      );
    }
    
    // 2. Check if the property exists and user has permission
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { 
        id: true, 
        ownerId: true,
        managers: {
          where: { 
            managerId: session.user.id
          },
          select: { id: true }
        }
      },
    });
    
    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }
    
    // Check if user is the owner, a manager, or an admin
    const isOwner = property.ownerId === session.user.id;
    const isManager = property.managers.length > 0;
    const isAdmin = session.user.role === UserRole.ADMIN;
    
    if (!isOwner && !isManager && !isAdmin) {
      return NextResponse.json(
        { error: 'You do not have permission to update images for this property' },
        { status: 403 }
      );
    }
    
    // 3. Check if the image exists and belongs to this property
    const existingImage = await prisma.image.findUnique({
      where: { id: imageId },
      select: { id: true, propertyId: true, isPrimary: true }
    });
    
    if (!existingImage || existingImage.propertyId !== propertyId) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }
    
    // 4. Prepare update data
    const updateData: {
      caption?: string | null;
      isPrimary?: boolean;
    } = {};
    
    if (body.caption !== undefined) {
      updateData.caption = body.caption || null;
    }
    
    if (body.isPrimary !== undefined) {
      updateData.isPrimary = Boolean(body.isPrimary);
      
      // If setting as primary, ensure no other images are marked as primary
      if (updateData.isPrimary) {
        await prisma.image.updateMany({
          where: {
            propertyId,
            isPrimary: true,
            id: { not: imageId }
          },
          data: { isPrimary: false }
        });
      }
    }
    
    // 5. Update the image
    const updatedImage = await prisma.image.update({
      where: { id: imageId },
      data: updateData,
      select: {
        id: true,
        url: true,
        secureUrl: true,
        caption: true,
        isPrimary: true,
      }
    });
    
    return NextResponse.json({ 
      message: 'Image updated successfully',
      data: updatedImage 
    });
    
  } catch (error) {
    console.error('Error updating image:', error);
    return NextResponse.json(
      { error: 'An error occurred while updating the image' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/properties/[id]/images/[imageId]
 * Delete an image
 */
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string; imageId: string } }
) {
  try {
    const { id: propertyId, imageId } = params;
    
    // 1. Get the current user session
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'You must be logged in to delete images' },
        { status: 401 }
      );
    }
    
    // 2. Check if the property exists and user has permission
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { 
        id: true, 
        ownerId: true,
        managers: {
          where: { 
            managerId: session.user.id
          },
          select: { id: true }
        },
        images: {
          where: { id: imageId },
          select: { id: true, publicId: true, isPrimary: true }
        }
      },
    });
    
    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }
    
    // Check if the image exists and belongs to this property
    const imageToDelete = property.images[0];
    if (!imageToDelete) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }
    
    // Check if user is the owner, a manager, or an admin
    const isOwner = property.ownerId === session.user.id;
    const isManager = property.managers.length > 0;
    const isAdmin = session.user.role === UserRole.ADMIN;
    
    if (!isOwner && !isManager && !isAdmin) {
      return NextResponse.json(
        { error: 'You do not have permission to delete images from this property' },
        { status: 403 }
      );
    }
    
    // 3. Delete the image from Cloudinary
    try {
      await deleteImage(imageToDelete.publicId);
    } catch (error) {
      console.error('Error deleting image from Cloudinary:', error);
      // Continue with database deletion even if Cloudinary deletion fails
    }
    
    // 4. Delete the image record from the database
    await prisma.image.delete({
      where: { id: imageId }
    });
    
    // 5. If the deleted image was primary, set another image as primary if available
    if (imageToDelete.isPrimary) {
      const otherImages = await prisma.image.findMany({
        where: { 
          propertyId,
          id: { not: imageId }
        },
        orderBy: { createdAt: 'asc' },
        take: 1
      });
      
      if (otherImages.length > 0) {
        await prisma.image.update({
          where: { id: otherImages[0].id },
          data: { isPrimary: true }
        });
      }
    }
    
    return NextResponse.json({ 
      message: 'Image deleted successfully' 
    });
    
  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json(
      { error: 'An error occurred while deleting the image' },
      { status: 500 }
    );
  }
}
