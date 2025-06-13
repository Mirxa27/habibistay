import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface AvailabilityDay {
  date: string;
  isAvailable: boolean;
  price: number;
  isBooked: boolean;
  bookingId: string | null;
}

interface PropertyAvailability {
  propertyId: string;
  startDate: string;
  endDate: string;
  basePrice: number;
  availability: AvailabilityDay[];
}

interface AvailabilityUpdateItem {
  date: string;
  isAvailable: boolean;
  price?: number;
}

interface AvailabilityUpdateResponse {
  results: Array<{
    date: string;
    status: 'success' | 'error';
    message?: string;
    availability?: any;
  }>;
}

export function usePropertyAvailability() {
  const [isLoading, setIsLoading] = useState(false);
  const [availability, setAvailability] = useState<AvailabilityDay[]>([]);
  const [basePrice, setBasePrice] = useState<number>(0);

  // Get availability for a specific date range
  const getAvailability = useCallback(async (
    propertyId: string,
    startDate: string,
    endDate: string
  ): Promise<PropertyAvailability | null> => {
    setIsLoading(true);
    
    try {
      const response = await fetch(
        `/api/properties/${propertyId}/availability?startDate=${startDate}&endDate=${endDate}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch availability');
      }
      
      const data: PropertyAvailability = await response.json();
      setAvailability(data.availability);
      setBasePrice(data.basePrice);
      
      return data;
    } catch (error) {
      console.error('Error fetching availability:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch availability');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update availability for specific dates
  const updateAvailability = useCallback(async (
    propertyId: string,
    dates: AvailabilityUpdateItem[]
  ): Promise<AvailabilityUpdateResponse | null> => {
    setIsLoading(true);
    
    try {
      const response = await fetch(
        `/api/properties/${propertyId}/availability`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ dates }),
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update availability');
      }
      
      const data: AvailabilityUpdateResponse = await response.json();
      
      // Check if there were any errors
      const errors = data.results.filter(result => result.status === 'error');
      if (errors.length > 0) {
        // Some dates failed to update
        toast.warning(`${errors.length} dates could not be updated`);
      } else {
        toast.success('Availability updated successfully');
      }
      
      return data;
    } catch (error) {
      console.error('Error updating availability:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update availability');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check if a specific date range is available
  const checkAvailabilityForBooking = useCallback(async (
    propertyId: string,
    checkInDate: string,
    checkOutDate: string
  ): Promise<{isAvailable: boolean; unavailableDates: string[]}> => {
    try {
      const data = await getAvailability(propertyId, checkInDate, checkOutDate);
      
      if (!data) {
        return { isAvailable: false, unavailableDates: [] };
      }
      
      const unavailableDates = data.availability
        .filter(day => !day.isAvailable || day.isBooked)
        .map(day => day.date);
      
      return {
        isAvailable: unavailableDates.length === 0,
        unavailableDates
      };
    } catch (error) {
      console.error('Error checking availability for booking:', error);
      return { isAvailable: false, unavailableDates: [] };
    }
  }, [getAvailability]);

  // Calculate the total price for a booking
  const calculateBookingPrice = useCallback((
    checkInDateString: string,
    checkOutDateString: string,
    availabilityData: AvailabilityDay[] | null = null
  ): { totalNights: number; priceBreakdown: {date: string; price: number}[]; totalPrice: number } => {
    try {
      const checkInDate = new Date(checkInDateString);
      const checkOutDate = new Date(checkOutDateString);
      
      // Calculate nights
      const diffTime = Math.abs(checkOutDate.getTime() - checkInDate.getTime());
      const totalNights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (isNaN(totalNights) || totalNights <= 0) {
        return { totalNights: 0, priceBreakdown: [], totalPrice: 0 };
      }
      
      const data = availabilityData || availability;
      let priceBreakdown: {date: string; price: number}[] = [];
      
      // If we have availability data, calculate price from custom prices
      if (data && data.length > 0) {
        // Create a map of date -> price for easier lookup
        const priceMap = new Map<string, number>();
        data.forEach(day => {
          priceMap.set(day.date, day.price);
        });
        
        // Calculate price for each night of the stay
        const currentDate = new Date(checkInDate);
        while (currentDate < checkOutDate) {
          const dateString = currentDate.toISOString().split('T')[0];
          const price = priceMap.get(dateString) || basePrice;
          
          priceBreakdown.push({
            date: dateString,
            price
          });
          
          // Move to next day
          currentDate.setDate(currentDate.getDate() + 1);
        }
      } else {
        // No availability data, just use base price
        const currentDate = new Date(checkInDate);
        while (currentDate < checkOutDate) {
          const dateString = currentDate.toISOString().split('T')[0];
          
          priceBreakdown.push({
            date: dateString,
            price: basePrice
          });
          
          // Move to next day
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
      
      // Calculate total price
      const totalPrice = priceBreakdown.reduce((total, day) => total + day.price, 0);
      
      return {
        totalNights,
        priceBreakdown,
        totalPrice
      };
    } catch (error) {
      console.error('Error calculating booking price:', error);
      return { totalNights: 0, priceBreakdown: [], totalPrice: 0 };
    }
  }, [availability, basePrice]);

  return {
    isLoading,
    availability,
    basePrice,
    getAvailability,
    updateAvailability,
    checkAvailabilityForBooking,
    calculateBookingPrice,
  };
}
