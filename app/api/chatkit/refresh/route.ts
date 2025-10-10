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
    const session = await openai.chatkit.refreshSession({
      client_secret: currentClientSecret,
    });

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

