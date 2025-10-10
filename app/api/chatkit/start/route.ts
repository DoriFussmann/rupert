import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { verifyJWT } from '@/app/lib/auth';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    // Extract userId from auth cookie if present (optional, don't block anonymous)
    let userId: string | undefined;
    try {
      const token = request.cookies.get('auth-token')?.value;
      if (token) {
        const payload = await verifyJWT(token);
        userId = payload.userId as string;
      }
    } catch (authError) {
      // Auth failed, continue as anonymous
      console.log('ChatKit start: No valid auth, continuing as anonymous');
    }

    // Get workflow ID from env
    const workflowId = process.env.WORKFLOW_ID;
    if (!workflowId) {
      console.warn('WORKFLOW_ID not configured - ChatKit disabled');
      return NextResponse.json(
        { error: 'ChatKit not configured. Add WORKFLOW_ID environment variable.' },
        { status: 503 }
      );
    }

    // Create ChatKit session with OpenAI
    // TODO: Change version from "draft" to "production" when ready
    // Note: chatkit API may not be available in all SDK versions
    const session = await (openai as any).chatkit?.createSession({
      workflow_id: workflowId,
      version: 'draft', // Use "draft" for testing, change to workflow version number for production
      metadata: userId ? { userId } : undefined, // Pass userId for personalization if available
    });
    
    if (!session) {
      throw new Error('ChatKit API not available in current OpenAI SDK version');
    }

    // Return client secret (short-lived token for browser)
    return NextResponse.json({
      client_secret: session.client_secret,
    });
  } catch (error) {
    console.error('ChatKit start session error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to start ChatKit session',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

