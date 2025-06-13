'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth
  // isSameDay, - Not used, commenting out to fix build
  // parseISO - Not used, commenting out to fix build
} from 'date-fns';
import { toast } from 'sonner';
import MainLayout from '../../../components/layout/MainLayout';
import { usePropertyAvailability } from '../../../hooks/usePropertyAvailability';

type Property = {
  id: string;
  title: string;
};

export default function HostCalendarPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { 
    getAvailability, 
    updateAvailability,
    isLoading 
  } = usePropertyAvailability();
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const [properties, setProperties] = useState<Property[]>([]);
  const [availabilityData, setAvailabilityData] = useState<any[]>([]);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState<'available' | 'unavailable'>('available');
  const [customPrice, setCustomPrice] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);

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

  // Fetch host properties
  useEffect(() => {
    if (status === 'authenticated' && 
        (session?.user?.role === 'HOST' || 
         session?.user?.role === 'PROPERTY_MANAGER' || 
         session?.user?.role === 'ADMIN')) {
      fetchProperties();
    }
  }, [status, session]);

  // Fetch properties
  const fetchProperties = async () => {
    try {
      // In a real implementation, this would fetch from the API
      // For now, we'll use mock data
      const mockProperties = [
        { id: '1', title: 'Luxury Beach Villa' },
        { id: '2', title: 'Mountain Cabin Retreat' },
      ];
      
      setProperties(mockProperties);
      
      // Select the first property by default
      if (mockProperties.length > 0 && !selectedProperty) {
        setSelectedProperty(mockProperties[0].id);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast.error('Failed to load your properties');
    }
  };

  // Fetch availability when property or month changes
  useEffect(() => {
    if (selectedProperty) {
      fetchAvailability();
    }
  }, [selectedProperty, currentMonth]);

  // Fetch availability for the selected property and month
  const fetchAvailability = async () => {
    try {
      const startDate = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(addMonths(currentMonth, 1)), 'yyyy-MM-dd');
      
      const data = await getAvailability(selectedProperty, startDate, endDate);
      
      if (data) {
        setAvailabilityData(data.availability);
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
      toast.error('Failed to load availability data');
    }
  };

  // Handle date selection
  const toggleDateSelection = (dateStr: string) => {
    // Check if the date is already booked
    const dateData = availabilityData.find(d => d.date === dateStr);
    if (dateData && dateData.isBooked) {
      toast.error('This date is already booked and cannot be modified');
      return;
    }
    
    setSelectedDates(prev => {
      if (prev.includes(dateStr)) {
        return prev.filter(d => d !== dateStr);
      } else {
        return [...prev, dateStr];
      }
    });
  };

  // Next/previous month navigation
  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  // Update availability for selected dates
  const updateSelectedDates = async () => {
    if (selectedDates.length === 0) {
      toast.error('Please select at least one date');
      return;
    }

    setIsUpdating(true);
    
    try {
      const updates = selectedDates.map(date => ({
        date,
        isAvailable: selectionMode === 'available',
        price: selectionMode === 'available' && customPrice ? parseFloat(customPrice) : undefined
      }));
      
      const result = await updateAvailability(selectedProperty, updates);
      
      if (result) {
        toast.success(`${selectedDates.length} dates updated successfully`);
        fetchAvailability(); // Refresh availability data
        setSelectedDates([]); // Clear selection
        setCustomPrice(''); // Reset custom price
      }
    } catch (error) {
      console.error('Error updating availability:', error);
      toast.error('Failed to update availability');
    } finally {
      setIsUpdating(false);
    }
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedDates([]);
    setCustomPrice('');
  };

  // Generate calendar for current month
  const renderCalendar = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    // Calculate days needed for previous month padding
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const dayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Get days from previous month for padding
    const prevMonthDays = [];
    if (dayOfWeek > 0) {
      const prevMonth = subMonths(currentMonth, 1);
      const prevMonthEnd = endOfMonth(prevMonth);
      for (let i = dayOfWeek - 1; i >= 0; i--) {
        const day = new Date(prevMonthEnd);
        day.setDate(prevMonthEnd.getDate() - i);
        prevMonthDays.push(day);
      }
    }
    
    // Get days for next month padding
    const lastDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const lastDayOfWeek = lastDayOfMonth.getDay();
    
    const nextMonthDays = [];
    if (lastDayOfWeek < 6) {
      const nextMonth = addMonths(currentMonth, 1);
      const nextMonthStart = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 1);
      for (let i = 1; i <= 6 - lastDayOfWeek; i++) {
        const day = new Date(nextMonthStart);
        day.setDate(nextMonthStart.getDate() + i - 1);
        nextMonthDays.push(day);
      }
    }
    
    // Combine all days
    const allDays = [...prevMonthDays, ...days, ...nextMonthDays];
    
    // Split into weeks
    const weeks = [];
    for (let i = 0; i < allDays.length; i += 7) {
      weeks.push(allDays.slice(i, i + 7));
    }
    
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <button
            onClick={prevMonth}
            className="p-2 rounded-full hover:bg-gray-100"
            aria-label="Previous month"
          >
            <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <h2 className="text-lg font-semibold">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          
          <button
            onClick={nextMonth}
            className="p-2 rounded-full hover:bg-gray-100"
            aria-label="Next month"
          >
            <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        
        <div className="bg-gray-50 grid grid-cols-7 gap-px border-b">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center py-2 font-medium text-gray-500 text-xs sm:text-sm">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {weeks.map((week, weekIndex) => (
            <React.Fragment key={weekIndex}>
              {week.map(day => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isSelected = selectedDates.includes(dateStr);
                
                // Find availability data for this date
                const dateData = availabilityData.find(d => d.date === dateStr);
                const isAvailable = dateData ? dateData.isAvailable : true;
                const isBooked = dateData ? dateData.isBooked : false;
                const price = dateData ? dateData.price : 0;
                
                // Determine cell style
                let cellClasses = "relative p-1 h-16 sm:h-24 transition-colors";
                
                if (!isCurrentMonth) {
                  cellClasses += " bg-gray-50 text-gray-400";
                } else if (isSelected) {
                  cellClasses += " bg-blue-100";
                } else if (isBooked) {
                  cellClasses += " bg-yellow-50";
                } else if (!isAvailable) {
                  cellClasses += " bg-red-50";
                } else {
                  cellClasses += " bg-green-50";
                }
                
                return (
                  <div
                    key={dateStr}
                    className={cellClasses}
                    onClick={() => isCurrentMonth && toggleDateSelection(dateStr)}
                  >
                    <div className="flex flex-col h-full">
                      <span className={`text-right text-sm ${isCurrentMonth ? '' : 'text-gray-400'}`}>
                        {format(day, 'd')}
                      </span>
                      
                      {isCurrentMonth && (
                        <div className="flex-grow flex flex-col justify-center items-center">
                          {isBooked && (
                            <span className="inline-block px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                              Booked
                            </span>
                          )}
                          
                          {!isBooked && !isAvailable && (
                            <span className="inline-block px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                              Unavailable
                            </span>
                          )}
                          
                          {!isBooked && isAvailable && price > 0 && (
                            <span className="text-sm font-medium">${price}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  // Loading state
  if (status === 'loading' || isLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-16">
          <h1 className="text-3xl font-semibold mb-8">Availability Calendar</h1>
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-gray-200 rounded w-full md:w-1/3"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
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
          <h1 className="text-3xl font-semibold mb-4">Availability Calendar</h1>
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

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-16">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold">Availability Calendar</h1>
          <p className="mt-2 text-neutral-500">
            Manage your property's availability and pricing
          </p>
        </div>

        {/* Property selector */}
        <div className="mb-8">
          <label htmlFor="property-select" className="block text-sm font-medium text-gray-700 mb-1">
            Select Property
          </label>
          <select
            id="property-select"
            className="w-full md:w-1/3 p-2 border border-gray-300 rounded-md"
            value={selectedProperty}
            onChange={(e) => setSelectedProperty(e.target.value)}
          >
            <option value="" disabled>
              Select a property
            </option>
            {properties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.title}
              </option>
            ))}
          </select>
        </div>

        {/* Legend */}
        <div className="mb-6 flex flex-wrap gap-4">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-50 border border-gray-200 rounded-sm mr-2"></div>
            <span className="text-sm">Available</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-50 border border-gray-200 rounded-sm mr-2"></div>
            <span className="text-sm">Unavailable</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-yellow-50 border border-gray-200 rounded-sm mr-2"></div>
            <span className="text-sm">Booked</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-100 border border-gray-200 rounded-sm mr-2"></div>
            <span className="text-sm">Selected</span>
          </div>
        </div>

        {/* Calendar view */}
        {selectedProperty ? (
          <>
            {/* Calendar */}
            {renderCalendar()}
            
            {/* Selection controls */}
            {selectedDates.length > 0 && (
              <div className="mt-8 p-6 bg-white rounded-lg shadow">
                <h3 className="text-lg font-medium mb-4">
                  {selectedDates.length} {selectedDates.length === 1 ? 'date' : 'dates'} selected
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Set availability
                    </label>
                    <div className="flex gap-4">
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          className="form-radio h-4 w-4 text-blue-600"
                          checked={selectionMode === 'available'}
                          onChange={() => setSelectionMode('available')}
                        />
                        <span className="ml-2">Available</span>
                      </label>
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          className="form-radio h-4 w-4 text-blue-600"
                          checked={selectionMode === 'unavailable'}
                          onChange={() => setSelectionMode('unavailable')}
                        />
                        <span className="ml-2">Unavailable</span>
                      </label>
                    </div>
                  </div>
                  
                  {selectionMode === 'available' && (
                    <div>
                      <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                        Custom price (optional)
                      </label>
                      <div className="relative rounded-md shadow-sm w-full sm:w-1/3">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">$</span>
                        </div>
                        <input
                          type="number"
                          name="price"
                          id="price"
                          className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                          placeholder="0.00"
                          value={customPrice}
                          onChange={(e) => setCustomPrice(e.target.value)}
                          min="0"
                          step="0.01"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">USD</span>
                        </div>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        Leave blank to use the property's default price
                      </p>
                    </div>
                  )}
                  
                  <div className="flex gap-4">
                    <button
                      type="button"
                      className={`px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                        isUpdating ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      onClick={updateSelectedDates}
                      disabled={isUpdating}
                    >
                      {isUpdating ? 'Updating...' : 'Update Selected Dates'}
                    </button>
                    
                    <button
                      type="button"
                      className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      onClick={clearSelection}
                    >
                      Clear Selection
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-yellow-700">
                  Please select a property to manage its availability.
                </p>
                {properties.length === 0 && (
                  <div className="mt-2">
                    <p className="text-yellow-700">
                      You don't have any properties yet. Add a property to get started.
                    </p>
                    <Link
                      href={'/properties/new' as any}
                      className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Add Property
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
