import { NextRequest } from 'next/server';
import OpenAI from 'openai';

export async function POST(req: NextRequest) {
  try {
    const raw = await req.text();
    let customPayload: any;
    try {
      customPayload = JSON.parse(raw || '{}');
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body', details: 'Request body must be valid JSON' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate OpenAI API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: apiKey,
    });

    // Validate that the payload has required OpenAI fields
    if (!customPayload.messages && !customPayload.prompt) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid payload format',
          details: 'Payload must contain either "messages" array (for chat completions) or "prompt" string (for legacy completions)'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let completion: any;
    let apiCallType = 'unknown';

    // Handle chat completions (preferred format)
    if (customPayload.messages) {
      apiCallType = 'chat.completions';
      
      // Set defaults for required fields if not provided
      const chatPayload = {
        model: customPayload.model || 'gpt-4-turbo',
        messages: customPayload.messages,
        max_tokens: customPayload.max_tokens || customPayload.maxTokens || 2000,
        temperature: customPayload.temperature || 0.7,
        ...customPayload // Allow any additional OpenAI parameters
      };

      // Remove any undefined values
      Object.keys(chatPayload).forEach(key => {
        if (chatPayload[key] === undefined) {
          delete chatPayload[key];
        }
      });

      completion = await openai.chat.completions.create(chatPayload);
    }
    // Handle legacy completions (if someone sends a prompt)
    else if (customPayload.prompt) {
      apiCallType = 'completions';
      
      const completionPayload = {
        model: customPayload.model || 'gpt-3.5-turbo-instruct',
        prompt: customPayload.prompt,
        max_tokens: customPayload.max_tokens || customPayload.maxTokens || 2000,
        temperature: customPayload.temperature || 0.7,
        ...customPayload
      };

      // Remove any undefined values
      Object.keys(completionPayload).forEach(key => {
        if (completionPayload[key] === undefined) {
          delete completionPayload[key];
        }
      });

      completion = await openai.completions.create(completionPayload);
    }

    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      apiCallType,
      customPayload,
      result: {
        content: completion.choices[0]?.message?.content || completion.choices[0]?.text || 'No response generated',
        usage: completion.usage,
        model: completion.model,
        finishReason: completion.choices[0]?.finish_reason,
        parameters: {
          model: customPayload.model || (apiCallType === 'chat.completions' ? 'gpt-4-turbo' : 'gpt-3.5-turbo-instruct'),
          maxTokens: customPayload.max_tokens || customPayload.maxTokens || 2000,
          temperature: customPayload.temperature || 0.7
        }
      }
    };

    return new Response(JSON.stringify(response), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    try {
      console.error('Custom data mapper API error:', error);
      if (error?.status && error?.message) {
        return new Response(
          JSON.stringify({ error: error.message, details: error?.error?.message || error?.cause || null }),
          { status: Number(error.status) || 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
      if (error instanceof Error && error.message.includes('API key')) {
        return new Response(
          JSON.stringify({ error: 'OpenAI API key error', details: 'Please check your OPENAI_API_KEY in .env.local and restart the dev server' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    } catch {
      return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
  }
}
