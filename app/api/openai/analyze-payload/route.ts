import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    message: 'OpenAI analyze-payload API is working',
    timestamp: new Date().toISOString()
  });
}

export async function POST(request: NextRequest) {
  try {
    console.log('API Route: Received request');
    const { payload } = await request.json();
    console.log('API Route: Payload received:', payload ? 'Yes' : 'No', payload?.length || 0, 'characters');
    
    if (!payload) {
      console.log('API Route: No payload provided');
      return NextResponse.json({ error: 'Payload is required' }, { status: 400 });
    }

    const requestBody = {
      model: 'gpt-4',
      messages: [
        {
          role: 'user',
          content: payload
        }
      ],
      max_tokens: 1000,
      temperature: 0.7,
    };

    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.error('API Route: OpenAI API key not found');
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }
    
    console.log('API Route: OpenAI API key found, length:', process.env.OPENAI_API_KEY.length);

    // Log outbound request
    console.log(`OpenAI Request: model=${requestBody.model}, messages=${JSON.stringify(requestBody.messages)}`);

    // OpenAI API call
    let openaiResponse;
    try {
      console.log('API Route: Making request to OpenAI...');
      openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      console.log('API Route: OpenAI response status:', openaiResponse.status);
    } catch (fetchError) {
      console.error('API Route: Fetch error:', fetchError);
      throw new Error(`Network error calling OpenAI: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`);
    }

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error(`OpenAI API error: ${openaiResponse.status} - ${errorText}`);
      throw new Error(`OpenAI API error: ${openaiResponse.status} - ${errorText}`);
    }

    let openaiData;
    try {
      openaiData = await openaiResponse.json();
      console.log('OpenAI API response received:', openaiData);
    } catch (parseError) {
      console.error('API Route: JSON parse error:', parseError);
      throw new Error(`Failed to parse OpenAI response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
    }
    
    // Log raw response (first 300 chars)
    const responseContent = openaiData.choices?.[0]?.message?.content || '';
    console.log(`OpenAI Response: ${responseContent.substring(0, 300)}${responseContent.length > 300 ? '...' : ''}`);

    if (!responseContent) {
      console.error('No content in OpenAI response:', openaiData);
      throw new Error('No content received from OpenAI');
    }

    // Return raw assistant content verbatim
    return NextResponse.json({
      analysis: responseContent,
      success: true
    });

  } catch (error) {
    console.error('Error in analyze-payload API:', error);
    return NextResponse.json(
      { error: 'Failed to analyze payload', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
