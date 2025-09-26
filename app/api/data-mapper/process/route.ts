import { NextRequest } from 'next/server';
import OpenAI from 'openai';

interface Payload {
  advisor: {
    name: string;
    role: string;
    prompt: string;
  };
  task: {
    name: string;
    taskPrompt: string;
  };
  structure: {
    outline: any;
  };
  company: {
    name: string;
    rawData: string;
  };
  parameters: {
    model: string;
    maxTokens: number;
    temperature: number;
  };
}

export async function POST(req: NextRequest) {
  try {
    const payload: Payload = await req.json();

    // Validate payload
    if (!payload.advisor || !payload.task || !payload.structure || !payload.company || !payload.parameters) {
      return new Response(
        JSON.stringify({ error: 'Missing required payload fields' }),
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

    // Build the prompt from the payload
    const systemPrompt = `You are ${payload.advisor.name}, a ${payload.advisor.role}. ${payload.advisor.prompt}`;
    
    const userPrompt = `
Task: ${payload.task.name}
Task Instructions: ${payload.task.taskPrompt}

Company: ${payload.company.name}
Raw Data: ${payload.company.rawData}

Structure Outline: ${JSON.stringify(payload.structure.outline, null, 2)}

Please process this company data according to the task instructions and structure outline provided.
`;

    // Make the OpenAI API call
    const completion = await openai.chat.completions.create({
      model: payload.parameters.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: payload.parameters.maxTokens,
      temperature: payload.parameters.temperature,
    });

    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      processedPayload: payload,
      result: {
        content: completion.choices[0]?.message?.content || 'No response generated',
        usage: completion.usage,
        model: completion.model,
        advisor: `${payload.advisor.name} (${payload.advisor.role})`,
        task: payload.task.name,
        company: payload.company.name,
        parameters: {
          model: payload.parameters.model,
          maxTokens: payload.parameters.maxTokens,
          temperature: payload.parameters.temperature
        }
      }
    };

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Data mapper API error:', error);
    
    // Handle OpenAI API errors specifically
    if (error instanceof Error && error.message.includes('API key')) {
      return new Response(
        JSON.stringify({ 
          error: 'OpenAI API key error',
          details: 'Please check your OpenAI API key configuration'
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
