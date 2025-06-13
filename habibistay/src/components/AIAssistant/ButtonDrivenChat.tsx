'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSession, SessionProvider } from 'next-auth/react';
import Image from 'next/image';

// Placeholder icons for better compatibility
const IconComponent = ({ className, children }: { className?: string, children: React.ReactNode }) => (
  <span className={`inline-block ${className || ''}`} style={{ width: '1em', height: '1em' }}>{children}</span>
);

const MicrophoneIcon = ({ size = 24 }: { size?: number }) => (
  <IconComponent>🎤</IconComponent>
);

const StopIcon = ({ size = 24 }: { size?: number }) => (
  <IconComponent>⏹️</IconComponent>
);

const CalendarIcon = ({ size = 24 }: { size?: number }) => (
  <IconComponent>📅</IconComponent>
);

const UsersIcon = ({ size = 24 }: { size?: number }) => (
  <IconComponent>👥</IconComponent>
);

const CreditCardIcon = ({ size = 24 }: { size?: number }) => (
  <IconComponent>💳</IconComponent>
);

const DollarSignIcon = ({ size = 24 }: { size?: number }) => (
  <IconComponent>💰</IconComponent>
);

const StarIcon = ({ className }: { className?: string }) => (
  <IconComponent className={className}>⭐</IconComponent>
);

// Types for message structure
interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  error?: boolean;
  options?: ChatOption[];
  properties?: Property[];
  bookingData?: BookingData;
  dateSelector?: boolean;
  guestSelector?: boolean;
  paymentForm?: boolean;
}

// Chat option buttons
interface ChatOption {
  id: string;
  label: string;
  value: string;
  icon?: React.ReactNode;
  primary?: boolean;
}

// Property type
interface Property {
  id: string;
  name: string;
  description: string;
  location: string;
  price: number;
  image: string;
  rating: number;
  amenities: string[];
  bedrooms?: number;
  beds?: number;
  bathrooms?: number;
  maxGuests?: number;
}

// Booking data structure to track the booking process
interface BookingData {
  propertyId?: string;
  propertyName?: string;
  checkInDate?: string;
  checkOutDate?: string;
  guestCount?: number;
  totalPrice?: number;
  paymentMethod?: 'credit-card' | 'paypal';
  status?: 'started' | 'dates-selected' | 'guests-selected' | 'payment-pending' | 'confirmed';
}

interface ButtonDrivenChatProps {
  initialConversationId?: string;
}

// Simple PropertyCard component directly included here
function PropertyCard({ property }: { property: Property }) {
  return (
    <div className="bg-white rounded-lg overflow-hidden shadow">
      <div className="relative">
        {/* We're using a div with background-image as fallback in case the image path isn't valid */}
        <div 
          className="w-full h-48 bg-cover bg-center" 
          style={{ backgroundImage: `url(${property.image})` }}
        >
          <Image 
            src={property.image}
            alt={property.name}
            fill
            style={{ objectFit: 'cover' }}
            className="rounded-t-lg"
            onError={(e) => {
              // Keep the background image as fallback
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        </div>
        
        {/* Price tag */}
        <div className="absolute top-0 right-0 bg-blue-600 text-white px-3 py-1 m-2 rounded-full font-semibold text-sm">
          ${property.price}/night
        </div>
      </div>
      
      <div className="p-4">
        {/* Rating */}
        <div className="flex items-center mb-2">
          <div className="flex items-center text-yellow-500 mr-1">
            <StarIcon className="fill-current" />
          </div>
          <span className="text-sm font-medium">{property.rating.toFixed(1)}</span>
        </div>
        
        {/* Property name */}
        <h3 className="font-bold text-lg mb-1 text-gray-900">{property.name}</h3>
        
        {/* Location */}
        <p className="text-gray-600 text-sm mb-2">{property.location}</p>
        
        {/* Description */}
        <p className="text-gray-700 text-sm mb-3 line-clamp-2">{property.description}</p>
        
        {/* Amenities */}
        <div className="flex flex-wrap gap-1">
          {property.amenities.slice(0, 2).map((amenity, index) => (
            <span key={index} className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
              {amenity}
            </span>
          ))}
          {property.amenities.length > 2 && (
            <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
              +{property.amenities.length - 2} more
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// Inner component that uses useSession
function ButtonDrivenChatInner({ initialConversationId }: ButtonDrivenChatProps) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(initialConversationId);
  const [isRecording, setIsRecording] = useState(false);
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([]);
  const [isLoadingProperties, setIsLoadingProperties] = useState(true);
  const [currentBooking, setCurrentBooking] = useState<BookingData | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Fallback properties in case API fails
  const fallbackProperties: Property[] = [
    {
      id: "p1",
      name: "Luxury Beachfront Villa",
      description: "Stunning beachfront villa with panoramic ocean views, private pool, and direct beach access.",
      location: "Miami, FL",
      price: 450,
      image: "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?q=80&w=2340&auto=format&fit=crop",
      rating: 4.9,
      amenities: ["Beachfront", "Private Pool", "WiFi", "Kitchen", "Air Conditioning"],
      bedrooms: 3,
      beds: 4,
      bathrooms: 3,
      maxGuests: 8
    },
    {
      id: "p2",
      name: "Modern Downtown Loft",
      description: "Stylish loft in the heart of downtown, walking distance to restaurants, shops, and attractions.",
      location: "New York, NY",
      price: 230,
      image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=2380&auto=format&fit=crop",
      rating: 4.7,
      amenities: ["City View", "Smart TV", "WiFi", "Washer/Dryer", "Doorman"],
      bedrooms: 1,
      beds: 1,
      bathrooms: 1,
      maxGuests: 2
    }
  ];

  // Fetch featured properties
  useEffect(() => {
    const fetchFeaturedProperties = async () => {
      try {
        setIsLoadingProperties(true);
        const response = await fetch('/api/properties/featured?limit=2');
        
        if (!response.ok) {
          throw new Error('Failed to fetch featured properties');
        }
        
        const data = await response.json();
        setFeaturedProperties(data.length > 0 ? data : fallbackProperties);
      } catch (error) {
        console.error('Error fetching featured properties:', error);
        // Fallback to sample properties if there's an error
        setFeaturedProperties(fallbackProperties);
      } finally {
        setIsLoadingProperties(false);
      }
    };

    fetchFeaturedProperties();
  }, []);

  // Add welcome message with property showcasing
  useEffect(() => {
    if (messages.length === 0 && !isLoadingProperties) {
      const options = [
        { id: 'opt-3', label: 'Search Properties', value: 'I want to search for properties' },
        { id: 'opt-4', label: 'Help', value: 'I need help' }
      ];
      
      // Add property-specific options if we have featured properties
      if (featuredProperties.length > 0) {
        for (let i = 0; i < Math.min(featuredProperties.length, 2); i++) {
          options.unshift({ 
            id: `opt-${i+1}`, 
            label: `View Property ${i+1}`, 
            value: `Tell me more about ${featuredProperties[i].name}` 
          });
        }
      }
      
      setMessages([
        {
          id: 'welcome',
          content: featuredProperties.length > 0
            ? "Hello! I'm Sara, your booking assistant. I've selected these amazing properties just for you:"
            : "Hello! I'm Sara, your booking assistant. How can I help you with your stay today?",
          sender: 'assistant',
          timestamp: new Date(),
          properties: featuredProperties.length > 0 ? featuredProperties : undefined,
          options: options
        },
      ]);
    }
  }, [messages, featuredProperties, isLoadingProperties]);

  // Scroll to bottom of chat when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Clean up recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (err) {
          console.error("Error stopping recognition on unmount:", err);
        }
      }
    };
  }, []);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      handleSendMessage(input);
    }
  };

  // Send message to API
  const sendMessageToAPI = async (message: string) => {
    try {
      // Add timeout to the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30-second timeout
      
      // Send message to AI Assistant API
      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          conversationId,
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || 
          `Failed to get response from AI Assistant (${response.status})`
        );
      }

      const data = await response.json();

      // Save conversation ID if this is a new conversation
      if (!conversationId && data.conversationId) {
        setConversationId(data.conversationId);
      }

      return data.message;
    } catch (error) {
      console.error('Error sending message:', error);
      
      // More specific error messages based on error type
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timed out. The server took too long to respond.');
        }
        
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          throw new Error('Network error. Please check your internet connection and try again.');
        }
        
        throw error;
      }
      
      throw new Error('An unexpected error occurred. Please try again.');
    }
  };

  // Process incoming assistant messages to add buttons based on intent
  const processAssistantResponse = (responseText: string): Partial<Message> => {
    // Options to show based on the response content
    let options: ChatOption[] = [];
    let properties: Property[] | undefined = undefined;
    
    // Detect property intent
    if (responseText.includes('property') || responseText.includes('properties') || 
        responseText.includes('stay') || responseText.includes('accommodation')) {
      options.push(
        { id: 'view-details', label: 'View Details', value: 'Show me more details' },
        { id: 'check-availability', label: 'Check Availability', value: 'Check availability' },
        { id: 'book-now', primary: true, label: 'Book Now', value: 'I want to book this property' }
      );
      
      // Show properties if the message mentions available properties
      if (responseText.includes('available properties') || responseText.includes('found properties')) {
        properties = featuredProperties;
      }
    }

    // Detect booking intent
    if (responseText.includes('booking') || responseText.includes('reservation')) {
      options.push(
        { id: 'select-dates', label: 'Select Dates', value: 'I want to select dates' },
        { id: 'guest-count', label: 'Guest Count', value: 'Let me specify number of guests' },
        { id: 'continue-booking', primary: true, label: 'Continue Booking', value: 'Continue with booking' }
      );
    }

    // Detect payment intent
    if (responseText.includes('payment') || responseText.includes('pay') || responseText.includes('price')) {
      options.push(
        { id: 'credit-card', label: 'Credit Card', value: 'I want to pay with credit card' },
        { id: 'paypal', label: 'PayPal', value: 'I want to pay with PayPal' },
        { id: 'confirm-payment', primary: true, label: 'Confirm Payment', value: 'Confirm payment' }
      );
    }

    // Detect authentication intent
    if (responseText.includes('login') || responseText.includes('sign in') || 
        responseText.includes('account') || responseText.includes('register') || 
        responseText.includes('sign up')) {
      options.push(
        { id: 'login', label: 'Login', value: 'I want to login' },
        { id: 'register', label: 'Register', value: 'I want to register' },
        { id: 'continue-guest', primary: true, label: 'Continue as Guest', value: 'Continue as guest' }
      );
    }

    // Detect date selection
    if (responseText.includes('date') || responseText.includes('when') || 
        responseText.includes('calendar') || responseText.includes('check-in') || 
        responseText.includes('check out')) {
      // Add date options (next few days/weeks)
      const today = new Date();
      const dateOptions = [];
      
      for (let i = 1; i <= 3; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const formattedDate = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        dateOptions.push({ 
          id: `date-${i}`, 
          label: formattedDate, 
          value: `I choose ${formattedDate}` 
        });
      }
      
      options.push(...dateOptions);
      options.push({ id: 'other-date', label: 'Other Date', value: 'I want to select a different date' });
    }

    // Detect guest count
    if (responseText.includes('guest') || responseText.includes('people') || 
        responseText.includes('adults') || responseText.includes('children')) {
      options.push(
        { id: 'guests-1', label: '1 Guest', value: '1 guest' },
        { id: 'guests-2', label: '2 Guests', value: '2 guests' },
        { id: 'guests-4', label: '4 Guests', value: '4 guests' },
        { id: 'guests-more', label: 'More Guests', value: 'More than 4 guests' }
      );
    }

    // Detect location intent
    if (responseText.includes('where') || responseText.includes('location') || 
        responseText.includes('city') || responseText.includes('destination')) {
      options.push(
        { id: 'loc-miami', label: 'Miami', value: 'Miami, FL' },
        { id: 'loc-nyc', label: 'New York', value: 'New York City' },
        { id: 'loc-la', label: 'Los Angeles', value: 'Los Angeles' },
        { id: 'loc-other', label: 'Other Location', value: 'I want a different location' }
      );
    }

    // Detect confirmation requests
    if (responseText.includes('confirm') || responseText.includes('proceed') || 
        responseText.includes('correct') || responseText.includes('right')) {
      options.push(
        { id: 'confirm-yes', primary: true, label: 'Yes, Confirm', value: 'Yes, that is correct' },
        { id: 'confirm-no', label: 'No, Change', value: 'No, I need to make changes' }
      );
    }

    // Always add these help options if no specific options were added or add to existing options
    if (options.length === 0) {
      options.push(
        { id: 'search-properties', label: 'Search Properties', value: 'I want to search for properties' },
        { id: 'my-bookings', label: 'My Bookings', value: 'Show my bookings' },
        { id: 'help', label: 'Help', value: 'I need help' }
      );
    } else if (options.length < 6) {
      // Always add a help option in case user needs assistance
      options.push({ id: 'help', label: 'Help', value: 'I need help' });
    }

    // Add a "Back" option for navigation whenever there are other options
    if (options.length > 0) {
      options.push({ id: 'back', label: 'Back', value: 'Go back' });
    }

    return { options, properties };
  };

  // Voice recognition handler
  const startRecording = () => {
    // Check if browser supports speech recognition
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      // Add to messages instead of alert for better UX
      setMessages(prev => [...prev, {
        id: `assistant-${Date.now()}`,
        content: "Voice recognition is not supported in your browser. Please use Chrome or Edge, or type your message instead.",
        sender: 'assistant',
        timestamp: new Date(),
        error: true,
      }]);
      return;
    }

    try {
      // @ts-ignore - TypeScript doesn't know about webkitSpeechRecognition
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      let finalTranscript = '';
      let recognitionTimeout: NodeJS.Timeout;
      
      recognition.onstart = () => {
        setIsRecording(true);
        setInput('Listening...');
        
        // Set a timeout to automatically stop recording after 30 seconds if no speech is detected
        recognitionTimeout = setTimeout(() => {
          recognition.stop();
          // Add a message if nothing was recorded
          if (!finalTranscript) {
            setMessages(prev => [...prev, {
              id: `assistant-${Date.now()}`,
              content: "I didn't hear anything. Please try speaking again or type your message.",
              sender: 'assistant',
              timestamp: new Date(),
              options: [
                { id: 'try-again', label: 'Try Voice Again', value: 'Try voice recognition again' },
              ]
            }]);
          }
        }, 30000);
      };
      
      recognition.onresult = (event) => {
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        // Reset timeout on new speech
        clearTimeout(recognitionTimeout);
        recognitionTimeout = setTimeout(() => {
          recognition.stop();
        }, 5000); // Stop 5 seconds after last speech detected
        
        setInput(finalTranscript || interimTranscript);
      };
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        clearTimeout(recognitionTimeout);
        setIsRecording(false);
        
        // Handle specific errors
        let errorMessage = "There was an error with voice recognition. Please try again or type your message.";
        
        switch(event.error) {
          case 'not-allowed':
          case 'permission-denied':
            errorMessage = "Microphone access was denied. Please allow microphone access and try again.";
            break;
          case 'no-speech':
            errorMessage = "No speech was detected. Please try speaking again or type your message.";
            break;
          case 'network':
            errorMessage = "A network error occurred. Please check your connection and try again.";
            break;
        }
        
        setMessages(prev => [...prev, {
          id: `assistant-${Date.now()}`,
          content: errorMessage,
          sender: 'assistant',
          timestamp: new Date(),
          error: true,
          options: [
            { id: 'try-again', label: 'Try Voice Again', value: 'Try voice recognition again' },
          ]
        }]);
        
        setInput('');
      };
      
      recognition.onend = () => {
        clearTimeout(recognitionTimeout);
        setIsRecording(false);
        if (finalTranscript) {
          handleSendMessage(finalTranscript);
        }
      };
      
      recognition.start();
      recognitionRef.current = recognition;
      
    } catch (error) {
      console.error('Error initializing speech recognition:', error);
      setMessages(prev => [...prev, {
        id: `assistant-${Date.now()}`,
        content: "There was an error starting voice recognition. Please try typing your message instead.",
        sender: 'assistant',
        timestamp: new Date(),
        error: true,
      }]);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error("Error stopping recognition:", err);
      }
    }
  };

  // Handle sending a message (from input, button, or voice)
  const handleSendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) {
      return;
    }

    // Add user message to chat
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: messageText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Show typing indicator
      const typingIndicatorId = `typing-${Date.now()}`;
      setMessages((prev) => [...prev, {
        id: typingIndicatorId,
        content: 'Thinking...',
        sender: 'assistant',
        timestamp: new Date(),
      }]);

      // Get response from AI
      const responseText = await sendMessageToAPI(messageText);
      
      // Remove typing indicator
      setMessages((prev) => prev.filter(msg => msg.id !== typingIndicatorId));
      
      // Process the response to add buttons and properties
      const { options, properties } = processAssistantResponse(responseText);

      // Add assistant response to chat
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        content: responseText,
        sender: 'assistant',
        timestamp: new Date(),
        options,
        properties
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Error sending message:', error);
      
      // Get the error message with fallback to a generic message
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Sorry, I encountered an error. Please try again.';
      
      // Add specific error message to chat
      setMessages((prev) => [...prev.filter(msg => !msg.id.startsWith('typing-')), {
        id: `error-${Date.now()}`,
        content: errorMessage,
        sender: 'assistant',
        timestamp: new Date(),
        error: true,
        options: [
          { id: 'retry', label: 'Try Again', value: messageText },
          { id: 'help', label: 'Get Help', value: 'I need help' }
        ]
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Start the booking process for a property
  const startBookingProcess = (property: Property) => {
    if (!session?.user && !handleAuthProtectedAction('book a property')) return;
    
    // Create a new booking object
    const newBooking: BookingData = {
      propertyId: property.id,
      propertyName: property.name,
      status: 'started'
    };
    
    setCurrentBooking(newBooking);
    
    // Add a message with a date selector
    setMessages(prev => [...prev, {
      id: `booking-start-${Date.now()}`,
      content: `Great! Let's book ${property.name}. First, please select your check-in and check-out dates.`,
      sender: 'assistant',
      timestamp: new Date(),
      bookingData: newBooking,
      dateSelector: true,
      options: [
        { 
          id: 'select-tomorrow', 
          label: 'Tomorrow to Next Day', 
          value: 'Book for tomorrow and the next day',
          icon: <CalendarIcon size={16} />
        },
        { 
          id: 'select-weekend', 
          label: 'This Weekend', 
          value: 'Book for this weekend',
          icon: <CalendarIcon size={16} />
        },
        { 
          id: 'select-week', 
          label: 'Full Week', 
          value: 'Book for a full week',
          icon: <CalendarIcon size={16} /> 
        },
        { 
          id: 'custom-dates', 
          label: 'Custom Dates', 
          value: 'I want to select custom dates',
          icon: <CalendarIcon size={16} /> 
        }
      ]
    }]);
  };
  
  // Handle selecting dates for a booking
  const handleDateSelection = (dateOption: string) => {
    if (!currentBooking) return;
    
    const today = new Date();
    let checkIn: Date, checkOut: Date;
    
    // Set dates based on selected option
    if (dateOption.includes('tomorrow')) {
      checkIn = new Date(today);
      checkIn.setDate(today.getDate() + 1);
      checkOut = new Date(checkIn);
      checkOut.setDate(checkIn.getDate() + 1);
    } else if (dateOption.includes('weekend')) {
      // Find the next Friday and Sunday
      checkIn = new Date(today);
      const dayToFriday = (5 - today.getDay() + 7) % 7;
      checkIn.setDate(today.getDate() + dayToFriday);
      checkOut = new Date(checkIn);
      checkOut.setDate(checkIn.getDate() + 2); // Sunday is 2 days after Friday
    } else if (dateOption.includes('week')) {
      checkIn = new Date(today);
      checkIn.setDate(today.getDate() + 1);
      checkOut = new Date(checkIn);
      checkOut.setDate(checkIn.getDate() + 7);
    } else {
      // For custom dates, we'd normally show a date picker UI
      // For now, just default to next 3 days
      checkIn = new Date(today);
      checkIn.setDate(today.getDate() + 1);
      checkOut = new Date(checkIn);
      checkOut.setDate(checkIn.getDate() + 3);
    }
    
    // Format dates
    const formatDate = (date: Date) => date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
    
    const checkInStr = formatDate(checkIn);
    const checkOutStr = formatDate(checkOut);
    
    // Update the booking object
    const updatedBooking: BookingData = {
      ...currentBooking,
      checkInDate: checkInStr,
      checkOutDate: checkOutStr,
      status: 'dates-selected'
    };
    
    setCurrentBooking(updatedBooking);
    
    // Add a message with the selected dates and guest selector
    setMessages(prev => [...prev, {
      id: `dates-selected-${Date.now()}`,
      content: `Perfect! You've selected check-in on ${checkInStr} and check-out on ${checkOutStr}. How many guests will be staying?`,
      sender: 'assistant',
      timestamp: new Date(),
      bookingData: updatedBooking,
      guestSelector: true,
      options: [
        { id: 'guests-1', label: '1 Guest', value: 'Book for 1 guest', icon: <UsersIcon size={16} /> },
        { id: 'guests-2', label: '2 Guests', value: 'Book for 2 guests', icon: <UsersIcon size={16} /> },
        { id: 'guests-3', label: '3 Guests', value: 'Book for 3 guests', icon: <UsersIcon size={16} /> },
        { id: 'guests-4', label: '4+ Guests', value: 'Book for 4 or more guests', icon: <UsersIcon size={16} /> }
      ]
    }]);
  };
  
  // Handle selecting guest count
  const handleGuestSelection = (guestOption: string) => {
    if (!currentBooking) return;
    
    // Extract guest count from option
    const match = guestOption.match(/(\d+)/);
    let guestCount = 2; // Default to 2 guests
    
    if (match) {
      guestCount = parseInt(match[1], 10);
    }
    
    // If option contains "more", prompt for specific count in future enhancement
    const needsMoreGuests = guestOption.includes('more');
    
    // Update the booking object
    const updatedBooking: BookingData = {
      ...currentBooking,
      guestCount,
      totalPrice: calculatePrice(currentBooking, guestCount),
      status: 'guests-selected'
    };
    
    setCurrentBooking(updatedBooking);
    
    // Show booking summary and payment options
    setMessages(prev => [...prev, {
      id: `booking-summary-${Date.now()}`,
      content: `
Great! Here's your booking summary:
• Property: ${updatedBooking.propertyName}
• Check-in: ${updatedBooking.checkInDate}
• Check-out: ${updatedBooking.checkOutDate}
• Guests: ${updatedBooking.guestCount}
• Total Price: $${updatedBooking.totalPrice}

How would you like to proceed with payment?
      `,
      sender: 'assistant',
      timestamp: new Date(),
      bookingData: updatedBooking,
      paymentForm: true,
      options: [
        { 
          id: 'pay-credit-card', 
          label: 'Credit Card', 
          value: 'Pay with credit card', 
          icon: <CreditCardIcon size={16} />,
          primary: true
        },
        { 
          id: 'pay-paypal', 
          label: 'PayPal', 
          value: 'Pay with PayPal', 
          icon: <DollarSignIcon size={16} /> 
        },
        { 
          id: 'modify-booking', 
          label: 'Modify Booking', 
          value: 'I want to modify my booking' 
        },
        { 
          id: 'cancel-booking', 
          label: 'Cancel', 
          value: 'Cancel this booking' 
        }
      ]
    }]);
  };
  
  // Process payment for booking
  const handlePaymentSelection = (paymentOption: string) => {
    if (!currentBooking) return;
    
    // Determine payment method
    let paymentMethod: 'credit-card' | 'paypal' = 'credit-card';
    
    if (paymentOption.toLowerCase().includes('paypal')) {
      paymentMethod = 'paypal';
    }
    
    // Handle cancel booking request
    if (paymentOption.toLowerCase().includes('cancel')) {
      setMessages(prev => [...prev, {
        id: `booking-cancelled-${Date.now()}`,
        content: `Your booking has been cancelled. Is there anything else I can help you with?`,
        sender: 'assistant',
        timestamp: new Date(),
        options: [
          { id: 'new-search', label: 'Search Properties', value: 'I want to search for other properties' },
          { id: 'help', label: 'Help', value: 'I need help with something else' }
        ]
      }]);
      
      setCurrentBooking(null);
      return;
    }
    
    // Handle modification request
    if (paymentOption.toLowerCase().includes('modify')) {
      setMessages(prev => [...prev, {
        id: `modify-booking-${Date.now()}`,
        content: `What would you like to modify in your booking?`,
        sender: 'assistant',
        timestamp: new Date(),
        bookingData: currentBooking,
        options: [
          { id: 'modify-dates', label: 'Change Dates', value: 'I want to change the dates' },
          { id: 'modify-guests', label: 'Change Guests', value: 'I want to change the number of guests' },
          { id: 'continue-unchanged', label: 'Continue Unchanged', value: 'Continue with the current booking' }
        ]
      }]);
      return;
    }
    
    // Update the booking object
    const updatedBooking: BookingData = {
      ...currentBooking,
      paymentMethod,
      status: 'payment-pending'
    };
    
    setCurrentBooking(updatedBooking);
    
    // Show payment processing and confirmation
    setMessages(prev => [...prev, {
      id: `payment-processing-${Date.now()}`,
      content: `Processing your payment via ${paymentMethod === 'credit-card' ? 'credit card' : 'PayPal'}...`,
      sender: 'assistant',
      timestamp: new Date(),
      bookingData: updatedBooking
    }]);
    
    // Simulate payment processing
    setTimeout(() => {
      const finalBooking: BookingData = {
        ...updatedBooking,
        status: 'confirmed'
      };
      
      setCurrentBooking(finalBooking);
      
      // Show booking confirmation
      setMessages(prev => [...prev, {
        id: `booking-confirmed-${Date.now()}`,
        content: `
🎉 Congratulations! Your booking is confirmed.

Booking Reference: #${Math.floor(100000 + Math.random() * 900000)}

• Property: ${finalBooking.propertyName}
• Check-in: ${finalBooking.checkInDate}
• Check-out: ${finalBooking.checkOutDate}
• Guests: ${finalBooking.guestCount}
• Total Paid: $${finalBooking.totalPrice}

A confirmation email has been sent to your registered email address. You can manage your booking in your account dashboard.

Is there anything else I can help you with?
        `,
        sender: 'assistant',
        timestamp: new Date(),
        bookingData: finalBooking,
        options: [
          { id: 'view-booking', label: 'View My Booking', value: 'View my booking details', primary: true },
          { id: 'need-help', label: 'Need Help', value: 'I need help with my booking' },
          { id: 'done', label: 'I\'m Done', value: 'That\'s all, thank you' }
        ]
      }]);
    }, 2000);
  };
  
  // Helper function to calculate booking price
  const calculatePrice = (booking: BookingData, guestCount: number): number => {
    // Find the property in the featured properties list
    const property = featuredProperties.find(p => p.id === booking.propertyId);
    
    if (!property) return 0;
    
    // Get base price
    const basePrice = property.price;
    
    // Calculate number of nights (simplified for now - would use proper date handling in production)
    const nights = 2;
    
    // Calculate guest price factor (more guests = slightly higher price)
    const guestFactor = 1 + ((guestCount - 1) * 0.1);
    
    // Calculate total price with cleaning fee
    const cleaningFee = 50;
    const totalPrice = Math.round((basePrice * nights * guestFactor) + cleaningFee);
    
    return totalPrice;
  };

  // Handle option click with booking flow integration
  const handleOptionClick = (value: string) => {
    // Handle booking flow commands
    if (value.includes('Book for') && value.includes('guest')) {
      handleGuestSelection(value);
      return;
    }
    
    if (value.includes('Book for') && (
        value.includes('tomorrow') || 
        value.includes('weekend') || 
        value.includes('week') || 
        value.includes('custom dates'))) {
      handleDateSelection(value);
      return;
    }
    
    if (value.includes('Pay with') || 
        value === 'Cancel this booking' || 
        value === 'I want to modify my booking') {
      handlePaymentSelection(value);
      return;
    }
    
    // Check if the action requires authentication
    if (
      value.includes('book') || 
      value.includes('payment') || 
      value.includes('confirm') ||
      value.toLowerCase().includes('my bookings')
    ) {
      const canProceed = handleAuthProtectedAction(value.toLowerCase());
      if (!canProceed) return;
    }
    
    // Handle authentication options directly
    if (value === 'I want to login') {
      handleAuthentication('login');
      return;
    } else if (value === 'I want to register') {
      handleAuthentication('register');
      return;
    } else if (value === 'Continue as guest') {
      handleAuthentication('guest');
      return;
    }
    
    // If not a special command, send as regular message
    handleSendMessage(value);
  };

  // Handle clicking on a property with booking option
  const handlePropertyClick = (property: Property) => {
    // Show property details with booking option
    setMessages(prev => [...prev, {
      id: `property-details-${Date.now()}`,
      content: `Here are details for ${property.name}:

Located in ${property.location}, this property offers ${property.bedrooms || 2} bedrooms, ${property.beds || 2} beds, and ${property.bathrooms || 1} bathroom(s).

Price: $${property.price} per night

Amenities: ${property.amenities.join(', ')}

Would you like to book this property?`,
      sender: 'assistant',
      timestamp: new Date(),
      properties: [property],
      options: [
        { id: 'book-now', label: 'Book Now', value: `I want to book ${property.name}`, primary: true },
        { id: 'check-availability', label: 'Check Availability', value: `Check availability for ${property.name}` },
        { id: 'more-info', label: 'More Details', value: `Tell me more about ${property.name}` },
        { id: 'back', label: 'Back', value: 'Go back to search' }
      ]
    }]);
  };

  // Handle login, register, and continue as guest
  const handleAuthentication = (action: 'login' | 'register' | 'guest') => {
    if (action === 'login') {
      window.location.href = '/login';
    } else if (action === 'register') {
      window.location.href = '/register';
    } else {
      // For guest mode, we'll just proceed with the chat
      setMessages([
        {
          id: 'welcome',
          content: "You're continuing as a guest. You can browse properties and check availability, but you'll need to sign in to make a booking.",
          sender: 'assistant',
          timestamp: new Date(),
          options: [
            { id: 'search-properties', label: 'Search Properties', value: 'I want to search for properties' },
            { id: 'login-later', label: 'Login Later', value: 'I will login later' },
            { id: 'help', label: 'Help', value: 'I need help' }
          ]
        }
      ]);
    }
  };

  // Handle chatbot messages that require authentication
  const handleAuthProtectedAction = (action: string) => {
    if (!session?.user) {
      setMessages(prev => [...prev, {
        id: `auth-required-${Date.now()}`,
        content: "You'll need to sign in to " + action + ". Would you like to login, register, or continue browsing as a guest?",
        sender: 'assistant',
        timestamp: new Date(),
        options: [
          { id: 'login', label: 'Login', value: 'I want to login' },
          { id: 'register', label: 'Register', value: 'I want to register' },
          { id: 'continue-guest', primary: true, label: 'Continue as Guest', value: 'Continue as guest' }
        ]
      }]);
      return false;
    }
    return true;
  };

  return (
    <div className="flex flex-col h-full border rounded-lg shadow-lg overflow-hidden">
      {/* Chat header */}
      <div className="p-4 border-b bg-white">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <span className="h-2 w-2 bg-green-500 rounded-full mr-2"></span>
            Sara (AI Booking Assistant)
          </h2>
          <button
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            onClick={() => {
              setMessages([]);
              setConversationId(initialConversationId);
            }}
            title="Clear conversation"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Chat messages */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[90%] rounded-lg p-4 ${
                message.sender === 'user'
                  ? 'bg-blue-600 text-white'
                  : message.error
                    ? 'bg-red-100 text-red-900'
                    : 'bg-white border border-gray-200 text-gray-900 shadow-sm'
              }`}
            >
              {/* Message content */}
              <p className="break-words whitespace-pre-wrap">{message.content}</p>
              
              {/* Display property cards if available */}
              {message.properties && message.properties.length > 0 && (
                <div className="mt-4 grid gap-4 grid-cols-1 sm:grid-cols-2">
                  {message.properties.map(property => (
                    <div 
                      key={property.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow" 
                      onClick={() => handlePropertyClick(property)}
                    >
                      <PropertyCard property={property} />
                    </div>
                  ))}
                </div>
              )}
              
              {/* Date Selector UI */}
              {message.dateSelector && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-800 mb-2">Select Dates</h4>
                  {/* Simple date selector with buttons */}
                  <div className="flex flex-wrap gap-2">
                    {/* Date options are provided through message.options */}
                  </div>
                </div>
              )}
              
              {/* Guest Selector UI */}
              {message.guestSelector && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-800 mb-2">Select Number of Guests</h4>
                  {/* Guest selector buttons are provided through message.options */}
                </div>
              )}
              
              {/* Payment Form UI */}
              {message.paymentForm && message.bookingData && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-800 mb-2">Payment Methods</h4>
                  <div className="space-y-3">
                    <div className="flex items-center p-3 bg-white rounded border border-gray-300 cursor-pointer hover:border-blue-500">
                      <CreditCardIcon size={20} className="text-blue-600 mr-2" />
                      <span>Credit or Debit Card</span>
                    </div>
                    <div className="flex items-center p-3 bg-white rounded border border-gray-300 cursor-pointer hover:border-blue-500">
                      <DollarSignIcon size={20} className="text-blue-600 mr-2" />
                      <span>PayPal</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Your payment information is secure and encrypted.
                  </p>
                </div>
              )}
              
              {/* Booking Confirmation */}
              {message.bookingData?.status === 'confirmed' && (
                <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center mb-2">
                    <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <h4 className="font-medium text-green-800">Booking Confirmed</h4>
                  </div>
                  <p className="text-sm text-green-700">
                    Your booking reference has been sent to your email.
                  </p>
                </div>
              )}
              
              {/* Option buttons */}
              {message.options && message.options.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {message.options.map(option => (
                    <button
                      key={option.id}
                      onClick={() => handleOptionClick(option.value)}
                      className={`px-4 py-2 rounded-full border text-sm font-medium flex items-center space-x-1 transition-colors ${
                        option.primary 
                          ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700' 
                          : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {option.icon && <span className="mr-1">{option.icon}</span>}
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
              )}
              
              {/* Message timestamp */}
              <p className="text-xs text-right mt-2 opacity-70">
                {message.sender === 'user' ? 'You' : 'Sara'} • {new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-4 border-t bg-white">
        <div className="mb-2">
          <div className="flex flex-wrap gap-2 mb-2">
            <button 
              onClick={() => handleSendMessage("I'm looking for a property")}
              className="px-3 py-2 text-sm bg-gray-100 text-gray-800 rounded-full hover:bg-gray-200 transition-colors"
            >
              Find a property
            </button>
            <button 
              onClick={() => handleSendMessage("What about my booking?")}
              className="px-3 py-2 text-sm bg-gray-100 text-gray-800 rounded-full hover:bg-gray-200 transition-colors"
            >
              My bookings
            </button>
            <button 
              onClick={() => handleSendMessage("I need help")}
              className="px-3 py-2 text-sm bg-gray-100 text-gray-800 rounded-full hover:bg-gray-200 transition-colors"
            >
              Help
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => {
              if (isRecording) {
                stopRecording();
              } else {
                startRecording();
              }
            }}
            className={`p-2 rounded-full transition-colors ${
              isRecording
                ? 'bg-red-500 text-white animate-pulse'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            title={isRecording ? "Stop recording" : "Start voice input"}
          >
            {isRecording ? <StopIcon size={20} /> : <MicrophoneIcon size={20} />}
          </button>
          
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isRecording ? "Listening..." : "Type your message..."}
            className="flex-1 p-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isRecording || isLoading}
          />
          
          <button
            type="submit"
            disabled={isLoading || (!input.trim() && !isRecording)}
            className={`px-4 py-2 rounded-full transition-colors ${
              isLoading || (!input.trim() && !isRecording)
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              'Send'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// Main component wrapper with SessionProvider
export default function ButtonDrivenChat(props: ButtonDrivenChatProps) {
  return (
    <SessionProvider>
      <ButtonDrivenChatInner {...props} />
    </SessionProvider>
  );
}
