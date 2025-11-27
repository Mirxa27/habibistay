import OpenAI from 'openai';
import prisma from '@/lib/prisma';

/**
 * Production-ready AI Assistant Service (Sara)
 * Integrates with OpenAI for intelligent property recommendations and customer support
 */
export class AIAssistantService {
  private openai: OpenAI;
  private model: string;
  private systemPrompt: string;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured in environment variables');
    }

    this.openai = new OpenAI({
      apiKey,
    });

    this.model = process.env.OPENAI_MODEL || 'gpt-4-turbo-preview';

    this.systemPrompt = `You are Sara, an intelligent AI assistant for HabibiStay, a premium vacation rental platform serving Saudi Arabia and the GCC region.

Your role is to:
1. Help users discover perfect vacation rentals based on their preferences
2. Answer questions about properties, bookings, and policies
3. Provide local travel tips and recommendations for Saudi Arabia and GCC countries
4. Assist with booking-related queries and concerns
5. Offer personalized property suggestions

Guidelines:
- Be warm, friendly, and professional
- Understand both English and Arabic contexts
- Prioritize user safety and satisfaction
- Provide accurate information about properties and policies
- When recommending properties, consider user preferences like location, budget, amenities, and group size
- Be culturally sensitive to Middle Eastern customs and preferences
- If you don't know something, admit it and offer to connect the user with support

Always format property recommendations clearly with key details like location, price, and standout features.`;
  }

  /**
   * Generate AI response for user query
   */
  async generateResponse(params: {
    userMessage: string;
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
    userId?: string;
    context?: {
      currentProperty?: any;
      userPreferences?: any;
      recentSearches?: any[];
    };
  }): Promise<{
    response: string;
    propertyRecommendations?: any[];
    suggestedActions?: string[];
  }> {
    try {
      // Build conversation messages
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: 'system', content: this.systemPrompt },
      ];

      // Add conversation history
      if (params.conversationHistory && params.conversationHistory.length > 0) {
        params.conversationHistory.forEach(msg => {
          messages.push({
            role: msg.role,
            content: msg.content,
          });
        });
      }

      // Add context if available
      let contextMessage = '';
      if (params.context) {
        if (params.context.currentProperty) {
          contextMessage += `\n\nUser is currently viewing: ${params.context.currentProperty.title} in ${params.context.currentProperty.city}`;
        }
        if (params.context.userPreferences) {
          contextMessage += `\n\nUser preferences: ${JSON.stringify(params.context.userPreferences)}`;
        }
        if (params.context.recentSearches && params.context.recentSearches.length > 0) {
          contextMessage += `\n\nRecent searches: ${params.context.recentSearches.map(s => s.query).join(', ')}`;
        }
      }

      // Add user message with context
      messages.push({
        role: 'user',
        content: params.userMessage + contextMessage,
      });

      // Generate AI response
      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages,
        temperature: 0.7,
        max_tokens: 1000,
        presence_penalty: 0.6,
        frequency_penalty: 0.3,
      });

      const aiResponse = completion.choices[0]?.message?.content || 'I apologize, but I couldn\'t generate a response. Please try again.';

      // Extract property recommendations if the query is about finding properties
      let propertyRecommendations: any[] = [];
      if (this.isPropertySearchQuery(params.userMessage)) {
        propertyRecommendations = await this.findRelevantProperties(params.userMessage, params.userId);
      }

      // Generate suggested actions
      const suggestedActions = this.generateSuggestedActions(params.userMessage, aiResponse);

      return {
        response: aiResponse,
        propertyRecommendations,
        suggestedActions,
      };
    } catch (error) {
      console.error('AI response generation failed:', error);
      
      // Fallback response
      return {
        response: 'I apologize, but I\'m having trouble processing your request right now. Please try again in a moment, or contact our support team for immediate assistance.',
        propertyRecommendations: [],
        suggestedActions: ['Contact Support', 'Try Again'],
      };
    }
  }

  /**
   * Generate property recommendations based on user preferences
   */
  async generatePropertyRecommendations(params: {
    userId?: string;
    preferences: {
      location?: string;
      priceRange?: { min: number; max: number };
      bedrooms?: number;
      guests?: number;
      amenities?: string[];
      propertyType?: string;
    };
    limit?: number;
  }): Promise<any[]> {
    try {
      // Build query based on preferences
      const where: any = {
        isPublished: true,
      };

      if (params.preferences.location) {
        where.OR = [
          { city: { contains: params.preferences.location, mode: 'insensitive' } },
          { country: { contains: params.preferences.location, mode: 'insensitive' } },
          { address: { contains: params.preferences.location, mode: 'insensitive' } },
        ];
      }

      if (params.preferences.priceRange) {
        where.price = {
          gte: params.preferences.priceRange.min,
          lte: params.preferences.priceRange.max,
        };
      }

      if (params.preferences.bedrooms) {
        where.bedrooms = { gte: params.preferences.bedrooms };
      }

      if (params.preferences.guests) {
        where.maxGuests = { gte: params.preferences.guests };
      }

      if (params.preferences.propertyType) {
        where.type = { equals: params.preferences.propertyType, mode: 'insensitive' };
      }

      if (params.preferences.amenities && params.preferences.amenities.length > 0) {
        where.amenities = {
          hasEvery: params.preferences.amenities,
        };
      }

      // Fetch properties
      const properties = await prisma.property.findMany({
        where,
        include: {
          images: {
            where: { isPrimary: true },
            take: 1,
          },
          reviews: {
            select: {
              rating: true,
            },
          },
        },
        take: params.limit || 10,
        orderBy: [
          { isFeatured: 'desc' },
          { createdAt: 'desc' },
        ],
      });

      // Calculate average ratings
      const propertiesWithRatings = properties.map(property => {
        const avgRating = property.reviews.length > 0
          ? property.reviews.reduce((sum, review) => sum + review.rating, 0) / property.reviews.length
          : 0;

        return {
          ...property,
          averageRating: avgRating,
          reviewCount: property.reviews.length,
        };
      });

      return propertiesWithRatings;
    } catch (error) {
      console.error('Failed to generate property recommendations:', error);
      return [];
    }
  }

  /**
   * Answer frequently asked questions
   */
  async answerFAQ(question: string): Promise<string> {
    try {
      const faqPrompt = `${this.systemPrompt}

Answer the following frequently asked question about HabibiStay clearly and concisely:

Question: ${question}`;

      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: faqPrompt },
        ],
        temperature: 0.5,
        max_tokens: 500,
      });

      return completion.choices[0]?.message?.content || 'I couldn\'t find an answer to that question. Please contact our support team.';
    } catch (error) {
      console.error('FAQ answer generation failed:', error);
      return 'I apologize, but I couldn\'t answer that question right now. Please contact our support team for assistance.';
    }
  }

  /**
   * Generate local travel tips
   */
  async generateTravelTips(params: {
    destination: string;
    interests?: string[];
  }): Promise<string> {
    try {
      const tipsPrompt = `${this.systemPrompt}

Provide helpful travel tips for ${params.destination} in Saudi Arabia or the GCC region.
${params.interests ? `Focus on these interests: ${params.interests.join(', ')}` : ''}

Include information about:
- Best time to visit
- Local customs and etiquette
- Must-see attractions
- Local cuisine recommendations
- Transportation tips
- Safety considerations

Keep it concise and practical.`;

      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: tipsPrompt },
        ],
        temperature: 0.7,
        max_tokens: 800,
      });

      return completion.choices[0]?.message?.content || 'I couldn\'t generate travel tips at this time. Please try again later.';
    } catch (error) {
      console.error('Travel tips generation failed:', error);
      return 'I apologize, but I couldn\'t generate travel tips right now. Please try again later.';
    }
  }

  /**
   * Analyze user intent from message
   */
  private isPropertySearchQuery(message: string): boolean {
    const searchKeywords = [
      'find', 'looking for', 'search', 'show me', 'recommend', 'suggest',
      'property', 'properties', 'rental', 'rentals', 'accommodation',
      'stay', 'place', 'apartment', 'house', 'villa', 'room',
      'bedroom', 'guest', 'price', 'budget', 'location', 'city',
    ];

    const lowerMessage = message.toLowerCase();
    return searchKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  /**
   * Find relevant properties based on natural language query
   */
  private async findRelevantProperties(query: string, userId?: string): Promise<any[]> {
    try {
      // Use AI to extract search parameters from natural language
      const extractionPrompt = `Extract search parameters from this property search query and return them as JSON:

Query: "${query}"

Return JSON with these fields (use null if not mentioned):
{
  "location": "city or country",
  "minPrice": number or null,
  "maxPrice": number or null,
  "bedrooms": number or null,
  "guests": number or null,
  "propertyType": "apartment/house/villa/room" or null,
  "amenities": ["pool", "wifi", etc] or []
}`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a search parameter extractor. Return only valid JSON.' },
          { role: 'user', content: extractionPrompt },
        ],
        temperature: 0.3,
        max_tokens: 200,
      });

      const responseText = completion.choices[0]?.message?.content || '{}';
      const params = JSON.parse(responseText);

      // Convert to preferences format
      const preferences: any = {};

      if (params.location) preferences.location = params.location;
      if (params.minPrice || params.maxPrice) {
        preferences.priceRange = {
          min: params.minPrice || 0,
          max: params.maxPrice || 999999,
        };
      }
      if (params.bedrooms) preferences.bedrooms = params.bedrooms;
      if (params.guests) preferences.guests = params.guests;
      if (params.propertyType) preferences.propertyType = params.propertyType;
      if (params.amenities && params.amenities.length > 0) preferences.amenities = params.amenities;

      return await this.generatePropertyRecommendations({
        userId,
        preferences,
        limit: 5,
      });
    } catch (error) {
      console.error('Failed to find relevant properties:', error);
      return [];
    }
  }

  /**
   * Generate suggested actions based on conversation
   */
  private generateSuggestedActions(userMessage: string, aiResponse: string): string[] {
    const actions: string[] = [];
    const lowerMessage = userMessage.toLowerCase();
    const lowerResponse = aiResponse.toLowerCase();

    if (lowerMessage.includes('book') || lowerResponse.includes('book')) {
      actions.push('View Available Dates');
    }

    if (lowerMessage.includes('price') || lowerMessage.includes('cost')) {
      actions.push('Calculate Total Cost');
    }

    if (lowerMessage.includes('location') || lowerMessage.includes('where')) {
      actions.push('View on Map');
    }

    if (lowerMessage.includes('review') || lowerMessage.includes('rating')) {
      actions.push('Read Reviews');
    }

    if (lowerMessage.includes('amenities') || lowerMessage.includes('facilities')) {
      actions.push('View All Amenities');
    }

    // Default actions
    if (actions.length === 0) {
      actions.push('Browse Properties', 'Contact Support');
    }

    return actions.slice(0, 3); // Limit to 3 actions
  }

  /**
   * Generate streaming response for real-time chat
   */
  async generateStreamingResponse(params: {
    userMessage: string;
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
    onChunk: (chunk: string) => void;
  }): Promise<void> {
    try {
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: 'system', content: this.systemPrompt },
      ];

      if (params.conversationHistory) {
        params.conversationHistory.forEach(msg => {
          messages.push({
            role: msg.role,
            content: msg.content,
          });
        });
      }

      messages.push({
        role: 'user',
        content: params.userMessage,
      });

      const stream = await this.openai.chat.completions.create({
        model: this.model,
        messages,
        temperature: 0.7,
        max_tokens: 1000,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          params.onChunk(content);
        }
      }
    } catch (error) {
      console.error('Streaming response generation failed:', error);
      params.onChunk('I apologize, but I encountered an error. Please try again.');
    }
  }
}

// Export singleton instance
export const aiAssistantService = new AIAssistantService();
export default aiAssistantService;
