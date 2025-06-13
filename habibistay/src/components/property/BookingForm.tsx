'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format, addDays, differenceInDays } from 'date-fns';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { usePropertyAvailability } from '../../hooks/usePropertyAvailability';
import { useBookings } from '../../hooks/useBookings';
import { usePayments } from '../../hooks/usePayments';

// Placeholder for date picker component
// import DatePicker from 'react-datepicker';
// import 'react-datepicker/dist/react-datepicker.css';

// Simplified DatePicker component
const DatePicker = ({ 
  selected, 
  onChange, 
  minDate, 
  maxDate, 
  // dateFormat, // Removed unused parameter
  placeholderText, 
  className, 
  required, 
  disabled 
}: any) => (
  <input
    type="date"
    value={selected ? format(selected, 'yyyy-MM-dd') : ''}
    onChange={(e) => {
      if (e.target.value) {
        onChange(new Date(e.target.value));
      } else {
        onChange(null);
      }
    }}
    min={minDate ? format(minDate, 'yyyy-MM-dd') : undefined}
    max={maxDate ? format(maxDate, 'yyyy-MM-dd') : undefined}
    placeholder={placeholderText}
    className={className}
    required={required}
    disabled={disabled}
  />
);

interface PropertyDetails {
  id: string;
  title: string;
  price: number;
  cleaningFee?: number;
  serviceFee?: number;
  maxGuests: number;
}

interface BookingFormProps {
  property: PropertyDetails;
  className?: string;
}

export default function BookingForm({ property, className = '' }: BookingFormProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { getAvailability, checkAvailabilityForBooking, calculateBookingPrice } = usePropertyAvailability();
  const { createBooking } = useBookings();
  const { initializePayment } = usePayments();

  // Form state
  const [checkInDate, setCheckInDate] = useState<Date | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);
  const [guests, setGuests] = useState(1);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [availabilityChecked, setAvailabilityChecked] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);

  // Price calculation state
  const [basePrice, setBasePrice] = useState(property.price);
  const [cleaningFee] = useState(property.cleaningFee || 0);
  const [serviceFee] = useState(property.serviceFee || 0);
  const [totalNights, setTotalNights] = useState(0);
  const [nightsPrice, setNightsPrice] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);

  // Calculate min and max dates for the date picker
  const today = new Date();
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 1);

  // When dates change, check availability and update prices
  useEffect(() => {
    if (checkInDate && checkOutDate) {
      // Calculate nights
      const nights = differenceInDays(checkOutDate, checkInDate);
      setTotalNights(nights);

      // Reset availability check
      setAvailabilityChecked(false);
      setIsAvailable(false);

      // Format dates for API
      const checkInStr = format(checkInDate, 'yyyy-MM-dd');
      const checkOutStr = format(checkOutDate, 'yyyy-MM-dd');

      // Get availability and calculate price
      const loadAvailability = async () => {
        setIsCheckingAvailability(true);
        
        try {
          const availabilityData = await getAvailability(
            property.id, 
            checkInStr, 
            checkOutStr
          );
          
          if (availabilityData) {
            // Calculate price based on availability data
            const priceCalculation = calculateBookingPrice(
              checkInStr,
              checkOutStr,
              availabilityData.availability
            );
            
            setBasePrice(availabilityData.basePrice);
            setNightsPrice(priceCalculation.totalPrice);
            setTotalPrice(priceCalculation.totalPrice + cleaningFee + serviceFee);

            // Check if all dates are available
            const { isAvailable } = await checkAvailabilityForBooking(
              property.id,
              checkInStr,
              checkOutStr
            );
            
            setIsAvailable(isAvailable);
            setAvailabilityChecked(true);
          }
        } catch (error) {
          console.error('Error checking availability:', error);
          toast.error('Error checking availability. Please try again.');
        } finally {
          setIsCheckingAvailability(false);
        }
      };
      
      loadAvailability();
    } else {
      // Reset when dates are cleared
      setTotalNights(0);
      setNightsPrice(0);
      setTotalPrice(0);
      setAvailabilityChecked(false);
      setIsAvailable(false);
    }
  }, [checkInDate, checkOutDate, property.id, getAvailability, checkAvailabilityForBooking, calculateBookingPrice, cleaningFee, serviceFee]);

  // Handle booking request
  const handleBooking = async () => {
    if (!session) {
      // Redirect to login if not authenticated
      toast.error('Please sign in to book this property');
      router.push('/login');
      return;
    }

    if (!checkInDate || !checkOutDate) {
      toast.error('Please select check-in and check-out dates');
      return;
    }

    if (!isAvailable) {
      toast.error('This property is not available for the selected dates');
      return;
    }

    setIsBooking(true);

    try {
      // Format dates for API
      const checkInStr = format(checkInDate, 'yyyy-MM-dd');
      const checkOutStr = format(checkOutDate, 'yyyy-MM-dd');

      // Create booking
      const booking = await createBooking({
        propertyId: property.id,
        checkInDate: checkInStr,
        checkOutDate: checkOutStr,
        numberOfGuests: guests,
      });

      if (booking) {
        // Initialize payment
        const paymentInit = await initializePayment(booking.id);
        
        if (paymentInit) {
          // Redirect to checkout page with booking and payment info
          router.push(`/checkout?bookingId=${booking.id}&paymentId=${paymentInit.paymentId}`);
        } else {
          toast.error('Error initializing payment. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error('Error creating booking. Please try again.');
    } finally {
      setIsBooking(false);
    }
  };

  // Generate guest options
  const guestOptions = [];
  for (let i = 1; i <= property.maxGuests; i++) {
    guestOptions.push(
      <option key={i} value={i}>
        {i} {i === 1 ? 'guest' : 'guests'}
      </option>
    );
  }

  // Custom day renderer removed as it's not used

  return (
    <div className={`bg-white rounded-xl shadow-md overflow-hidden ${className}`}>
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className="text-2xl font-bold">${basePrice}</span>
            <span className="text-gray-600"> night</span>
          </div>
          {availabilityChecked && (
            <div className={`text-sm font-medium ${isAvailable ? 'text-green-600' : 'text-red-600'}`}>
              {isAvailable ? 'Available' : 'Unavailable'}
            </div>
          )}
        </div>

        <form className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Check-in</label>
              <DatePicker
                selected={checkInDate}
                onChange={(date: Date | null) => {
                  setCheckInDate(date);
                  // If checkout date is earlier than checkin, reset it
                  if (checkOutDate && date && date >= checkOutDate) {
                    setCheckOutDate(addDays(date, 1));
                  }
                }}
                minDate={today}
                maxDate={maxDate}
                dateFormat="yyyy-MM-dd"
                placeholderText="Select date"
                className="w-full p-2 border border-gray-300 rounded-md"
                required
                disabled={isCheckingAvailability || isBooking}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Check-out</label>
              <DatePicker
                selected={checkOutDate}
                onChange={(date: Date | null) => setCheckOutDate(date)}
                minDate={checkInDate ? addDays(checkInDate, 1) : addDays(today, 1)}
                maxDate={maxDate}
                dateFormat="yyyy-MM-dd"
                placeholderText="Select date"
                className="w-full p-2 border border-gray-300 rounded-md"
                required
                disabled={!checkInDate || isCheckingAvailability || isBooking}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Guests</label>
            <select
              className="w-full p-2 border border-gray-300 rounded-md"
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value))}
              disabled={isBooking}
            >
              {guestOptions}
            </select>
          </div>

          <button
            type="button"
            className={`w-full py-3 rounded-md font-medium transition-colors ${
              isBooking || isCheckingAvailability || !availabilityChecked || !isAvailable
                ? 'bg-blue-400 cursor-not-allowed text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
            onClick={handleBooking}
            disabled={isBooking || isCheckingAvailability || !availabilityChecked || !isAvailable}
          >
            {isBooking ? 'Booking...' : isCheckingAvailability ? 'Checking...' : 'Book now'}
          </button>

          <p className="text-center text-sm text-gray-500">
            You won't be charged yet
          </p>

          {totalNights > 0 && (
            <div className="space-y-2 pt-4 border-t border-gray-200">
              <div className="flex justify-between">
                <span className="text-gray-600">${basePrice} x {totalNights} {totalNights === 1 ? 'night' : 'nights'}</span>
                <span>${nightsPrice}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Cleaning fee</span>
                <span>${cleaningFee}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Service fee</span>
                <span>${serviceFee}</span>
              </div>
              <div className="flex justify-between pt-4 border-t border-gray-300 font-bold">
                <div>Total</div>
                <div>${totalPrice}</div>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
