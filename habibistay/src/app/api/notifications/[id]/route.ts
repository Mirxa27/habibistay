import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';

// PATCH endpoint to mark a notification as read
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const notificationId = params.id;
    
    // Get user ID from the request headers
    const userId = request.headers.get('x-user-id');
    
    // Check if user is authenticated
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required' }, 
        { status: 401 }
      );
    }
    
    // Find notification
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId }
    });
    
    // Check if notification exists
    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' }, 
        { status: 404 }
      );
    }
    
    // Verify the notification belongs to the user
    if (notification.userId !== userId) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to update this notification' }, 
        { status: 403 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    
    // Update the notification
    const updatedNotification = await prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: body.isRead !== undefined ? body.isRead : true,
      }
    });
    
    return NextResponse.json(updatedNotification);
    
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      { error: 'An error occurred while updating the notification' },
      { status: 500 }
    );
  }
}

// DELETE endpoint to delete a notification
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const notificationId = params.id;
    
    // Get user ID and role from the request headers
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role') as UserRole;
    
    // Check if user is authenticated
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required' }, 
        { status: 401 }
      );
    }
    
    // Find notification
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId }
    });
    
    // Check if notification exists
    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' }, 
        { status: 404 }
      );
    }
    
    // Verify the notification belongs to the user or user is admin
    if (notification.userId !== userId && userRole !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to delete this notification' }, 
        { status: 403 }
      );
    }
    
    // Delete the notification
    await prisma.notification.delete({
      where: { id: notificationId }
    });
    
    return NextResponse.json(
      { message: 'Notification deleted successfully' },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json(
      { error: 'An error occurred while deleting the notification' },
      { status: 500 }
    );
  }
}
