'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { toast } from 'sonner';
// Temporarily use text placeholders instead of react-icons for build
// import { FaCalendarAlt, FaUsers, FaMoneyBillWave, FaMapMarkerAlt, FaCheckCircle, FaTimesCircle, FaInfoCircle } from 'react-icons/fa';
import MainLayout from '../../../../src/components/layout/MainLayout';
import { useBookings } from '../../../../src/hooks/useBookings';
import { BookingStatus, PaymentStatus } from '@prisma/client';
import BookingStatusTimeline from '../../../../src/components/bookings/BookingStatusTimeline';

// Placeholder components for the build
const IconPlaceholder = ({ name }: { name: string }) => {
  const icons: Record<string, string> = {
    FaCalendarAlt: '📅',
    FaUsers: '👥',
    FaMoneyBillWave: '💰',
    FaMapMarkerAlt: '📍',
    FaCheckCircle: '✓',
    FaTimesCircle: '✗',
    FaInfoCircle: 'ℹ️'
  };
  
  return <span className="mr-2">{icons[name] || '•'}</span>;
};

export default function BookingDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { status: authStatus } = useSession(); // Simplified for build
  const { getBooking, cancelBooking, currentBooking, isLoading } = useBookings();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const bookingId = params.id;

  // Redirect if not authenticated
  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/login');
    }
  }, [router, authStatus]);

  // Fetch booking when session is loaded
  useEffect(() => {
    if (authStatus === 'authenticated' && bookingId) {
      fetchBooking();
    }
  }, [authStatus, bookingId]);

  // Fetch booking details
  const fetchBooking = async () => {
    try {
      await getBooking(bookingId);
    } catch (error) {
      console.error('Error fetching booking:', error);
      toast.error('Failed to load booking details');
    }
  };

  // Handle cancel booking
  const handleCancelBooking = async () => {
    if (confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) {
      setIsProcessing(true);
      try {
        await cancelBooking(bookingId);
        toast.success('Booking cancelled successfully');
        fetchBooking(); // Refresh booking details
      } catch (error) {
        console.error('Error cancelling booking:', error);
        toast.error('Failed to cancel booking');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMMM d, yyyy');
  };

  // Loading state
  if (authStatus === 'loading' || isLoading || !currentBooking) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-8">
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  // If booking not found or doesn't belong to the current user
  if (!currentBooking) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl font-semibold mb-4">Booking Not Found</h1>
            <p className="text-gray-600 mb-6">
              The booking you are looking for does not exist or you don't have permission to view it.
            </p>
            <Link
              href={"/bookings" as any}
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Back to My Bookings
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  const booking = currentBooking;
  const paymentStatus = booking.payments?.[0]?.status || 'UNKNOWN';
  // Variable used in conditions below
  const isUpcoming = new Date(booking.checkInDate) > new Date();
  // Const below would be used in UI conditions if needed
  // const isPast = new Date(booking.checkOutDate) < new Date();
  const canCancel = (booking.status === BookingStatus.PENDING || booking.status === BookingStatus.CONFIRMED) && isUpcoming;
  
  // Calculate nights
  const nights = Math.ceil(
    (new Date(booking.checkOutDate).getTime() - new Date(booking.checkInDate).getTime()) / 
    (1000 * 60 * 60 * 24)
  );

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold">Booking Details</h1>
            <Link
              href={"/bookings" as any}
              className="text-blue-600 hover:text-blue-800"
            >
              ← Back to All Bookings
            </Link>
          </div>
          
          {/* Booking Status Banner */}
          <div 
            className={`p-4 rounded-lg mb-8 ${
              booking.status === BookingStatus.CONFIRMED
                ? 'bg-green-50 border border-green-200'
                : booking.status === BookingStatus.PENDING
                ? 'bg-yellow-50 border border-yellow-200'
                : booking.status === BookingStatus.CANCELLED || booking.status === BookingStatus.REJECTED
                ? 'bg-red-50 border border-red-200'
                : booking.status === BookingStatus.COMPLETED
                ? 'bg-blue-50 border border-blue-200'
                : 'bg-gray-50 border border-gray-200'
            }`}
          >
            <div className="flex items-center">
              {booking.status === BookingStatus.CONFIRMED && (
                <IconPlaceholder name="FaCheckCircle" />
              )}
              {booking.status === BookingStatus.PENDING && (
                <IconPlaceholder name="FaInfoCircle" />
              )}
              {(booking.status === BookingStatus.CANCELLED || booking.status === BookingStatus.REJECTED) && (
                <IconPlaceholder name="FaTimesCircle" />
              )}
              {booking.status === BookingStatus.COMPLETED && (
                <IconPlaceholder name="FaCheckCircle" />
              )}
              
              <div>
                <h3 className="font-medium">
                  {booking.status === BookingStatus.CONFIRMED && 'Booking Confirmed'}
                  {booking.status === BookingStatus.PENDING && 'Booking Pending'}
                  {booking.status === BookingStatus.CANCELLED && 'Booking Cancelled'}
                  {booking.status === BookingStatus.REJECTED && 'Booking Rejected'}
                  {booking.status === BookingStatus.COMPLETED && 'Stay Completed'}
                </h3>
                <p className="text-sm">
                  {booking.status === BookingStatus.CONFIRMED && 'Your booking has been confirmed. You\'re all set for your stay!'}
                  {booking.status === BookingStatus.PENDING && 'Your booking is pending confirmation from the host.'}
                  {booking.status === BookingStatus.CANCELLED && 'This booking has been cancelled.'}
                  {booking.status === BookingStatus.REJECTED && 'Sorry, the host has rejected this booking request.'}
                  {booking.status === BookingStatus.COMPLETED && 'Your stay has been completed. We hope you had a great time!'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Booking Status Timeline */}
          <BookingStatusTimeline booking={booking} />
          
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Booking Information */}
            <div className="md:col-span-2 space-y-6">
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="relative h-64 w-full">
                  {booking.property?.images?.[0]?.secureUrl ? (
                    <Image
                      src={booking.property.images[0].secureUrl}
                      alt={booking.property.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400">No image available</span>
                    </div>
                  )}
                </div>
                
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-2">{booking.property?.title}</h2>
                  <p className="flex items-center text-gray-600 mb-4">
                    <IconPlaceholder name="FaMapMarkerAlt" />
                    {booking.property?.address}, {booking.property?.city}, {booking.property?.country}
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                    <div className="flex items-start">
                      <IconPlaceholder name="FaCalendarAlt" />
                      <div>
                        <p className="font-medium">Check-in</p>
                        <p className="text-gray-600">{formatDate(booking.checkInDate)}</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <IconPlaceholder name="FaCalendarAlt" />
                      <div>
                        <p className="font-medium">Check-out</p>
                        <p className="text-gray-600">{formatDate(booking.checkOutDate)}</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <IconPlaceholder name="FaUsers" />
                      <div>
                        <p className="font-medium">Guests</p>
                        <p className="text-gray-600">{booking.numberOfGuests} {booking.numberOfGuests === 1 ? 'guest' : 'guests'}</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <IconPlaceholder name="FaMoneyBillWave" />
                      <div>
                        <p className="font-medium">Duration</p>
                        <p className="text-gray-600">{nights} {nights === 1 ? 'night' : 'nights'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                      href={`/properties/${booking.propertyId}` as any} 
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      View Property
                    </Link>
                    
                    {canCancel && (
                      <button
                        onClick={handleCancelBooking}
                        disabled={isProcessing}
                        className={`px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 ${
                          isProcessing ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {isProcessing ? 'Processing...' : 'Cancel Booking'}
                      </button>
                    )}
                    
                    {booking.status === BookingStatus.COMPLETED && (
                      <Link
                        href={`/reviews/write?bookingId=${booking.id}` as any}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        Write a Review
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Payment Summary */}
            <div className="md:col-span-1">
              <div className="bg-white rounded-lg shadow p-6 sticky top-8">
                <h3 className="text-lg font-semibold mb-4">Price Details</h3>
                <div className="space-y-3 border-b border-gray-100 pb-4">
                  <div className="flex justify-between">
                    <span>${booking.property?.price} x {nights} nights</span>
                    <span>${Number(booking.property?.price) * nights}</span>
                  </div>
                  {booking.property?.cleaningFee && (
                    <div className="flex justify-between">
                      <span>Cleaning fee</span>
                      <span>${booking.property.cleaningFee}</span>
                    </div>
                  )}
                  {booking.property?.serviceFee && (
                    <div className="flex justify-between">
                      <span>Service fee</span>
                      <span>${booking.property.serviceFee}</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-between font-bold pt-4">
                  <span>Total</span>
                  <span>${booking.totalPrice}</span>
                </div>
                
                {/* Payment Status */}
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <h4 className="font-medium mb-2">Payment Status</h4>
                  <div 
                    className={`p-2 rounded text-sm ${
                      paymentStatus === PaymentStatus.COMPLETED
                        ? 'bg-green-100 text-green-800'
                        : paymentStatus === PaymentStatus.PENDING
                        ? 'bg-yellow-100 text-yellow-800'
                        : paymentStatus === PaymentStatus.REFUNDED
                        ? 'bg-blue-100 text-blue-800'
                        : paymentStatus === PaymentStatus.FAILED
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {paymentStatus === PaymentStatus.COMPLETED && 'Payment Complete'}
                    {paymentStatus === PaymentStatus.PENDING && 'Payment Pending'}
                    {paymentStatus === PaymentStatus.REFUNDED && 'Payment Refunded'}
                    {paymentStatus === PaymentStatus.FAILED && 'Payment Failed'}
                    {paymentStatus === PaymentStatus.PARTIAL_REFUND && 'Partial Refund Issued'}
                    {paymentStatus === 'UNKNOWN' && 'Payment Status Unknown'}
                  </div>
                  
                  {booking.payments && booking.payments.length > 0 && (
                    <div className="mt-3 text-sm text-gray-600">
                      <p>Payment Method: {booking.payments[0].provider}</p>
                      {booking.payments[0].transactionId && (
                        <p className="truncate">
                          Transaction ID: {booking.payments[0].transactionId}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Host Information */}
                {booking.property?.owner && (
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <h4 className="font-medium mb-2">Host Information</h4>
                    <div className="flex items-center">
                      {booking.property.owner.image ? (
                        <Image
                          src={booking.property.owner.image}
                          alt={booking.property.owner.name || 'Host'}
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-gray-400 text-sm">
                            {booking.property.owner.name?.charAt(0) || 'H'}
                          </span>
                        </div>
                      )}
                      <div className="ml-3">
                        <p className="font-medium">{booking.property.owner.name}</p>
                        <Link 
                          href={`/messages?host=${booking.property.owner.id}` as any}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Send a message
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
