import { NextRequest, NextResponse } from 'next/server';


export async function POST(request: NextRequest) {
  try {
    console.log('Chat API: Received request');
    
    const { userMessage } = await request.json();
    console.log('Chat API: User message received:', userMessage ? 'Yes' : 'No');
    
    if (!userMessage) {
      return NextResponse.json({ error: 'User message is required' }, { status: 400 });
    }

    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.error('Chat API: OpenAI API key not found');
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    // For now, return a mock response until OpenAI integration is working
    const mockResponses = [
      "I'd be happy to help you with your financial planning. Could you tell me more about your current financial situation?",
      "That's a great question about budgeting. Let me provide some guidance on creating an effective budget.",
      "I can help you analyze your financial goals. What specific areas would you like to focus on?",
      "Based on your question, I recommend starting with a detailed assessment of your income and expenses.",
      "I'm here to help with your financial planning needs. What would you like to discuss first?"
    ];
    
    const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];
    
    return NextResponse.json({
      response: randomResponse,
      success: true
    });

  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
