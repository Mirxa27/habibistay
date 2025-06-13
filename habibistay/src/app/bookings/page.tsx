'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { toast } from 'sonner';
import MainLayout from '../../../src/components/layout/MainLayout';
import { useBookings } from '../../../src/hooks/useBookings';
import { BookingStatus } from '@prisma/client';

export default function BookingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession(); // Simplified for build
  const { getBookings, cancelBooking, bookings, isLoading } = useBookings();
  
  const [currentTab, setCurrentTab] = useState<'upcoming' | 'past' | 'all'>('all');
  const [processingBookingId, setProcessingBookingId] = useState<string | null>(null);

  // Check for a success message from checkout
  const success = searchParams.get('success');
  const successBookingId = searchParams.get('bookingId');

  useEffect(() => {
    if (success === 'true' && successBookingId) {
      toast.success('Booking confirmed successfully!');
    }
  }, [success, successBookingId]);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [router, status]);

  // Fetch bookings when session is loaded
  useEffect(() => {
    if (status === 'authenticated') {
      fetchBookings();
    }
  }, [status]);

  // Fetch bookings based on current tab
  const fetchBookings = async () => {
    const options: any = {};
    
    if (currentTab === 'upcoming') {
      options.status = [BookingStatus.PENDING, BookingStatus.CONFIRMED];
    } else if (currentTab === 'past') {
      options.status = [BookingStatus.COMPLETED, BookingStatus.CANCELLED];
    }
    
    await getBookings(options);
  };

  // Filter bookings based on tab
  const getFilteredBookings = () => {
    if (currentTab === 'upcoming') {
      return bookings.filter(booking => 
        booking.status === BookingStatus.PENDING || 
        booking.status === BookingStatus.CONFIRMED
      );
    } else if (currentTab === 'past') {
      return bookings.filter(booking => 
        booking.status === BookingStatus.COMPLETED || 
        booking.status === BookingStatus.CANCELLED
      );
    }
    return bookings;
  };

  // Handle cancel booking
  const handleCancelBooking = async (bookingId: string) => {
    if (confirm('Are you sure you want to cancel this booking?')) {
      setProcessingBookingId(bookingId);
      try {
        await cancelBooking(bookingId);
        toast.success('Booking cancelled successfully');
        fetchBookings(); // Refresh bookings
      } catch (error) {
        toast.error('Failed to cancel booking');
        console.error('Error cancelling booking:', error);
      } finally {
        setProcessingBookingId(null);
      }
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'PPP');
  };

  // Get status badge class based on booking status
  const getStatusBadgeClass = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case BookingStatus.CONFIRMED:
        return 'bg-green-100 text-green-800';
      case BookingStatus.CANCELLED:
        return 'bg-red-100 text-red-800';
      case BookingStatus.COMPLETED:
        return 'bg-blue-100 text-blue-800';
      case BookingStatus.REJECTED:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Loading state
  if (status === 'loading' || isLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-16">
          <h1 className="text-3xl font-semibold mb-8">Your Bookings</h1>
          <div className="animate-pulse space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex flex-col md:flex-row gap-4 p-4 border rounded-lg shadow-sm">
                <div className="relative w-full md:w-48 h-32 bg-gray-200 rounded-lg"></div>
                <div className="flex-grow space-y-4">
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="flex flex-wrap gap-4">
                    <div className="h-12 bg-gray-200 rounded w-24"></div>
                    <div className="h-12 bg-gray-200 rounded w-24"></div>
                    <div className="h-12 bg-gray-200 rounded w-24"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  const filteredBookings = getFilteredBookings();

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-16">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold">Your Bookings</h1>
          <p className="mt-2 text-neutral-500">
            Manage and view your upcoming and past stays
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => { setCurrentTab('all'); fetchBookings(); }}
              className={`py-4 px-6 font-medium text-sm ${
                currentTab === 'all'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              All Bookings
            </button>
            <button
              onClick={() => { setCurrentTab('upcoming'); fetchBookings(); }}
              className={`py-4 px-6 font-medium text-sm ${
                currentTab === 'upcoming'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => { setCurrentTab('past'); fetchBookings(); }}
              className={`py-4 px-6 font-medium text-sm ${
                currentTab === 'past'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Past Stays
            </button>
          </nav>
        </div>

        {/* Booking list */}
        <div className="space-y-6">
          {filteredBookings.length === 0 ? (
            <div className="text-center py-8">
              <h3 className="text-lg font-medium text-gray-900">No bookings found</h3>
              <p className="mt-1 text-gray-500">
                {currentTab === 'upcoming'
                  ? 'You have no upcoming bookings'
                  : currentTab === 'past'
                  ? 'You have no past bookings'
                  : 'You have not made any bookings yet'}
              </p>
              <Link 
                href={"/" as any}
                className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Find a place to stay
              </Link>
            </div>
          ) : (
            filteredBookings.map((booking) => (
              <div
                key={booking.id}
                className="flex flex-col md:flex-row gap-4 p-4 border rounded-lg shadow-sm"
              >
                <div className="relative w-full md:w-48 h-32 rounded-lg overflow-hidden">
                  {booking.property?.images?.[0]?.secureUrl ? (
                    <Image
                      src={booking.property.images[0].secureUrl}
                      alt={booking.property.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400">No image</span>
                    </div>
                  )}
                </div>
                <div className="flex-grow">
                  <h3 className="text-lg font-medium">{booking.property?.title}</h3>
                  <p className="text-neutral-500 text-sm mt-1">
                    {booking.property?.address}, {booking.property?.city}, {booking.property?.country}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-4">
                    <div>
                      <p className="text-sm text-neutral-500">Check-in</p>
                      <p className="font-medium">{formatDate(booking.checkInDate)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-500">Check-out</p>
                      <p className="font-medium">{formatDate(booking.checkOutDate)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-500">Status</p>
                      <span
                        className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(booking.status)}`}
                      >
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1).toLowerCase()}
                      </span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="mt-4 flex space-x-2">
                    <Link
                      href={`/bookings/${booking.id}` as any}
                      className="px-3 py-1 text-sm text-blue-600 border border-blue-600 rounded hover:bg-blue-50"
                    >
                      View Details
                    </Link>
                    
                    <Link
                      href={`/properties/${booking.propertyId}` as any}
                      className="px-3 py-1 text-sm text-blue-600 border border-blue-600 rounded hover:bg-blue-50"
                    >
                      View Property
                    </Link>
                    
                    {booking.status === BookingStatus.PENDING && (
                      <button
                        onClick={() => handleCancelBooking(booking.id)}
                        className={`px-3 py-1 text-sm text-red-600 border border-red-600 rounded hover:bg-red-50 ${
                          processingBookingId === booking.id ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        disabled={processingBookingId === booking.id}
                      >
                        {processingBookingId === booking.id ? 'Cancelling...' : 'Cancel Booking'}
                      </button>
                    )}
                    
                    {booking.status === BookingStatus.CONFIRMED && (
                      <button
                        onClick={() => handleCancelBooking(booking.id)}
                        className={`px-3 py-1 text-sm text-red-600 border border-red-600 rounded hover:bg-red-50 ${
                          processingBookingId === booking.id ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        disabled={processingBookingId === booking.id}
                      >
                        {processingBookingId === booking.id ? 'Cancelling...' : 'Cancel Booking'}
                      </button>
                    )}
                    
                    {booking.status === BookingStatus.COMPLETED && (
                      <Link
                        href={`/reviews/write?bookingId=${booking.id}` as any}
                        className="px-3 py-1 text-sm text-green-600 border border-green-600 rounded hover:bg-green-50"
                      >
                        Write Review
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </MainLayout>
  );
}
