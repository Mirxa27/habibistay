'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useBookings } from '../../../src/hooks/useBookings';
import { usePayments } from '../../../src/hooks/usePayments';
import { useStripePayment } from '../../../src/hooks/useStripePayment';
import { format } from 'date-fns';
import { toast } from 'sonner';
import MainLayout from '../../../src/components/layout/MainLayout';

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession(); // Simplified for build
  const { getBooking } = useBookings();
  const { getPayment } = usePayments();
  const { createPaymentIntent, processPayment } = useStripePayment();

  // Get booking and payment IDs from URL
  const bookingId = searchParams.get('bookingId');
  const paymentId = searchParams.get('paymentId');
  const paymentIntentId = searchParams.get('paymentIntentId');

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [booking, setBooking] = useState<any>(null);
  const [payment, setPayment] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    nameOnCard: ''
  });
  const [paymentIntent, setPaymentIntent] = useState<any>(null);

  // Check if user is authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Load booking and payment details
  useEffect(() => {
    const loadData = async () => {
      if (!bookingId) {
        toast.error('Missing booking information');
        router.push('/' as any);
        return;
      }

      setIsLoading(true);
      try {
        // Load booking details
        const bookingDetails = await getBooking(bookingId);
        if (bookingDetails) {
          setBooking(bookingDetails);
          
          // Check if we have an existing payment intent or need to create one
          if (paymentIntentId) {
            // If we have a payment intent ID in the URL, use that
            setPaymentIntent({ id: paymentIntentId });
          } else if (paymentId) {
            // If we have a payment ID, load payment details
            const paymentDetails = await getPayment(paymentId);
            if (paymentDetails) {
              setPayment(paymentDetails);
              
              // If payment has a transaction ID (Stripe payment intent), set it
              if (paymentDetails.transactionId) {
                setPaymentIntent({ id: paymentDetails.transactionId });
              } else {
                // Create a new payment intent
                await initializePaymentIntent(bookingDetails);
              }
            } else {
              toast.error('Failed to load payment details');
              router.push('/' as any);
              return;
            }
          } else {
            // No payment or payment intent yet, initialize one
            await initializePaymentIntent(bookingDetails);
          }
        } else {
          toast.error('Failed to load booking details');
          router.push('/' as any);
          return;
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('An error occurred while loading your checkout information');
        router.push('/' as any);
      } finally {
        setIsLoading(false);
      }
    };

    if (status === 'authenticated') {
      loadData();
    }
  }, [bookingId, paymentId, paymentIntentId, getBooking, getPayment, router, status]);
  
  // Initialize payment intent
  const initializePaymentIntent = async (bookingData: any) => {
    try {
      // Create a payment intent with Stripe
      const intent = await createPaymentIntent({
        bookingId: bookingData.id,
        amount: bookingData.totalPrice,
        metadata: {
          propertyId: bookingData.propertyId,
          checkInDate: bookingData.checkInDate,
          checkOutDate: bookingData.checkOutDate,
        }
      });
      
      if (intent) {
        setPaymentIntent(intent);
        // Get payment details again now that we've created an intent
        if (paymentId) {
          const updatedPayment = await getPayment(paymentId);
          if (updatedPayment) {
            setPayment(updatedPayment);
          }
        }
      } else {
        throw new Error('Failed to create payment intent');
      }
    } catch (error) {
      console.error('Error initializing payment:', error);
      toast.error('Failed to initialize payment. Please try again later.');
    }
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCardDetails({
      ...cardDetails,
      [name]: value
    });
  };

  // Handle payment method change
  const handlePaymentMethodChange = (method: string) => {
    setPaymentMethod(method);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!paymentIntent || !booking) {
      toast.error('Missing payment information. Please refresh the page and try again.');
      return;
    }

    setIsProcessing(true);
    
    try {
      // Parse expiry date
      const [expMonth, expYear] = cardDetails.expiryDate.split('/');
      
      // Process payment with Stripe
      const result = await processPayment({
        paymentIntentId: paymentIntent.id,
        cardDetails: {
          number: cardDetails.cardNumber.replace(/\s/g, ''),
          exp_month: parseInt(expMonth, 10),
          exp_year: parseInt(`20${expYear}`, 10),
          cvc: cardDetails.cvv,
        }
      });
      
      if (result) {
        toast.success('Payment successful! Redirecting to booking confirmation...');
        
        // Redirect to success page
        setTimeout(() => {
          router.push(`/bookings?success=true&bookingId=${booking.id}` as any);
        }, 2000);
      } else {
        toast.error('Payment failed. Please check your card details and try again.');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('An error occurred while processing your payment');
    } finally {
      setIsProcessing(false);
    }
  };

  // Format booking dates
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'PPP');
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-16">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!booking || !payment) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-16">
          <h1 className="text-3xl font-semibold mb-4">Checkout</h1>
          <p className="text-gray-600">Unable to load checkout information. Please try again later.</p>
          <button
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md"
            onClick={() => router.push('/' as any)}
          >
            Return to Home
          </button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-3xl font-semibold mb-4">Complete Your Booking</h1>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Checkout form */}
          <div className="md:col-span-7">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Payment Information</h2>
              
              {/* Payment method selection */}
              <div className="mb-6">
                <p className="font-medium mb-2">Payment Method</p>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={paymentMethod === 'card'}
                      onChange={() => handlePaymentMethodChange('card')}
                      className="h-4 w-4 text-blue-600"
                    />
                    <span>Credit Card</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="paypal"
                      checked={paymentMethod === 'paypal'}
                      onChange={() => handlePaymentMethodChange('paypal')}
                      className="h-4 w-4 text-blue-600"
                    />
                    <span>PayPal</span>
                  </label>
                </div>
              </div>

              {paymentMethod === 'card' ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
                    <input
                      type="text"
                      name="cardNumber"
                      placeholder="1234 5678 9012 3456"
                      className="w-full p-2 border border-gray-300 rounded-md"
                      value={cardDetails.cardNumber}
                      onChange={handleInputChange}
                      disabled={isProcessing}
                      maxLength={19}
                      pattern="[0-9]{13,19}"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                      <input
                        type="text"
                        name="expiryDate"
                        placeholder="MM/YY"
                        className="w-full p-2 border border-gray-300 rounded-md"
                        value={cardDetails.expiryDate}
                        onChange={handleInputChange}
                        disabled={isProcessing}
                        maxLength={5}
                        pattern="[0-9]{2}/[0-9]{2}"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                      <input
                        type="text"
                        name="cvv"
                        placeholder="123"
                        className="w-full p-2 border border-gray-300 rounded-md"
                        value={cardDetails.cvv}
                        onChange={handleInputChange}
                        disabled={isProcessing}
                        maxLength={4}
                        pattern="[0-9]{3,4}"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name on Card</label>
                    <input
                      type="text"
                      name="nameOnCard"
                      placeholder="John Doe"
                      className="w-full p-2 border border-gray-300 rounded-md"
                      value={cardDetails.nameOnCard}
                      onChange={handleInputChange}
                      disabled={isProcessing}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className={`w-full py-3 rounded-md font-medium text-white transition-colors ${
                      isProcessing 
                        ? 'bg-blue-400 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Processing...' : `Pay $${payment.amount}`}
                  </button>
                </form>
              ) : (
                <div className="space-y-4">
                  <p className="text-gray-600">
                    You will be redirected to PayPal to complete your payment.
                  </p>
                  <button
                    onClick={handleSubmit}
                    className={`w-full py-3 rounded-md font-medium text-white transition-colors ${
                      isProcessing 
                        ? 'bg-blue-400 cursor-not-allowed' 
                        : 'bg-[#0070ba] hover:bg-[#003087]'
                    }`}
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Processing...' : `Pay with PayPal`}
                  </button>
                </div>
              )}

              <p className="mt-4 text-sm text-gray-500 text-center">
                Your payment is secured with SSL encryption.
              </p>
            </div>
          </div>

          {/* Booking summary */}
          <div className="md:col-span-5">
            <div className="bg-white rounded-lg shadow p-6 sticky top-8">
              <h2 className="text-xl font-semibold mb-4">Booking Summary</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">{booking.property?.title}</h3>
                  <p className="text-gray-600 text-sm">{booking.property?.address}, {booking.property?.city}, {booking.property?.country}</p>
                </div>

                <div className="border-t border-b border-gray-100 py-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Check-in</p>
                    <p className="font-medium">{formatDate(booking.checkInDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Check-out</p>
                    <p className="font-medium">{formatDate(booking.checkOutDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Guests</p>
                    <p className="font-medium">{booking.numberOfGuests}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total</span>
                    <span className="font-medium">${payment.amount}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Status</span>
                    <span>{payment.status}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
