import { PaymentStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { notificationService } from "./notificationService";

// Define payment provider types
export type PaymentProvider = 'STRIPE' | 'PAYPAL';

// Mock Stripe integration interface
interface StripePaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'succeeded' | 'canceled';
  client_secret: string;
  metadata: Record<string, string>;
}

// Mock PayPal integration interface
interface PayPalOrder {
  id: string;
  status: 'CREATED' | 'SAVED' | 'APPROVED' | 'VOIDED' | 'COMPLETED' | 'PAYER_ACTION_REQUIRED';
  purchase_units: Array<{
    amount: {
      value: string;
      currency_code: string;
    }
  }>;
  links: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
}

/**
 * Payment service for integrating with payment providers
 * This is a mock implementation that would be replaced with real payment gateway integration
 */
export class PaymentService {
  /**
   * Initialize a payment for a booking
   */
  async initializePayment(
    bookingId: string,
    amount: number,
    provider: PaymentProvider = 'STRIPE'
  ) {
    try {
      // Check if booking exists
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          payments: {
            where: { status: PaymentStatus.PENDING }
          }
        }
      });

      if (!booking) {
        throw new Error('Booking not found');
      }

      // Check if there's already a pending payment
      if (booking.payments.length > 0) {
        // Return existing payment
        return await this.getPaymentDetails(booking.payments[0].id);
      }

      // Create payment record in the database
      const payment = await prisma.payment.create({
        data: {
          bookingId,
          amount,
          currency: 'USD', // Default currency
          provider,
          status: PaymentStatus.PENDING
        }
      });

      // Initialize payment with the selected provider
      const paymentDetails = await this.initializeWithProvider(payment.id, amount, provider);

      // Update payment with transaction ID
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          transactionId: paymentDetails.transactionId
        }
      });

      return paymentDetails;
    } catch (error) {
      console.error('Error initializing payment:', error);
      throw error;
    }
  }

  /**
   * Process payment completion
   */
  async completePayment(paymentId: string, transactionDetails: any) {
    try {
      // Get payment from database
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          booking: true
        }
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      // Verify payment with provider
      const isVerified = await this.verifyPaymentWithProvider(
        payment.provider as PaymentProvider,
        payment.transactionId || '',
        transactionDetails
      );

      if (!isVerified) {
        throw new Error('Payment verification failed');
      }

      // Update payment status
      const updatedPayment = await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.COMPLETED,
          updatedAt: new Date()
        }
      });

      // If payment is completed, also update the booking status
      if (updatedPayment.status === PaymentStatus.COMPLETED) {
        const updatedBooking = await prisma.booking.update({
          where: { id: payment.bookingId },
          data: {
            status: 'CONFIRMED'
          },
          include: {
            property: {
              select: {
                title: true,
                ownerId: true
              }
            }
          }
        });
        
        // Send notifications for booking confirmation and payment completion
        try {
          // Send booking confirmed notification
          await notificationService.sendBookingStatusNotification({
            bookingId: payment.bookingId,
            propertyId: payment.booking.property.id,
            guestId: payment.booking.guestId,
            hostId: updatedBooking.property.ownerId,
            status: 'CONFIRMED',
            message: `Your booking for ${updatedBooking.property.title} has been confirmed.`
          });
          
          // Send payment notification
          await notificationService.sendPaymentNotification({
            paymentId: updatedPayment.id,
            bookingId: payment.bookingId,
            guestId: payment.booking.guestId,
            amount: Number(updatedPayment.amount),
            status: 'COMPLETED'
          });
        } catch (notificationError) {
          console.error('Error sending payment notifications:', notificationError);
          // Continue even if notification fails
        }
      }

      return updatedPayment;
    } catch (error) {
      console.error('Error completing payment:', error);
      
      // Update payment status to failed
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.FAILED,
          updatedAt: new Date()
        }
      });
      
      throw error;
    }
  }

  /**
   * Refund a payment
   */
  async refundPayment(paymentId: string, amount?: number) {
    try {
      // Get payment from database
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          booking: true
        }
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      // Only completed payments can be refunded
      if (payment.status !== PaymentStatus.COMPLETED) {
        throw new Error(`Cannot refund payment with status ${payment.status}`);
      }

      // Process refund with provider
      const refundAmount = amount || Number(payment.amount);
      const isPartial = refundAmount < Number(payment.amount);
      
      const refundResult = await this.processRefundWithProvider(
        payment.provider as PaymentProvider,
        payment.transactionId || '',
        refundAmount
      );

      // Update payment status
      const updatedPayment = await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: isPartial ? PaymentStatus.PARTIAL_REFUND : PaymentStatus.REFUNDED,
          updatedAt: new Date()
        }
      });

      // If full refund, update booking status to cancelled
      if (!isPartial) {
        await prisma.booking.update({
          where: { id: payment.bookingId },
          data: {
            status: 'CANCELLED'
          }
        });
      }

      return updatedPayment;
    } catch (error) {
      console.error('Error refunding payment:', error);
      throw error;
    }
  }

  /**
   * Get payment details
   */
  async getPaymentDetails(paymentId: string) {
    try {
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          booking: {
            select: {
              id: true,
              checkInDate: true,
              checkOutDate: true,
              numberOfGuests: true,
              status: true,
              property: {
                select: {
                  id: true,
                  title: true,
                  address: true,
                  city: true,
                  country: true,
                }
              }
            }
          }
        }
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      // Get payment details from provider
      let providerDetails = null;
      if (payment.transactionId) {
        providerDetails = await this.getProviderPaymentDetails(
          payment.provider as PaymentProvider,
          payment.transactionId
        );
      }

      return {
        id: payment.id,
        amount: Number(payment.amount),
        currency: payment.currency,
        status: payment.status,
        provider: payment.provider,
        transactionId: payment.transactionId,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
        booking: payment.booking,
        providerDetails
      };
    } catch (error) {
      console.error('Error getting payment details:', error);
      throw error;
    }
  }

  /**
   * Private method to initialize payment with the selected provider
   * This is a mock implementation that would be replaced with actual API calls
   */
  private async initializeWithProvider(
    paymentId: string,
    amount: number,
    provider: PaymentProvider
  ): Promise<{
    paymentId: string;
    transactionId: string;
    clientToken: string;
    amount: number;
    currency: string;
    redirectUrl?: string;
  }> {
    // This would be replaced with actual payment provider integration
    if (provider === 'STRIPE') {
      // Mock Stripe payment intent creation
      const mockStripeResponse: StripePaymentIntent = {
        id: `pi_${Math.random().toString(36).substring(2, 15)}`,
        amount: amount * 100, // Stripe uses cents
        currency: 'usd',
        status: 'requires_payment_method',
        client_secret: `pi_${Math.random().toString(36).substring(2, 15)}_secret_${Math.random().toString(36).substring(2, 15)}`,
        metadata: {
          payment_id: paymentId
        }
      };

      return {
        paymentId,
        transactionId: mockStripeResponse.id,
        clientToken: mockStripeResponse.client_secret,
        amount,
        currency: 'USD'
      };
    } else if (provider === 'PAYPAL') {
      // Mock PayPal order creation
      const mockPayPalResponse: PayPalOrder = {
        id: `PAYPAL-${Math.random().toString(36).substring(2, 15)}`,
        status: 'CREATED',
        purchase_units: [{
          amount: {
            value: amount.toString(),
            currency_code: 'USD'
          }
        }],
        links: [
          {
            href: `https://www.paypal.com/checkoutnow?token=${Math.random().toString(36).substring(2, 15)}`,
            rel: 'approve',
            method: 'GET'
          }
        ]
      };

      return {
        paymentId,
        transactionId: mockPayPalResponse.id,
        clientToken: '', // PayPal doesn't use client tokens the same way
        amount,
        currency: 'USD',
        redirectUrl: mockPayPalResponse.links.find(link => link.rel === 'approve')?.href
      };
    }

    throw new Error(`Unsupported payment provider: ${provider}`);
  }

  /**
   * Private method to verify payment with provider
   * This is a mock implementation
   */
  private async verifyPaymentWithProvider(
    provider: PaymentProvider,
    transactionId: string,
    transactionDetails: any
  ): Promise<boolean> {
    // In a real implementation, this would verify the payment with the payment provider
    // For now, we'll just return true for demonstration
    return true;
  }

  /**
   * Private method to process refund with provider
   * This is a mock implementation
   */
  private async processRefundWithProvider(
    provider: PaymentProvider,
    transactionId: string,
    amount: number
  ): Promise<any> {
    // In a real implementation, this would process the refund with the payment provider
    // For now, we'll just return a mock response
    return {
      success: true,
      amount,
      transactionId: `refund_${transactionId}`
    };
  }

  /**
   * Private method to get payment details from provider
   * This is a mock implementation
   */
  private async getProviderPaymentDetails(
    provider: PaymentProvider,
    transactionId: string
  ): Promise<any> {
    // In a real implementation, this would fetch payment details from the provider
    // For now, we'll return a mock response
    if (provider === 'STRIPE') {
      return {
        id: transactionId,
        status: 'succeeded',
        amount: 10000, // $100.00
        currency: 'usd',
        payment_method_details: {
          card: {
            brand: 'visa',
            last4: '4242'
          }
        }
      };
    } else if (provider === 'PAYPAL') {
      return {
        id: transactionId,
        status: 'COMPLETED',
        payment_source: {
          paypal: {
            email_address: 'customer@example.com'
          }
        }
      };
    }

    return null;
  }
}

// Export singleton instance
export const paymentService = new PaymentService();
export default paymentService;
