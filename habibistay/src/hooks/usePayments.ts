import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { PaymentStatus } from '@prisma/client';
import { PaymentProvider } from '@/services/paymentService';

// Define types for payment data
export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  currency: string;
  provider: string;
  transactionId: string | null;
  status: PaymentStatus;
  createdAt: string;
  updatedAt: string;
  booking?: {
    id: string;
    checkInDate: string;
    checkOutDate: string;
    numberOfGuests: number;
    status: string;
    property: {
      id: string;
      title: string;
      address: string;
      city: string;
      country: string;
    };
  };
  providerDetails?: any;
}

interface PaymentInitResponse {
  paymentId: string;
  transactionId: string;
  clientToken: string;
  amount: number;
  currency: string;
  redirectUrl?: string;
}

interface PaymentsResponse {
  payments: Payment[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export function usePayments() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentInit, setPaymentInit] = useState<PaymentInitResponse | null>(null);

  // Initialize a payment for a booking
  const initializePayment = useCallback(async (
    bookingId: string,
    provider?: PaymentProvider
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId,
          provider
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to initialize payment');
      }
      
      const data: PaymentInitResponse = await response.json();
      setPaymentInit(data);
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize payment';
      setError(errorMessage);
      console.error('Error initializing payment:', error);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Complete a payment
  const completePayment = useCallback(async (
    paymentId: string,
    transactionDetails: any
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/payments/${paymentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'complete',
          transactionDetails
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to complete payment');
      }
      
      const updatedPayment: Payment = await response.json();
      setPayment(updatedPayment);
      
      toast.success('Payment completed successfully');
      return updatedPayment;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to complete payment';
      setError(errorMessage);
      console.error('Error completing payment:', error);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Process a refund
  const refundPayment = useCallback(async (
    paymentId: string,
    amount?: number
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/payments/${paymentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'refund',
          amount
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process refund');
      }
      
      const updatedPayment: Payment = await response.json();
      setPayment(updatedPayment);
      
      toast.success(amount ? 'Partial refund processed successfully' : 'Refund processed successfully');
      return updatedPayment;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process refund';
      setError(errorMessage);
      console.error('Error processing refund:', error);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get payment details
  const getPayment = useCallback(async (paymentId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/payments/${paymentId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch payment details');
      }
      
      const data: Payment = await response.json();
      setPayment(data);
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch payment details';
      setError(errorMessage);
      console.error('Error fetching payment details:', error);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get all payments (admin only)
  const getPayments = useCallback(async (
    options: {
      page?: number;
      limit?: number;
      status?: PaymentStatus;
      bookingId?: string;
    } = {}
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (options.page) params.append('page', options.page.toString());
      if (options.limit) params.append('limit', options.limit.toString());
      if (options.status) params.append('status', options.status);
      if (options.bookingId) params.append('bookingId', options.bookingId);
      
      const response = await fetch(`/api/payments?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch payments');
      }
      
      const data: PaymentsResponse = await response.json();
      setPayments(data.payments);
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch payments';
      setError(errorMessage);
      console.error('Error fetching payments:', error);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get payment status label
  const getPaymentStatusLabel = useCallback((status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.PENDING:
        return 'Pending';
      case PaymentStatus.COMPLETED:
        return 'Completed';
      case PaymentStatus.FAILED:
        return 'Failed';
      case PaymentStatus.REFUNDED:
        return 'Refunded';
      case PaymentStatus.PARTIAL_REFUND:
        return 'Partially Refunded';
      default:
        return status;
    }
  }, []);

  return {
    isLoading,
    error,
    payment,
    payments,
    paymentInit,
    initializePayment,
    completePayment,
    refundPayment,
    getPayment,
    getPayments,
    getPaymentStatusLabel,
  };
}
