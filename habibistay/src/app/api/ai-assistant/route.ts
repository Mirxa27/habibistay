import { NextRequest, NextResponse } from 'next/server';
import { aiAssistantService } from '@/services/ai-assistant.service';
import prisma from '@/lib/prisma';

/**
 * Production AI Assistant API Route
 * Integrates with OpenAI for intelligent responses
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, conversationHistory, context } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    // Get user ID from session if available (optional for now)
    // In production, you would extract this from NextAuth session
    const userId = request.headers.get('x-user-id') || undefined;

    // Build context from request
    const requestContext: any = {};
    
    if (context) {
      requestContext.currentProperty = context.currentProperty;
      requestContext.userPreferences = context.userPreferences;
      requestContext.recentSearches = context.recentSearches;
    }

    // Generate AI response using the production service
    const result = await aiAssistantService.generateResponse({
      userMessage: message,
      conversationHistory: conversationHistory || [],
      userId,
      context: requestContext,
    });

    return NextResponse.json({
      response: result.response,
      propertyRecommendations: result.propertyRecommendations || [],
      suggestedActions: result.suggestedActions || [],
      success: true,
    });
  } catch (error) {
    console.error('AI Assistant API error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to generate response',
        message: error instanceof Error ? error.message : 'Unknown error',
        success: false,
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for FAQ responses
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const question = searchParams.get('question');

    if (!question) {
      return NextResponse.json(
        { error: 'Question parameter is required' },
        { status: 400 }
      );
    }

    const answer = await aiAssistantService.answerFAQ(question);

    return NextResponse.json({
      question,
      answer,
      success: true,
    });
  } catch (error) {
    console.error('FAQ API error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to answer question',
        message: error instanceof Error ? error.message : 'Unknown error',
        success: false,
      },
      { status: 500 }
    );
  }
}
