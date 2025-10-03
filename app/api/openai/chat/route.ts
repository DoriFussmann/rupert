import { NextRequest, NextResponse } from 'next/server';


export async function POST(request: NextRequest) {
  try {
    console.log('Chat API: Received request');
    
    const body = await request.json();
    console.log('Chat API: Request body keys:', Object.keys(body));
    
    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.error('Chat API: OpenAI API key not found');
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    // Check if this is a direct OpenAI payload (from Model Builder)
    if (body.messages && Array.isArray(body.messages)) {
      console.log('Chat API: Direct OpenAI payload detected');
      
      const model = body.model || 'gpt-4';
      const isO1Model = model.includes('o1') || model.includes('gpt-5');
      
      // Build the OpenAI request from the payload
      const openaiRequest: any = {
        model: model,
        messages: body.messages,
      };

      // O1 models (gpt-5) require max_completion_tokens instead of max_tokens
      const maxTokensValue = body.max_tokens || body.maxTokens || 2000;
      if (isO1Model) {
        openaiRequest.max_completion_tokens = maxTokensValue;
        // O1 models don't support temperature, top_p, or response_format
        console.log('Chat API: Using O1 model settings');
      } else {
        openaiRequest.max_tokens = maxTokensValue;
        openaiRequest.temperature = body.temperature !== undefined ? body.temperature : 0.7;
        if (body.top_p !== undefined) openaiRequest.top_p = body.top_p;
        if (body.response_format) openaiRequest.response_format = body.response_format;
      }

      // Add optional parameters if present
      if (body.store !== undefined) openaiRequest.store = body.store;

      console.log('Chat API: Making OpenAI request with model:', openaiRequest.model);

      // Make actual API call to OpenAI
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(openaiRequest)
      });

      if (!openaiResponse.ok) {
        const errorData = await openaiResponse.json().catch(() => ({}));
        console.error('OpenAI API error:', {
          status: openaiResponse.status,
          statusText: openaiResponse.statusText,
          errorData,
          requestBody: openaiRequest
        });
        return NextResponse.json(
          { 
            error: 'OpenAI API error', 
            details: errorData.error?.message || 'Unknown error',
            status: openaiResponse.status,
            requestBody: openaiRequest
          },
          { status: openaiResponse.status }
        );
      }

      const openaiData = await openaiResponse.json();
      const response = openaiData.choices?.[0]?.message?.content || 'No response received';
      
      console.log('Chat API: OpenAI response received, length:', response.length);
      
      return NextResponse.json({
        response: response,
        success: true,
        fullResponse: openaiData
      });
    }

    // Legacy handling for chat interface with userMessage
    const { userMessage, chatHistory = [] } = body;
    console.log('Chat API: User message received:', userMessage ? 'Yes' : 'No');
    
    if (!userMessage) {
      return NextResponse.json({ error: 'User message or messages array is required' }, { status: 400 });
    }

    // Parse the task content to extract model and parameters
    let model = 'gpt-4'; // default fallback
    let temperature = 0.7;
    let maxTokens = 2000;
    let messages = [];

    try {
      // Check if the userMessage contains a curl command or JSON payload
      if (userMessage.includes('curl') && userMessage.includes('api.openai.com')) {
        // Extract JSON from curl command - handle both single and double quotes
        const jsonMatch = userMessage.match(/-d\s+['"`]([^'"`]+)['"`]/);
        if (jsonMatch) {
          const payload = JSON.parse(jsonMatch[1]);
          model = payload.model || 'gpt-4';
          temperature = payload.temperature || 0.7;
          maxTokens = payload.max_tokens || 2000;
          
          // Use the messages from the payload if they exist and are valid
          if (payload.messages && Array.isArray(payload.messages) && payload.messages.length > 0) {
            messages = payload.messages;
          } else {
            messages = [
              {
                role: 'system',
                content: 'You are a financial modeling expert and business advisor. Provide detailed, actionable insights and analysis. Be specific and technical in your responses. Focus on practical implementation and concrete next steps.'
              },
              {
                role: 'user',
                content: userMessage
              }
            ];
          }
        }
      } else if (userMessage.includes('"model"')) {
        // Try to parse as JSON payload
        const payload = JSON.parse(userMessage);
        model = payload.model || 'gpt-4';
        temperature = payload.temperature || 0.7;
        maxTokens = payload.max_tokens || 2000;
        
        if (payload.messages && Array.isArray(payload.messages) && payload.messages.length > 0) {
          messages = payload.messages;
        } else {
          messages = [
            {
              role: 'system',
              content: 'You are a financial modeling expert and business advisor. Provide detailed, actionable insights and analysis. Be specific and technical in your responses. Focus on practical implementation and concrete next steps.'
            },
            {
              role: 'user',
              content: userMessage
            }
          ];
        }
      } else {
        // Fallback to default structure
        messages = [
          {
            role: 'system',
            content: 'You are a financial modeling expert and business advisor. Provide detailed, actionable insights and analysis. Be specific and technical in your responses. Focus on practical implementation and concrete next steps.'
          },
          ...chatHistory,
          {
            role: 'user',
            content: userMessage
          }
        ];
      }
    } catch (parseError) {
      console.log('Chat API: Could not parse payload, using defaults:', parseError);
      // Fallback to default structure
      messages = [
        {
          role: 'system',
          content: 'You are a financial modeling expert and business advisor. Provide detailed, actionable insights and analysis. Be specific and technical in your responses. Focus on practical implementation and concrete next steps.'
        },
        ...chatHistory,
        {
          role: 'user',
          content: userMessage
        }
      ];
    }

    // Validate messages array
    if (!Array.isArray(messages) || messages.length === 0) {
      console.log('Chat API: Invalid messages array, using fallback');
      messages = [
        {
          role: 'system',
          content: 'You are a financial modeling expert and business advisor. Provide detailed, actionable insights and analysis. Be specific and technical in your responses. Focus on practical implementation and concrete next steps.'
        },
        {
          role: 'user',
          content: userMessage
        }
      ];
    }

    // Validate each message has required fields
    messages = messages.filter(msg => msg && msg.role && msg.content).map(msg => ({
      role: msg.role,
      content: String(msg.content)
    }));

    console.log('Chat API: Using model:', model, 'temperature:', temperature, 'maxTokens:', maxTokens);

    // Make actual API call to OpenAI
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: temperature,
        max_tokens: maxTokens,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
      })
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json().catch(() => ({}));
      console.error('OpenAI API error:', {
        status: openaiResponse.status,
        statusText: openaiResponse.statusText,
        errorData,
        requestBody: {
          model,
          messages,
          temperature,
          max_tokens: maxTokens
        }
      });
      return NextResponse.json(
        { 
          error: 'OpenAI API error', 
          details: errorData.error?.message || 'Unknown error',
          status: openaiResponse.status,
          requestBody: {
            model,
            messages,
            temperature,
            max_tokens: maxTokens
          }
        },
        { status: openaiResponse.status }
      );
    }

    const openaiData = await openaiResponse.json();
    const response = openaiData.choices?.[0]?.message?.content || 'No response received';
    
    console.log('Chat API: OpenAI response received, length:', response.length);
    
    return NextResponse.json({
      response: response,
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
