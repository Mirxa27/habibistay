'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface StripePaymentIntent {
  id: string;
  client_secret: string;
  amount: number;
  currency: string;
  status: string;
}

interface CardDetails {
  number: string;
  exp_month: number;
  exp_year: number;
  cvc: string;
}

export function useStripePayment() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentIntent, setPaymentIntent] = useState<StripePaymentIntent | null>(null);

  // Create a payment intent
  const createPaymentIntent = useCallback(async ({
    bookingId,
    amount,
    currency = 'usd',
    metadata = {}
  }: {
    bookingId: string;
    amount: number;
    currency?: string;
    metadata?: Record<string, any>;
  }) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/payments/stripe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId,
          amount,
          currency,
          metadata
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create payment intent');
      }
      
      const data = await response.json();
      setPaymentIntent(data);
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create payment intent';
      setError(message);
      console.error('Error creating payment intent:', error);
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Process a payment with a payment method
  const processPayment = useCallback(async ({
    paymentIntentId,
    cardDetails,
  }: {
    paymentIntentId: string;
    cardDetails: CardDetails;
  }) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real app, you would use Stripe.js to create a payment method and confirm the payment
      // Since we're mocking it, we'll just call our API directly
      
      // Create a mock payment method ID
      const paymentMethodId = `pm_${Math.random().toString(36).substring(2, 15)}`;
      
      // Confirm the payment intent
      const response = await fetch('/api/payments/stripe', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentIntentId,
          paymentMethodId,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process payment');
      }
      
      const data = await response.json();
      setPaymentIntent(data);
      
      // Check payment intent status
      if (data.status === 'succeeded') {
        toast.success('Payment processed successfully');
        return data;
      } else {
        throw new Error(`Payment failed with status: ${data.status}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to process payment';
      setError(message);
      console.error('Error processing payment:', error);
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check the status of a payment intent
  const checkPaymentStatus = useCallback(async (paymentIntentId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/payments/stripe?paymentIntentId=${paymentIntentId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to check payment status');
      }
      
      const data = await response.json();
      setPaymentIntent(data);
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to check payment status';
      setError(message);
      console.error('Error checking payment status:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    paymentIntent,
    createPaymentIntent,
    processPayment,
    checkPaymentStatus,
  };
}
