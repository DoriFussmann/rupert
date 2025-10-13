import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/app/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-realtime-preview-2024-12-17',
        voice: 'sage',
        instructions: `Authenticated user ${String(payload.userId)}`,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to create session', details: data }, { status: response.status });
    }

    return NextResponse.json({ client_secret: data.client_secret });
  } catch (error) {
    console.error('ChatKit session error:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}

