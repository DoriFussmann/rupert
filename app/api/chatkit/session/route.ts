import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    const workflowId = process.env.WORKFLOW_ID;

    console.log('Creating ChatKit session...');
    console.log('Workflow ID:', workflowId);

    if (!openaiApiKey) {
      console.error('OPENAI_API_KEY not configured');
      return NextResponse.json(
        { error: 'OPENAI_API_KEY not configured' },
        { status: 500 }
      );
    }

    if (!workflowId) {
      console.error('WORKFLOW_ID not configured');
      return NextResponse.json(
        { error: 'WORKFLOW_ID not configured' },
        { status: 500 }
      );
    }

    // Call OpenAI ChatKit Sessions API
    const apiUrl = 'https://api.openai.com/v1/chatkit/sessions';
    const requestBody = {
      workflow: workflowId,
    };

    console.log('Request URL:', apiUrl);
    console.log('Request body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();
    console.log('OpenAI response status:', response.status);
    console.log('OpenAI response body:', responseText);

    if (!response.ok) {
      console.error('OpenAI ChatKit API error:', responseText);
      return NextResponse.json(
        { 
          error: 'Failed to create ChatKit session', 
          status: response.status,
          details: responseText 
        },
        { status: response.status }
      );
    }

    const data = JSON.parse(responseText);
    
    return NextResponse.json({
      client_secret: data.client_secret,
    });

  } catch (error) {
    console.error('ChatKit session creation error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
