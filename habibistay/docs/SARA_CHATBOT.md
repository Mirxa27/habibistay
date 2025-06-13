# Sara AI Chatbot - Button/Voice-Driven Interface

Sara is an AI-powered chatbot designed to assist users with property discovery, booking management, and customer support through a button and voice-driven interface that minimizes text input.

## Features

- **Button-Driven Interface**: Quick responses via pre-defined option buttons
- **Voice Recognition**: Hands-free interaction using Web Speech API
- **Featured Properties Display**: Shows admin-selected featured properties
- **Responsive Design**: Works on desktop and mobile devices
- **Authentication Integration**: Seamless user session handling
- **Graceful Degradation**: Falls back to text input when voice is unavailable
- **Rich Error Handling**: User-friendly error messages with recovery options

## Architecture

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│                 │      │                 │      │                 │
│  Button/Voice   │──────▶  AI Assistant   │──────▶  Property Data  │
│    Interface    │      │     API         │      │    Services     │
│                 │      │                 │      │                 │
└─────────────────┘      └─────────────────┘      └─────────────────┘
        │                        │                        │
        │                        │                        │
        ▼                        ▼                        ▼
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│                 │      │                 │      │                 │
│  Authentication │      │   NLP Pipeline  │      │ Payment System  │
│     System      │      │                 │      │                 │
│                 │      │                 │      │                 │
└─────────────────┘      └─────────────────┘      └─────────────────┘
```

## Components

1. **ButtonDrivenChat.tsx**
   - Main UI component implementing the button/voice interface
   - Handles voice recognition, message display, and user interactions
   - Displays featured properties at conversation start

2. **PropertyCard.tsx**
   - Displays property information in a card format
   - Shows images, price, location, amenities, and ratings
   - Supports compact mode for smaller displays

3. **Featured Properties API**
   - Endpoint to fetch admin-selected featured properties
   - Returns property details optimized for the chatbot interface

4. **Admin Featured Properties Tool**
   - UI component for admins to mark properties as featured
   - PATCH endpoint to update property featured status

5. **AIAssistantManager.ts**
   - Coordinates components of the AI system
   - Processes user messages and generates responses
   - Manages conversation context and intent recognition

## Technical Details

### User Flow

1. **Initial Welcome**:
   - Sara introduces herself and shows 2 featured properties
   - Presents buttons for property selection or general help

2. **Property Exploration**:
   - Users can select properties by clicking cards or buttons
   - Voice commands can request property details
   - System presents options for availability check or booking

3. **Booking Process**:
   - Step-by-step process with appropriate button options
   - Date selection, guest count, and payment options
   - Confirmation and receipt

4. **Authentication**:
   - Login/register prompts when needed
   - Seamless session handling
   - Account management options

### Voice Recognition

Voice recognition is implemented using the Web Speech API:

- Continuous recognition with interim results
- Error handling for various failure scenarios
- Automatic timeouts and silence detection
- Browser compatibility handling
- See [VOICE_RECOGNITION.md](./VOICE_RECOGNITION.md) for details

### Button Context Awareness

The system dynamically adjusts available buttons based on:

- Conversation context and history
- Detected user intent
- Current stage in booking flow
- Authentication state
- Property information

### Featured Properties System

Properties can be marked as featured by admin users:

1. Admin dashboard includes a toggle for featured status
2. Featured properties appear at the start of new conversations
3. The system updates featured status in real-time
4. Property cards show key information for decision-making

## API Endpoints

- `POST /api/ai-assistant`: Process messages and get responses
- `GET /api/ai-assistant/conversations`: List user conversations
- `GET /api/properties/featured`: Get featured properties for the chatbot
- `PATCH /api/admin/properties/featured`: Update property featured status

## Future Enhancements

1. **Multilingual Support**: Add language detection and translation
2. **Voice Profiles**: Allow users to train the system for better recognition
3. **Rich Media Responses**: Include videos, 3D tours, and interactive maps
4. **Booking Flow Integration**: Complete the booking process within the chat
5. **Analytics Dashboard**: Track chatbot usage and performance
6. **Mobile App Integration**: Use native speech recognition APIs

## Getting Started

To work with the Sara chatbot:

1. Ensure a modern browser with Web Speech API support (Chrome, Edge)
2. Login to the system as an admin to mark properties as featured
3. Visit the AI Assistant page to interact with Sara
4. Use voice commands or buttons to navigate the interface
5. Check the network tab for API calls to understand the data flow

## Code Examples

Key implementation patterns:

```tsx
// Voice recognition initialization
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
  const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  // ...
}

// Dynamic button generation based on context
const options = responseText.includes('booking') 
  ? [
      { id: 'select-dates', label: 'Select Dates', value: 'I want to select dates' },
      { id: 'guest-count', label: 'Guest Count', value: 'Let me specify number of guests' },
    ]
  : [
      { id: 'search', label: 'Search Properties', value: 'I want to search for properties' },
      { id: 'help', label: 'Help', value: 'I need help' },
    ];

// Fetching featured properties
const response = await fetch('/api/properties/featured?limit=4');
const featuredProperties = await response.json();
```
