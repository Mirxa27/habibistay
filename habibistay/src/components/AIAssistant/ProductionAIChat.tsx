'use client';

import { useState, useEffect, useRef } from 'react';

// Placeholder icon components
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
  propertyRecommendations?: any[];
  suggestedActions?: string[];
}

export default function ProductionAIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Add a welcome message when the component mounts
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        role: 'system',
        content: `👋 Welcome to HabibiStay! I'm Sara, your AI travel assistant. I can help you:

• Find the perfect vacation rental
• Answer questions about properties and bookings
• Provide local travel tips for Saudi Arabia and GCC
• Assist with booking inquiries

How can I help you today?`,
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [messages.length]);
  
  // Scroll to bottom of chat when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message to AI assistant API
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      // Call the AI assistant API
      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          conversationHistory: messages
            .filter(m => m.role === 'user' || m.role === 'assistant')
            .slice(-10) // Keep last 10 messages for context
            .map(m => ({ role: m.role, content: m.content })),
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response || 'I apologize, but I couldn\'t generate a response.',
        timestamp: new Date(),
        propertyRecommendations: data.propertyRecommendations || [],
        suggestedActions: data.suggestedActions || [],
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: Message = {
        role: 'error',
        content: 'I apologize, but I\'m having trouble connecting right now. Please try again in a moment.',
        timestamp: new Date(),
        error: {
          code: 'CONNECTION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  
  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Chat header */}
      <div className="bg-gradient-to-r from-[#2957c3] to-[#1e40af] text-white p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl">
          🤖
        </div>
        <div>
          <h3 className="font-semibold text-lg">Sara - AI Assistant</h3>
          <p className="text-xs text-white/80">Your HabibiStay travel companion</p>
        </div>
      </div>
      
      {/* Messages container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-[#2957c3] text-white'
                  : message.role === 'error'
                  ? 'bg-red-100 text-red-800 border border-red-300'
                  : 'bg-white text-gray-800 shadow-sm border border-gray-200'
              }`}
            >
              {message.role === 'error' && (
                <div className="flex items-center gap-2 mb-2 text-red-600">
                  <FaExclamationTriangle className="text-sm" />
                  <span className="text-xs font-semibold">Error</span>
                </div>
              )}
              
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
              
              {/* Property recommendations */}
              {message.propertyRecommendations && message.propertyRecommendations.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-semibold text-gray-600">Recommended Properties:</p>
                  {message.propertyRecommendations.slice(0, 3).map((property: any) => (
                    <div key={property.id} className="bg-gray-50 p-2 rounded border border-gray-200">
                      <p className="font-semibold text-sm">{property.title}</p>
                      <p className="text-xs text-gray-600">{property.city}, {property.country}</p>
                      <p className="text-xs text-[#2957c3] font-semibold mt-1">
                        ${Number(property.price).toFixed(2)}/night
                      </p>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Suggested actions */}
              {message.suggestedActions && message.suggestedActions.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {message.suggestedActions.map((action: string, idx: number) => (
                    <button
                      key={idx}
                      className="text-xs px-3 py-1 bg-[#2957c3]/10 text-[#2957c3] rounded-full hover:bg-[#2957c3]/20 transition-colors"
                      onClick={() => setInput(action)}
                    >
                      {action}
                    </button>
                  ))}
                </div>
              )}
              
              <p className="text-xs mt-2 opacity-60">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-800 rounded-lg p-3 shadow-sm border border-gray-200">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
                <span className="text-sm text-gray-600">Sara is thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input area */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about HabibiStay..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2957c3] focus:border-transparent text-sm"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="px-6 py-2 bg-[#2957c3] text-white rounded-lg hover:bg-[#1e40af] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium text-sm"
          >
            {isLoading ? '...' : 'Send'}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          Sara is powered by AI and may occasionally make mistakes. Please verify important information.
        </p>
      </div>
    </div>
  );
}
