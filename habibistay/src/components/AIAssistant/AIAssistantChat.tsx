'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession, SessionProvider } from 'next-auth/react';

// Placeholder icon components since we're having issues with react-icons
const IconComponent = ({ className, children }: { className?: string, children: React.ReactNode }) => (
  <span className={`inline-block ${className || ''}`} style={{ width: '1em', height: '1em' }}>{children}</span>
);

const FaExclamationTriangle = ({ className }: { className?: string }) => <IconComponent className={className}>⚠️</IconComponent>;
const FaRedoAlt = ({ className }: { className?: string }) => <IconComponent className={className}>🔄</IconComponent>;

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

interface APIResponse {
  message: string;
  conversationId: string;
  error?: string;
}

interface AIAssistantChatProps {
  initialConversationId?: string;
  maxRetries?: number;
}

// Inner component that uses useSession
function AIAssistantChatInner({ initialConversationId, maxRetries = 2 }: AIAssistantChatProps) {
  const { data: session, status } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(initialConversationId);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [lastUserMessage, setLastUserMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Add a welcome message when the component mounts
  useEffect(() => {
    if (session && messages.length === 0) {
      const welcomeMessage: Message = {
        role: 'system',
        content: `Welcome to HabibiStay AI Assistant. How can I help you today?`,
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [session, messages.length]);
  
  // Scroll to bottom of chat when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Add an additional check to handle potential session issues
  useEffect(() => {
    if (status === 'loading') {
      console.log('Session is loading...');
    } else if (status === 'unauthenticated') {
      console.log('User is not authenticated');
    } else if (status === 'authenticated') {
      console.log('User is authenticated:', session?.user?.email);
    }
  }, [status, session]);
  
  // Handle retries for failed API calls
  useEffect(() => {
    if (retryCount > 0 && retryCount <= maxRetries && lastUserMessage) {
      console.log(`Retrying API call... Attempt ${retryCount} of ${maxRetries}`);
      sendMessageToAPI(lastUserMessage);
    }
  }, [retryCount, maxRetries, lastUserMessage]);
  
  // This is a separate component that is guaranteed to be inside SessionProvider
  
  // Function to categorize and handle API errors
  const handleAPIError = (error: any): Message => {
    let errorCode = 'UNKNOWN_ERROR';
    let errorMessage = 'An unexpected error occurred. Please try again.';
    
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      errorCode = 'NETWORK_ERROR';
      errorMessage = 'Unable to connect to the server. Please check your internet connection.';
      setNetworkError(errorMessage);
    } else if (error instanceof Error) {
      if (error.message.includes('401')) {
        errorCode = 'UNAUTHORIZED';
        errorMessage = 'Your session has expired. Please sign in again.';
      } else if (error.message.includes('403')) {
        errorCode = 'FORBIDDEN';
        errorMessage = 'You do not have permission to access this resource.';
      } else if (error.message.includes('429')) {
        errorCode = 'RATE_LIMIT';
        errorMessage = 'You have exceeded the rate limit. Please try again later.';
      } else if (error.message.includes('500')) {
        errorCode = 'SERVER_ERROR';
        errorMessage = 'The server encountered an error. Please try again later.';
      } else {
        errorMessage = error.message;
      }
    }
    
    return {
      role: 'error',
      content: errorMessage,
      timestamp: new Date(),
      error: {
        code: errorCode,
        message: errorMessage
      }
    };
  };
  
  // Function to send message to API
  const sendMessageToAPI = async (messageContent: string) => {
    setIsLoading(true);
    setNetworkError(null);
    
    try {
      // Call your API to get assistant response
      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageContent,
          conversationId,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Request failed with status ${response.status}`
        );
      }
      
      const data: APIResponse = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Add assistant response to the chat
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
      
      // Update conversation ID if this is a new conversation
      if (!conversationId && data.conversationId) {
        setConversationId(data.conversationId);
      }
      
      // Reset retry count on success
      setRetryCount(0);
      setLastUserMessage(null);
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      // If we haven't exceeded max retries, increment retry count
      if (retryCount < maxRetries) {
        setRetryCount(prev => prev + 1);
      } else {
        // If we've exceeded max retries, show error message
        const errorMessage = handleAPIError(error);
        setMessages((prev) => [...prev, errorMessage]);
        setRetryCount(0);
        setLastUserMessage(null);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle form submission
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading || !session) return;
    
    // Add user message to the chat
    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setLastUserMessage(input);
    setInput('');
    
    // Send message to API
    await sendMessageToAPI(input);
  };
  
  // Retry last failed request
  const handleRetry = () => {
    if (lastUserMessage) {
      setNetworkError(null);
      setRetryCount(1); // Trigger retry effect
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex flex-col h-[600px] border rounded-lg overflow-hidden">
        <div className="bg-gray-100 p-4 border-b">
          <h3 className="font-medium">AI Assistant</h3>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-center">
            <div className="h-8 w-8 mx-auto rounded-full bg-blue-200 mb-4"></div>
            <p className="text-gray-500">Loading assistant...</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (status === 'unauthenticated' || !session) {
    return (
      <div className="flex flex-col h-[600px] border rounded-lg overflow-hidden">
        <div className="bg-gray-100 p-4 border-b">
          <h3 className="font-medium">AI Assistant</h3>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center bg-yellow-50 p-6 rounded-lg border border-yellow-200 max-w-md">
            <FaExclamationTriangle className="text-yellow-500 text-3xl mx-auto mb-4" />
            <h4 className="text-lg font-medium mb-2">Authentication Required</h4>
            <p className="text-gray-600 mb-4">
              Please sign in to use the AI assistant. Our assistant can help you with bookings, 
              finding properties, and answering questions about HabibiStay.
            </p>
            <a 
              href="/login?callbackUrl=/help" 
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Sign In
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[600px] border rounded-lg overflow-hidden">
      <div className="bg-gray-100 p-4 border-b flex justify-between items-center">
        <h3 className="font-medium">AI Assistant</h3>
        {networkError && (
          <div className="text-xs text-red-600 flex items-center">
            <FaExclamationTriangle className="mr-1" />
            Connection Error
          </div>
        )}
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
                
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-gray-500">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                  
                  {message.role === 'error' && lastUserMessage && (
                    <button
                      onClick={handleRetry}
                      className="text-xs text-blue-600 flex items-center"
                    >
                      <FaRedoAlt className="mr-1" />
                      Retry
                    </button>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      {networkError && (
        <div className="bg-red-50 border-t border-red-200 p-2 text-center text-sm text-red-600">
          <p className="flex items-center justify-center">
            <FaExclamationTriangle className="mr-2" />
            {networkError}
            <button 
              onClick={handleRetry} 
              className="ml-2 underline"
              disabled={!lastUserMessage || isLoading}
            >
              Retry
            </button>
          </p>
        </div>
      )}
      
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

// Main component that wraps the inner component with SessionProvider
export default function AIAssistantChat(props: AIAssistantChatProps) {
  // Add our own SessionProvider wrapper to ensure the component always has access to session
  return (
    <SessionProvider>
      <AIAssistantChatInner {...props} />
    </SessionProvider>
  );
}
