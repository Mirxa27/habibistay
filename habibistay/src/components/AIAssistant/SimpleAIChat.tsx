'use client';

import { useState, useEffect, useRef } from 'react';

// Placeholder icon components since we're having issues with react-icons
const IconComponent = ({ className, children }: { className?: string, children: React.ReactNode }) => (
  <span className={`inline-block ${className || ''}`} style={{ width: '1em', height: '1em' }}>{children}</span>
);

const FaExclamationTriangle = ({ className }: { className?: string }) => <IconComponent className={className}>⚠️</IconComponent>;

// Define types for the component
interface Message {
  role: 'user' | 'assistant' | 'error' | 'system';
  content: string;
  timestamp: Date;
  error?: {
    code: string;
    message: string;
  };
}

export default function SimpleAIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Add a welcome message when the component mounts
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        role: 'system',
        content: `Welcome to HabibiStay AI Assistant. How can I help you today?`,
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [messages.length]);
  
  // Scroll to bottom of chat when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Simple mock responses based on user input
  const generateResponse = (message: string): string => {
    message = message.toLowerCase();
    
    // User greeting with name
    if (
      message.includes('hello') || 
      message.includes('hi') || 
      message.includes('hey')
    ) {
      const timeOfDay = getTimeOfDay();
      return `Good ${timeOfDay}! How can I help you with HabibiStay today?`;
    }
    
    if (message.includes('booking') || message.includes('reservation')) {
      return 'To make a booking, browse our properties and select "Book Now" on any property page. You can manage your bookings in your account dashboard.';
    }
    
    if (message.includes('payment') || message.includes('pay')) {
      return 'We accept all major credit cards and PayPal. Your payment information is securely processed and stored.';
    }
    
    if (message.includes('cancel') || message.includes('refund')) {
      return 'Cancellation policies vary by property. You can find the specific policy on each property page before booking. Refunds are processed according to these policies.';
    }
    
    if (message.includes('contact') || message.includes('help') || message.includes('support')) {
      return 'Our support team is available 24/7. You can reach us at support@habibistay.com or through the contact form on our website.';
    }
    
    if (message.includes('property') && message.includes('amenities')) {
      return 'Our properties offer a wide range of amenities. Common amenities include Wi-Fi, air conditioning, kitchen facilities, and parking. Premium properties may include pools, hot tubs, or gym access. You can filter properties by specific amenities using our search feature.';
    }
    
    if (message.includes('host')) {
      return 'To become a host on HabibiStay, you need to create an account, verify your identity, and list your property. As a host, you can set your own prices, availability, and house rules. Our platform handles the booking process and payments.';
    }
    
    return 'Thank you for your message. I\'m here to help with any questions about properties, bookings, or our services. Could you please provide more details about what you need assistance with?';
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading) return;
    
    // Add user message to the chat
    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      // Simulate API delay with some randomness to make it feel more natural
      const delay = 500 + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Simulate random error (1% chance) for testing error handling
      if (Math.random() < 0.01) {
        throw new Error('Simulated random error for demonstration purposes.');
      }
      
      // Generate mock response
      const responseText = generateResponse(userMessage.content);
      
      // Add assistant response to the chat
      const assistantMessage: Message = {
        role: 'assistant',
        content: responseText,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error generating response:', error);
      // Add error message to chat
      const errorMessage: Message = {
        role: 'error',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
        error: {
          code: 'SIMULATED_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to get time of day
  function getTimeOfDay(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  }

  return (
    <div className="flex flex-col h-[600px] border rounded-lg overflow-hidden">
      <div className="bg-gray-100 p-4 border-b">
        <h3 className="font-medium">AI Assistant</h3>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p>Ask me anything about properties, bookings, or how to use this platform!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg ${
                  message.role === 'user' 
                    ? 'bg-blue-100 ml-auto max-w-[80%]' 
                    : message.role === 'error'
                    ? 'bg-red-50 border border-red-200 mr-auto max-w-[80%]'
                    : message.role === 'system'
                    ? 'bg-gray-50 border border-gray-200 mr-auto max-w-[80%]'
                    : 'bg-gray-100 mr-auto max-w-[80%]'
                }`}
              >
                {message.role === 'error' && (
                  <div className="flex items-center text-red-600 mb-2">
                    <FaExclamationTriangle className="mr-2" />
                    <span className="font-medium">Error</span>
                  </div>
                )}
                
                {message.role === 'system' && (
                  <div className="text-gray-500 mb-1 text-xs uppercase font-medium">SYSTEM</div>
                )}
                
                <p>{message.content}</p>
                
                <p className="text-xs text-gray-500 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      <form onSubmit={handleSendMessage} className="border-t p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 p-2 border rounded-md"
            disabled={isLoading}
          />
          <button
            type="submit"
            className={`px-4 py-2 rounded-md flex items-center justify-center min-w-[100px] ${
              isLoading 
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2"></div>
                Sending...
              </>
            ) : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
}
