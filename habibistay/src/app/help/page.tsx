'use client';

import dynamic from 'next/dynamic';
import MainLayout from '../../../src/components/layout/MainLayout';

// Import the simple fallback component
import SimpleAIChat from '@/components/AIAssistant/SimpleAIChat';

// Dynamically import the ButtonDrivenChat component with a fallback
const ButtonDrivenChat = dynamic(
  () => import('@/components/AIAssistant/ButtonDrivenChat').catch(() => {
    console.warn('Failed to load ButtonDrivenChat, using SimpleAIChat as fallback');
    return import('@/components/AIAssistant/SimpleAIChat');
  }),
  { ssr: false, loading: () => <ChatLoadingState /> }
);

// Loading state component
function ChatLoadingState() {
  return (
    <div className="border rounded-lg p-6 h-[600px] bg-gray-50 flex flex-col items-center justify-center space-y-4">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-center text-gray-600">Loading Sara, your AI Assistant...</p>
      <p className="text-center text-sm text-gray-500">Sara will help you discover properties and make bookings with voice commands or button clicks.</p>
    </div>
  );
}

export default function HelpPage() {
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Help & Support</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Frequently Asked Questions</h2>
              
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">How do I make a booking?</h3>
                  <p className="text-gray-600">
                    Browse our properties, select the dates you want to stay, and click "Book Now" to complete your reservation. You can also use Sara, our AI assistant, to help you make a booking.
                  </p>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">What is the cancellation policy?</h3>
                  <p className="text-gray-600">
                    Cancellation policies vary by property. You can find the specific policy on each property listing before booking.
                  </p>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">How do I contact a property host?</h3>
                  <p className="text-gray-600">
                    Once you have a confirmed booking, you can message the host directly through your booking details page.
                  </p>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">Are there any hidden fees?</h3>
                  <p className="text-gray-600">
                    All fees are clearly displayed during the booking process. There are no hidden charges.
                  </p>
                </div>
              </div>
              
              <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">Contact Support</h2>
                <p className="mb-4">
                  Need more help? Our support team is available 24/7.
                </p>
                <div className="flex flex-col space-y-2">
                  <a 
                    href="mailto:support@habibistay.com" 
                    className="inline-flex items-center text-blue-600 hover:text-blue-800"
                  >
                    <span className="mr-2">✉️</span> support@habibistay.com
                  </a>
                  <p className="inline-flex items-center">
                    <span className="mr-2">📞</span> +1 (555) 123-4567
                  </p>
                </div>
              </div>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold mb-4">Meet Sara, Your AI Booking Assistant</h2>
              <p className="mb-4 text-gray-600">
                Get instant help with property discovery, booking, and support using buttons or voice commands. Sara can help you:
              </p>
              <ul className="list-disc list-inside mb-4 text-gray-600 space-y-1">
                <li>Find properties that match your preferences</li>
                <li>Check availability and make bookings</li>
                <li>Answer questions about our services</li>
                <li>Provide help with existing reservations</li>
              </ul>
              
              {/* Enhanced ButtonDrivenChat component */}
              <div className="h-[600px]">
                <ButtonDrivenChat />
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
