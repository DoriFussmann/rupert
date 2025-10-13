import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/app/lib/auth';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

    const session = await openai.beta.chatkit.sessions.create({
      user: String(payload.userId),
      workflow: {
        id: process.env.WORKFLOW_ID!
      }
    });

    return NextResponse.json({ 
      client_secret: session.client_secret 
    });
    
  } catch (error) {
    console.error('ChatKit session error:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}

