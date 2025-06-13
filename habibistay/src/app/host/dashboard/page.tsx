'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { toast } from 'sonner';
import MainLayout from '../../../components/layout/MainLayout';
import { useBookings } from '../../../hooks/useBookings';
import { BookingStatus } from '@prisma/client';

export default function HostDashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { getBookings, confirmBooking, rejectBooking, bookings, isLoading } = useBookings();
  
  const [currentTab, setCurrentTab] = useState<'pending' | 'upcoming' | 'past' | 'all'>('all');
  const [processingBookingId, setProcessingBookingId] = useState<string | null>(null);

  // Redirect if not authenticated or not a host
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login' as any);
    } else if (
      status === 'authenticated' && 
      session?.user?.role !== 'HOST' && 
      session?.user?.role !== 'PROPERTY_MANAGER' && 
      session?.user?.role !== 'ADMIN'
    ) {
      router.push('/' as any);
      toast.error('You need to be a host to access this page');
    }
  }, [router, status, session]);

  // Fetch bookings when session is loaded
  useEffect(() => {
    if (status === 'authenticated' && 
        (session?.user?.role === 'HOST' || 
         session?.user?.role === 'PROPERTY_MANAGER' || 
         session?.user?.role === 'ADMIN')) {
      fetchBookings();
    }
  }, [status, session]);

  // Fetch bookings based on current tab
  const fetchBookings = async () => {
    const options: any = {};
    
    // Only fetch bookings for the host's properties
    // We don't need to specify propertyId because the API will filter by user's properties
    
    if (currentTab === 'pending') {
      options.status = BookingStatus.PENDING;
    } else if (currentTab === 'upcoming') {
      options.status = BookingStatus.CONFIRMED;
    } else if (currentTab === 'past') {
      options.status = [BookingStatus.COMPLETED, BookingStatus.CANCELLED, BookingStatus.REJECTED];
    }
    
    await getBookings(options);
  };

  // Filter bookings based on tab
  const getFilteredBookings = () => {
    if (currentTab === 'pending') {
      return bookings.filter(booking => booking.status === BookingStatus.PENDING);
    } else if (currentTab === 'upcoming') {
      return bookings.filter(booking => booking.status === BookingStatus.CONFIRMED);
    } else if (currentTab === 'past') {
      return bookings.filter(booking => 
        booking.status === BookingStatus.COMPLETED || 
        booking.status === BookingStatus.CANCELLED ||
        booking.status === BookingStatus.REJECTED
      );
    }
    return bookings;
  };

  // Handle booking status updates
  const handleConfirmBooking = async (bookingId: string) => {
    setProcessingBookingId(bookingId);
    try {
      await confirmBooking(bookingId);
      toast.success('Booking confirmed successfully');
      fetchBookings(); // Refresh bookings
    } catch (error) {
      toast.error('Failed to confirm booking');
      console.error('Error confirming booking:', error);
    } finally {
      setProcessingBookingId(null);
    }
  };

  const handleRejectBooking = async (bookingId: string) => {
    if (confirm('Are you sure you want to reject this booking?')) {
      setProcessingBookingId(bookingId);
      try {
        await rejectBooking(bookingId);
        toast.success('Booking rejected successfully');
        fetchBookings(); // Refresh bookings
      } catch (error) {
        toast.error('Failed to reject booking');
        console.error('Error rejecting booking:', error);
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
          <h1 className="text-3xl font-semibold mb-8">Host Dashboard</h1>
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

  // Unauthorized access
  if (status === 'authenticated' && 
      session?.user?.role !== 'HOST' && 
      session?.user?.role !== 'PROPERTY_MANAGER' && 
      session?.user?.role !== 'ADMIN') {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-16">
          <h1 className="text-3xl font-semibold mb-4">Host Dashboard</h1>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-yellow-700">
                  You need to be a host to access this page. Would you like to become a host?
                </p>
                <div className="mt-4">
                  <Link
                    href={'/become-host' as any}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    Become a Host
                  </Link>
                </div>
              </div>
            </div>
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
          <h1 className="text-3xl font-semibold">Host Dashboard</h1>
          <p className="mt-2 text-neutral-500">
            Manage your properties and bookings
          </p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-sm uppercase text-gray-500 font-medium">Pending Bookings</h3>
            <p className="mt-2 text-3xl font-semibold">
              {bookings.filter(b => b.status === BookingStatus.PENDING).length}
            </p>
            <p className="text-sm text-gray-500 mt-1">Need your response</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-sm uppercase text-gray-500 font-medium">Upcoming Stays</h3>
            <p className="mt-2 text-3xl font-semibold">
              {bookings.filter(b => b.status === BookingStatus.CONFIRMED).length}
            </p>
            <p className="text-sm text-gray-500 mt-1">Confirmed bookings</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-sm uppercase text-gray-500 font-medium">Total Bookings</h3>
            <p className="mt-2 text-3xl font-semibold">{bookings.length}</p>
            <p className="text-sm text-gray-500 mt-1">Across all properties</p>
          </div>
        </div>

        {/* Actions buttons */}
        <div className="flex flex-wrap gap-4 mb-8">
          <Link
            href={'/properties/new' as any}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add New Property
          </Link>
          
          <Link
            href={'/host/analytics' as any}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            View Analytics
          </Link>
          
          <Link
            href={'/host/calendar' as any}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Manage Availability
          </Link>
          
          <Link
            href={'/host/settings' as any}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Host Settings
          </Link>
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
              onClick={() => { setCurrentTab('pending'); fetchBookings(); }}
              className={`py-4 px-6 font-medium text-sm ${
                currentTab === 'pending'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Pending
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
              Past
            </button>
          </nav>
        </div>

        {/* Booking list */}
        <div className="space-y-6">
          {filteredBookings.length === 0 ? (
            <div className="text-center py-8">
              <h3 className="text-lg font-medium text-gray-900">No bookings found</h3>
              <p className="mt-1 text-gray-500">
                {currentTab === 'pending'
                  ? 'You have no pending bookings requiring action'
                  : currentTab === 'upcoming'
                  ? 'You have no upcoming confirmed bookings'
                  : currentTab === 'past'
                  ? 'You have no past bookings'
                  : 'You have not received any bookings yet'}
              </p>
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
                  <div className="flex justify-between">
                    <h3 className="text-lg font-medium">{booking.property?.title}</h3>
                    <span
                      className={`inline-block px-2 py-1 h-fit text-xs font-medium rounded-full ${getStatusBadgeClass(booking.status)}`}
                    >
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1).toLowerCase()}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className="text-sm text-neutral-500">Guest</p>
                      <p className="font-medium">{booking.guest?.name}</p>
                      <p className="text-sm text-neutral-500">{booking.guest?.email}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-neutral-500">Dates</p>
                      <p className="font-medium">
                        {formatDate(booking.checkInDate)} - {formatDate(booking.checkOutDate)}
                      </p>
                      <p className="text-sm text-neutral-500">
                        {booking.numberOfGuests} {booking.numberOfGuests === 1 ? 'guest' : 'guests'}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-neutral-500">Payment</p>
                      <p className="font-medium">${booking.totalPrice}</p>
                      <p className="text-sm text-neutral-500">
                        {booking.payments && booking.payments[0]?.status
                          ? `Payment ${booking.payments[0].status.toLowerCase()}`
                          : 'No payment info'}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-neutral-500">Booked on</p>
                      <p className="font-medium">{formatDate(booking.createdAt)}</p>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="mt-4 flex space-x-2">
                    {booking.status === BookingStatus.PENDING && (
                      <>
                        <button
                          onClick={() => handleConfirmBooking(booking.id)}
                          className={`px-3 py-1 text-sm text-white bg-green-600 rounded hover:bg-green-700 ${
                            processingBookingId === booking.id ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          disabled={processingBookingId === booking.id}
                        >
                          {processingBookingId === booking.id ? 'Processing...' : 'Confirm'}
                        </button>
                        
                        <button
                          onClick={() => handleRejectBooking(booking.id)}
                          className={`px-3 py-1 text-sm text-white bg-red-600 rounded hover:bg-red-700 ${
                            processingBookingId === booking.id ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          disabled={processingBookingId === booking.id}
                        >
                          {processingBookingId === booking.id ? 'Processing...' : 'Reject'}
                        </button>
                      </>
                    )}
                    
                    <Link
                      href={`/messages?bookingId=${booking.id}` as any}
                      className="px-3 py-1 text-sm text-blue-600 border border-blue-600 rounded hover:bg-blue-50"
                    >
                      Message Guest
                    </Link>
                    
                    <Link
                      href={`/bookings/${booking.id}` as any}
                      className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                    >
                      View Details
                    </Link>
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
