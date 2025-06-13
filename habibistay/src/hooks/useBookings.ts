import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { BookingStatus } from '@prisma/client';

// Types for booking data
export interface Booking {
  id: string;
  propertyId: string;
  guestId: string;
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: number;
  totalPrice: number;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
  property?: {
    title: string;
    address: string;
    city: string;
    country: string;
    price: number;
    cleaningFee?: number;
    serviceFee?: number;
    images?: Array<{
      url: string;
      secureUrl: string;
    }>;
    owner?: {
      id: string;
      name: string;
      image: string | null;
    }
  };
  guest?: {
    name: string;
    email: string;
    image: string;
  };
  payments?: Array<{
    id: string;
    amount: number;
    status: string;
    provider: string;
    transactionId?: string;
  }>;
}

interface BookingCreateRequest {
  propertyId: string;
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: number;
  specialRequests?: string;
}

interface BookingUpdateRequest {
  status?: BookingStatus;
  specialRequests?: string;
}

interface BookingsResponse {
  bookings: Booking[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export function useBookings() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0,
  });

  // Get all bookings for the current user (or filtered bookings)
  const getBookings = useCallback(async (
    options: {
      page?: number;
      limit?: number;
      status?: BookingStatus;
      propertyId?: string;
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
      if (options.propertyId) params.append('propertyId', options.propertyId);
      
      const response = await fetch(`/api/bookings?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch bookings');
      }
      
      const data: BookingsResponse = await response.json();
      setBookings(data.bookings);
      setPagination(data.pagination);
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch bookings';
      setError(errorMessage);
      console.error('Error fetching bookings:', error);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get a single booking by id
  const getBooking = useCallback(async (bookingId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/bookings/${bookingId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch booking');
      }
      
      const booking: Booking = await response.json();
      setCurrentBooking(booking);
      return booking;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch booking';
      setError(errorMessage);
      console.error('Error fetching booking:', error);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create a new booking
  const createBooking = useCallback(async (bookingData: BookingCreateRequest) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create booking');
      }
      
      const newBooking: Booking = await response.json();
      toast.success('Booking created successfully');
      return newBooking;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create booking';
      setError(errorMessage);
      console.error('Error creating booking:', error);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update a booking
  const updateBooking = useCallback(async (
    bookingId: string,
    updateData: BookingUpdateRequest
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update booking');
      }
      
      const updatedBooking: Booking = await response.json();
      
      // Update current booking if it matches
      if (currentBooking?.id === bookingId) {
        setCurrentBooking(updatedBooking);
      }
      
      // Update bookings list if it contains this booking
      setBookings(prevBookings => 
        prevBookings.map(booking => 
          booking.id === bookingId ? updatedBooking : booking
        )
      );
      
      toast.success('Booking updated successfully');
      return updatedBooking;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update booking';
      setError(errorMessage);
      console.error('Error updating booking:', error);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [currentBooking]);

  // Cancel a booking
  const cancelBooking = useCallback(async (bookingId: string) => {
    return updateBooking(bookingId, { status: BookingStatus.CANCELLED });
  }, [updateBooking]);

  // Confirm a booking (for hosts)
  const confirmBooking = useCallback(async (bookingId: string) => {
    return updateBooking(bookingId, { status: BookingStatus.CONFIRMED });
  }, [updateBooking]);

  // Reject a booking (for hosts)
  const rejectBooking = useCallback(async (bookingId: string) => {
    return updateBooking(bookingId, { status: BookingStatus.REJECTED });
  }, [updateBooking]);

  // Complete a booking (for hosts)
  const completeBooking = useCallback(async (bookingId: string) => {
    return updateBooking(bookingId, { status: BookingStatus.COMPLETED });
  }, [updateBooking]);

  // Delete a booking (admin only)
  const deleteBooking = useCallback(async (bookingId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete booking');
      }
      
      // Remove from bookings list
      setBookings(prevBookings => 
        prevBookings.filter(booking => booking.id !== bookingId)
      );
      
      // Clear current booking if it matches
      if (currentBooking?.id === bookingId) {
        setCurrentBooking(null);
      }
      
      toast.success('Booking deleted successfully');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete booking';
      setError(errorMessage);
      console.error('Error deleting booking:', error);
      toast.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [currentBooking]);

  return {
    isLoading,
    error,
    bookings,
    currentBooking,
    pagination,
    getBookings,
    getBooking,
    createBooking,
    updateBooking,
    cancelBooking,
    confirmBooking,
    rejectBooking,
    completeBooking,
    deleteBooking,
  };
}
