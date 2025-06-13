import { BookingStatus, NotificationType, PaymentStatus } from '@prisma/client';
import { prisma } from '@habibistay/lib/prisma';
import { 
  NotificationService, 
  BookingNotificationPayload, 
  PaymentNotificationPayload 
} from '@habibistay/services/notificationService';

// Mock the Prisma client
jest.mock('@habibistay/lib/prisma', () => ({
  prisma: {
    notification: {
      create: jest.fn(),
      createMany: jest.fn(),
    },
    booking: {
      findUnique: jest.fn(),
    },
    payment: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    property: {
      findUnique: jest.fn(),
    },
  },
}));

// Mock email service (if applicable)
jest.mock('@habibistay/services/emailService', () => ({
  sendEmail: jest.fn(),
}));

describe('NotificationService', () => {
  let notificationService: NotificationService;
  
  beforeEach(() => {
    jest.clearAllMocks();
    notificationService = new NotificationService();
  });
  
  describe('sendBookingStatusNotification', () => {
    const mockBookingId = 'booking-123';
    const mockGuestId = 'guest-123';
    const mockHostId = 'host-123';
    const mockPropertyId = 'property-123';
    
    it('should send a notification when booking is confirmed', async () => {
      // Mock booking data
      const mockBooking = {
        id: mockBookingId,
        guestId: mockGuestId,
        property: {
          id: mockPropertyId,
          title: 'Luxury Beach House',
          ownerId: mockHostId,
        },
        status: BookingStatus.CONFIRMED,
        checkInDate: new Date('2023-08-15'),
        checkOutDate: new Date('2023-08-20'),
        totalPrice: 1200,
      };
      
      // Mock user data
      const mockGuest = {
        id: mockGuestId,
        name: 'John Doe',
        email: 'john@example.com',
      };
      
      const mockHost = {
        id: mockHostId,
        name: 'Jane Host',
        email: 'jane@example.com',
      };
      
      // Setup mocks
      (prisma.booking.findUnique as jest.Mock).mockResolvedValue(mockBooking);
      (prisma.user.findUnique as jest.Mock).mockImplementation((args) => {
        if (args.where.id === mockGuestId) return Promise.resolve(mockGuest);
        if (args.where.id === mockHostId) return Promise.resolve(mockHost);
        return Promise.resolve(null);
      });
      (prisma.notification.create as jest.Mock).mockResolvedValue({ id: 'notification-1' });
      
      // Create notification payload
      const payload: BookingNotificationPayload = {
        bookingId: mockBookingId,
        newStatus: BookingStatus.CONFIRMED,
      };
      
      // Call the service method
      await notificationService.sendBookingStatusNotification(payload);
      
      // Verify notifications were created for both guest and host
      expect(prisma.notification.create).toHaveBeenCalledTimes(2);
      
      // Check guest notification
      expect(prisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: mockGuestId,
            type: NotificationType.BOOKING,
            title: expect.stringContaining('confirmed'),
            isRead: false,
          }),
        })
      );
      
      // Check host notification
      expect(prisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: mockHostId,
            type: NotificationType.BOOKING,
            title: expect.stringContaining('confirmed'),
            isRead: false,
          }),
        })
      );
    });
    
    it('should send a notification when booking is cancelled', async () => {
      // Mock booking data
      const mockBooking = {
        id: mockBookingId,
        guestId: mockGuestId,
        property: {
          id: mockPropertyId,
          title: 'Luxury Beach House',
          ownerId: mockHostId,
        },
        status: BookingStatus.CANCELLED,
        checkInDate: new Date('2023-08-15'),
        checkOutDate: new Date('2023-08-20'),
        totalPrice: 1200,
      };
      
      // Mock user data
      const mockGuest = {
        id: mockGuestId,
        name: 'John Doe',
        email: 'john@example.com',
      };
      
      const mockHost = {
        id: mockHostId,
        name: 'Jane Host',
        email: 'jane@example.com',
      };
      
      // Setup mocks
      (prisma.booking.findUnique as jest.Mock).mockResolvedValue(mockBooking);
      (prisma.user.findUnique as jest.Mock).mockImplementation((args) => {
        if (args.where.id === mockGuestId) return Promise.resolve(mockGuest);
        if (args.where.id === mockHostId) return Promise.resolve(mockHost);
        return Promise.resolve(null);
      });
      (prisma.notification.create as jest.Mock).mockResolvedValue({ id: 'notification-1' });
      
      // Create notification payload
      const payload: BookingNotificationPayload = {
        bookingId: mockBookingId,
        newStatus: BookingStatus.CANCELLED,
      };
      
      // Call the service method
      await notificationService.sendBookingStatusNotification(payload);
      
      // Verify notifications were created for both guest and host
      expect(prisma.notification.create).toHaveBeenCalledTimes(2);
      
      // Verify notification content for cancellation
      expect(prisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: expect.stringContaining('cancelled'),
            type: NotificationType.BOOKING,
          }),
        })
      );
    });
    
    it('should handle booking not found', async () => {
      // Mock booking not found
      (prisma.booking.findUnique as jest.Mock).mockResolvedValue(null);
      
      const payload: BookingNotificationPayload = {
        bookingId: 'nonexistent-booking',
        newStatus: BookingStatus.CONFIRMED,
      };
      
      // Call the service method and expect an error
      await expect(notificationService.sendBookingStatusNotification(payload))
        .rejects
        .toThrow('Booking not found');
      
      // Verify no notifications were created
      expect(prisma.notification.create).not.toHaveBeenCalled();
    });
  });
  
  describe('sendPaymentNotification', () => {
    const mockPaymentId = 'payment-123';
    const mockBookingId = 'booking-123';
    const mockGuestId = 'guest-123';
    const mockHostId = 'host-123';
    
    it('should send a notification when payment is completed', async () => {
      // Mock payment data
      const mockPayment = {
        id: mockPaymentId,
        bookingId: mockBookingId,
        amount: 1200,
        status: PaymentStatus.COMPLETED,
        paymentMethod: 'CREDIT_CARD',
      };
      
      // Mock booking data
      const mockBooking = {
        id: mockBookingId,
        guestId: mockGuestId,
        property: {
          ownerId: mockHostId,
          title: 'Luxury Beach House',
        },
        totalPrice: 1200,
      };
      
      // Mock user data
      const mockGuest = {
        id: mockGuestId,
        name: 'John Doe',
        email: 'john@example.com',
      };
      
      const mockHost = {
        id: mockHostId,
        name: 'Jane Host',
        email: 'jane@example.com',
      };
      
      // Setup mocks
      (prisma.payment.findUnique as jest.Mock).mockResolvedValue(mockPayment);
      (prisma.booking.findUnique as jest.Mock).mockResolvedValue(mockBooking);
      (prisma.user.findUnique as jest.Mock).mockImplementation((args) => {
        if (args.where.id === mockGuestId) return Promise.resolve(mockGuest);
        if (args.where.id === mockHostId) return Promise.resolve(mockHost);
        return Promise.resolve(null);
      });
      (prisma.notification.create as jest.Mock).mockResolvedValue({ id: 'notification-1' });
      
      // Create notification payload
      const payload: PaymentNotificationPayload = {
        paymentId: mockPaymentId,
        newStatus: PaymentStatus.COMPLETED,
      };
      
      // Call the service method
      await notificationService.sendPaymentNotification(payload);
      
      // Verify notifications were created for both guest and host
      expect(prisma.notification.create).toHaveBeenCalledTimes(2);
      
      // Check guest notification
      expect(prisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: mockGuestId,
            type: NotificationType.PAYMENT,
            title: expect.stringContaining('Payment confirmed'),
            isRead: false,
          }),
        })
      );
      
      // Check host notification
      expect(prisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: mockHostId,
            type: NotificationType.PAYMENT,
            title: expect.stringContaining('Payment received'),
            isRead: false,
          }),
        })
      );
    });
    
    it('should send a notification when payment fails', async () => {
      // Mock payment data
      const mockPayment = {
        id: mockPaymentId,
        bookingId: mockBookingId,
        amount: 1200,
        status: PaymentStatus.FAILED,
        paymentMethod: 'CREDIT_CARD',
      };
      
      // Mock booking data
      const mockBooking = {
        id: mockBookingId,
        guestId: mockGuestId,
        property: {
          ownerId: mockHostId,
          title: 'Luxury Beach House',
        },
        totalPrice: 1200,
      };
      
      // Mock user data
      const mockGuest = {
        id: mockGuestId,
        name: 'John Doe',
        email: 'john@example.com',
      };
      
      // Setup mocks
      (prisma.payment.findUnique as jest.Mock).mockResolvedValue(mockPayment);
      (prisma.booking.findUnique as jest.Mock).mockResolvedValue(mockBooking);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockGuest);
      (prisma.notification.create as jest.Mock).mockResolvedValue({ id: 'notification-1' });
      
      // Create notification payload
      const payload: PaymentNotificationPayload = {
        paymentId: mockPaymentId,
        newStatus: PaymentStatus.FAILED,
      };
      
      // Call the service method
      await notificationService.sendPaymentNotification(payload);
      
      // Verify notification was created for the guest only (failed payment)
      expect(prisma.notification.create).toHaveBeenCalledTimes(1);
      
      // Check guest notification for failed payment
      expect(prisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: mockGuestId,
            type: NotificationType.PAYMENT,
            title: expect.stringContaining('Payment failed'),
            isRead: false,
          }),
        })
      );
    });
    
    it('should handle payment not found', async () => {
      // Mock payment not found
      (prisma.payment.findUnique as jest.Mock).mockResolvedValue(null);
      
      const payload: PaymentNotificationPayload = {
        paymentId: 'nonexistent-payment',
        newStatus: PaymentStatus.COMPLETED,
      };
      
      // Call the service method and expect an error
      await expect(notificationService.sendPaymentNotification(payload))
        .rejects
        .toThrow('Payment not found');
      
      // Verify no notifications were created
      expect(prisma.notification.create).not.toHaveBeenCalled();
    });
  });
  
  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      // Mock database error
      (prisma.booking.findUnique as jest.Mock).mockResolvedValue({
        id: 'booking-123',
        guestId: 'guest-123',
        property: {
          ownerId: 'host-123',
          title: 'Property Title',
        },
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
      });
      (prisma.notification.create as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );
      
      const payload: BookingNotificationPayload = {
        bookingId: 'booking-123',
        newStatus: BookingStatus.CONFIRMED,
      };
      
      // Call the service method and expect an error
      await expect(notificationService.sendBookingStatusNotification(payload))
        .rejects
        .toThrow('Failed to send booking notification');
    });
  });
});
