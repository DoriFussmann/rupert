import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const { currentClientSecret } = await request.json();

    if (!currentClientSecret) {
      return NextResponse.json(
        { error: 'currentClientSecret is required' },
        { status: 400 }
      );
    }

    // Refresh using the current client secret. If your installed OpenAI SDK
    // uses a different method name, align here accordingly.
    // Note: chatkit API may not be available in all SDK versions
    const session = await (openai as any).chatkit?.refreshSession({
      client_secret: currentClientSecret,
    });
    
    if (!session) {
      throw new Error('ChatKit API not available in current OpenAI SDK version');
    }

    return NextResponse.json({ client_secret: session.client_secret });
  } catch (error) {
    console.error('ChatKit refresh session error:', error);
    return NextResponse.json(
      {
        error: 'Failed to refresh ChatKit session',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

