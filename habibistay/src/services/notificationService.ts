import { BookingStatus, NotificationType, UserRole } from '@prisma/client';
import prisma from '@/lib/prisma';

// Types for notification payloads
export interface BookingNotificationPayload {
  bookingId: string;
  propertyId: string;
  guestId: string;
  hostId: string;
  status?: BookingStatus;
  message?: string;
  checkInDate?: string;
  checkOutDate?: string;
}

export interface PaymentNotificationPayload {
  paymentId: string;
  bookingId: string;
  guestId: string;
  amount: number;
  status: string;
}

/**
 * Service for sending notifications to users
 * Handles both in-app notifications and email notifications
 */
export class NotificationService {
  /**
   * Send a notification about a booking status change
   */
  async sendBookingStatusNotification(payload: BookingNotificationPayload): Promise<void> {
    try {
      const { bookingId, guestId, hostId, status, message } = payload;
      
      // Get booking information
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          property: {
            select: {
              title: true,
              ownerId: true,
            }
          },
          guest: {
            select: {
              name: true,
              email: true,
            }
          }
        }
      });
      
      if (!booking) {
        throw new Error('Booking not found');
      }
      
      // Default message if none provided
      const notificationMessage = message || 
        `Booking #${bookingId.slice(0, 8)} status updated to ${status}`;
      
      // Create in-app notification for guest
      await this.createInAppNotification({
        userId: guestId,
        type: NotificationType.BOOKING_UPDATE,
        title: `Booking ${status?.toLowerCase() || 'updated'}`,
        message: notificationMessage,
        data: {
          bookingId,
          propertyId: booking.propertyId,
          status: status || booking.status,
        }
      });
      
      // Create in-app notification for host
      await this.createInAppNotification({
        userId: hostId || booking.property.ownerId,
        type: NotificationType.BOOKING_UPDATE,
        title: `Booking ${status?.toLowerCase() || 'updated'}`,
        message: notificationMessage,
        data: {
          bookingId,
          propertyId: booking.propertyId,
          status: status || booking.status,
        }
      });
      
      // Send email notifications
      await this.sendBookingEmailNotification(booking, status || booking.status);
      
    } catch (error) {
      console.error('Error sending booking notification:', error);
      throw error;
    }
  }

  /**
   * Send a notification about a payment update
   */
  async sendPaymentNotification(payload: PaymentNotificationPayload): Promise<void> {
    try {
      const { paymentId, bookingId, guestId, amount, status } = payload;
      
      // Get booking information
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          property: {
            select: {
              title: true,
              ownerId: true,
            }
          },
          guest: {
            select: {
              name: true,
              email: true,
            }
          }
        }
      });
      
      if (!booking) {
        throw new Error('Booking not found');
      }
      
      // Create in-app notification for guest
      await this.createInAppNotification({
        userId: guestId,
        type: NotificationType.PAYMENT_UPDATE,
        title: `Payment ${status.toLowerCase()}`,
        message: `Your payment of $${amount} for booking #${bookingId.slice(0, 8)} has been ${status.toLowerCase()}.`,
        data: {
          paymentId,
          bookingId,
          amount,
          status,
        }
      });
      
      // Create in-app notification for host
      await this.createInAppNotification({
        userId: booking.property.ownerId,
        type: NotificationType.PAYMENT_UPDATE,
        title: `Payment ${status.toLowerCase()}`,
        message: `Payment of $${amount} for booking #${bookingId.slice(0, 8)} has been ${status.toLowerCase()}.`,
        data: {
          paymentId,
          bookingId,
          amount,
          status,
        }
      });
      
      // Send email notification
      await this.sendPaymentEmailNotification(booking, amount, status);
      
    } catch (error) {
      console.error('Error sending payment notification:', error);
      throw error;
    }
  }
  
  /**
   * Send a reminder notification for upcoming bookings
   */
  async sendBookingReminderNotification(bookingId: string): Promise<void> {
    try {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          property: {
            select: {
              title: true,
              address: true,
              city: true,
              country: true,
              ownerId: true,
            }
          },
          guest: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        }
      });
      
      if (!booking) {
        throw new Error('Booking not found');
      }
      
      // Create reminder notification for guest
      await this.createInAppNotification({
        userId: booking.guest.id,
        type: NotificationType.BOOKING_REMINDER,
        title: 'Upcoming booking reminder',
        message: `Your stay at ${booking.property.title} starts in 2 days.`,
        data: {
          bookingId,
          propertyId: booking.propertyId,
          checkInDate: booking.checkInDate.toISOString(),
          checkOutDate: booking.checkOutDate.toISOString(),
        }
      });
      
      // Create reminder notification for host
      await this.createInAppNotification({
        userId: booking.property.ownerId,
        type: NotificationType.BOOKING_REMINDER,
        title: 'Guest arriving soon',
        message: `A guest is arriving at ${booking.property.title} in 2 days.`,
        data: {
          bookingId,
          propertyId: booking.propertyId,
          checkInDate: booking.checkInDate.toISOString(),
          checkOutDate: booking.checkOutDate.toISOString(),
        }
      });
      
      // Send email reminders
      await this.sendReminderEmailNotification(booking);
      
    } catch (error) {
      console.error('Error sending reminder notification:', error);
      throw error;
    }
  }

  /**
   * Create an in-app notification in the database
   */
  private async createInAppNotification({
    userId,
    type,
    title,
    message,
    data
  }: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: any;
  }): Promise<void> {
    try {
      await prisma.notification.create({
        data: {
          userId,
          type,
          title,
          message,
          data: data ? JSON.stringify(data) : null,
          isRead: false,
        }
      });
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }
  
  /**
   * Send an email notification for booking updates
   * This is a mock implementation that would be replaced with actual email sending
   */
  private async sendBookingEmailNotification(
    booking: any,
    status: BookingStatus
  ): Promise<void> {
    // In a real implementation, you would integrate with an email service like SendGrid, AWS SES, etc.
    // For now, we'll just log that an email would be sent
    console.log(`[EMAIL] Sending booking update email to ${booking.guest.email}`);
    console.log(`[EMAIL] Subject: Your booking at ${booking.property.title} has been ${status.toLowerCase()}`);
    
    // Additional email could be sent to the host
    const hostEmail = await this.getHostEmail(booking.property.ownerId);
    if (hostEmail) {
      console.log(`[EMAIL] Sending booking update email to host at ${hostEmail}`);
      console.log(`[EMAIL] Subject: A booking for ${booking.property.title} has been ${status.toLowerCase()}`);
    }
  }
  
  /**
   * Send an email notification for payment updates
   * This is a mock implementation that would be replaced with actual email sending
   */
  private async sendPaymentEmailNotification(
    booking: any,
    amount: number,
    status: string
  ): Promise<void> {
    // Mock email sending
    console.log(`[EMAIL] Sending payment update email to ${booking.guest.email}`);
    console.log(`[EMAIL] Subject: Your payment for ${booking.property.title} has been ${status.toLowerCase()}`);
    
    // Email to host
    const hostEmail = await this.getHostEmail(booking.property.ownerId);
    if (hostEmail) {
      console.log(`[EMAIL] Sending payment update email to host at ${hostEmail}`);
      console.log(`[EMAIL] Subject: Payment received for booking at ${booking.property.title}`);
    }
  }
  
  /**
   * Send a reminder email for upcoming bookings
   * This is a mock implementation that would be replaced with actual email sending
   */
  private async sendReminderEmailNotification(booking: any): Promise<void> {
    // Mock email sending
    console.log(`[EMAIL] Sending reminder email to ${booking.guest.email}`);
    console.log(`[EMAIL] Subject: Your stay at ${booking.property.title} is coming up!`);
    
    // Email to host
    const hostEmail = await this.getHostEmail(booking.property.ownerId);
    if (hostEmail) {
      console.log(`[EMAIL] Sending reminder email to host at ${hostEmail}`);
      console.log(`[EMAIL] Subject: Upcoming guest arrival at ${booking.property.title}`);
    }
  }
  
  /**
   * Helper method to get a host's email
   */
  private async getHostEmail(hostId: string): Promise<string | null> {
    try {
      const host = await prisma.user.findUnique({
        where: { id: hostId },
        select: { email: true }
      });
      
      return host?.email || null;
    } catch (error) {
      console.error('Error getting host email:', error);
      return null;
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
export default notificationService;
