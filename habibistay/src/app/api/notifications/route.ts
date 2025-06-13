import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';

// GET endpoint to retrieve user notifications
export async function GET(request: NextRequest) {
  try {
    // Get user ID from the request headers (set by middleware)
    const userId = request.headers.get('x-user-id');
    
    // Check if user is authenticated
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required' }, 
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const limit = searchParams.has('limit') ? parseInt(searchParams.get('limit') as string, 10) : 20;
    const page = searchParams.has('page') ? parseInt(searchParams.get('page') as string, 10) : 1;
    const skip = (page - 1) * limit;
    
    // Build filter conditions
    const where: any = { userId };
    
    if (unreadOnly) {
      where.isRead = false;
    }
    
    // Get total count for pagination
    const totalNotifications = await prisma.notification.count({ where });
    
    // Fetch notifications
    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
    });
    
    return NextResponse.json({
      notifications,
      pagination: {
        total: totalNotifications,
        page,
        limit,
        pages: Math.ceil(totalNotifications / limit),
      }
    });
    
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching notifications' },
      { status: 500 }
    );
  }
}

// POST endpoint to create a notification (admin only)
export async function POST(request: NextRequest) {
  try {
    // Get user ID and role from the request headers
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role') as UserRole;
    
    // Check if user is authenticated and has admin role
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required' }, 
        { status: 401 }
      );
    }
    
    if (userRole !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' }, 
        { status: 403 }
      );
    }
    
    // Parse the request body
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['userId', 'type', 'title', 'message'];
    const missingFields = requiredFields.filter(field => !(field in body));
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` }, 
        { status: 400 }
      );
    }
    
    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: body.userId },
      select: { id: true }
    });
    
    if (!targetUser) {
      return NextResponse.json(
        { error: 'Target user not found' }, 
        { status: 404 }
      );
    }
    
    // Create the notification
    const notification = await prisma.notification.create({
      data: {
        userId: body.userId,
        type: body.type,
        title: body.title,
        message: body.message,
        data: body.data ? JSON.stringify(body.data) : null,
        isRead: false,
      }
    });
    
    return NextResponse.json(notification, { status: 201 });
    
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'An error occurred while creating the notification' },
      { status: 500 }
    );
  }
}
