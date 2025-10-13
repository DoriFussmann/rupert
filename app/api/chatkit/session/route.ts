import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    const workflowId = process.env.WORKFLOW_ID;

    if (!openaiApiKey) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY not configured' },
        { status: 500 }
      );
    }

    if (!workflowId) {
      return NextResponse.json(
        { error: 'WORKFLOW_ID not configured' },
        { status: 500 }
      );
    }

    // Call OpenAI ChatKit Sessions API directly (not in SDK yet)
    const response = await fetch('https://api.openai.com/v1/chatkit/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workflow: workflowId,
        version: '6', // From your Agent Builder screenshot
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI ChatKit API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to create ChatKit session', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    return NextResponse.json({
      client_secret: data.client_secret,
    });

  } catch (error) {
    console.error('ChatKit session creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

