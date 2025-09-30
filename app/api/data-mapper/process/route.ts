import { NextRequest } from 'next/server';
import OpenAI from 'openai';

interface Payload {
  task: {
    id: string;
    name: string;
    taskPrompt: string;
  } | null;
  structure: {
    id: string;
    title: string;
    compiled: any;
  } | null;
  company: {
    id: string;
    name: string;
    rawData: string;
  } | null;
  llm: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

export async function POST(req: NextRequest) {
  try {
    const payload: Payload = await req.json();

    // Validate payload
    if (!payload.task || !payload.structure || !payload.company) {
      return new Response(
        JSON.stringify({ error: 'Missing required payload fields (task, structure, company)' }),
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
    const systemPrompt = `You are a business analysis AI assistant. Your role is to process company data according to specific task instructions and structure guidelines to produce comprehensive business analysis and planning documents.`;
    
    const userPrompt = `
Task: ${payload.task.name}
Task Instructions: ${payload.task.taskPrompt}

Company: ${payload.company.name}
Raw Data: ${payload.company.rawData}

Structure: ${payload.structure.title}
Compiled Structure: ${JSON.stringify(payload.structure.compiled, null, 2)}

Please process this company data according to the task instructions and structure provided. Follow the compiled structure format to organize your response.
`;

    // Make the OpenAI API call
    const completion = await openai.chat.completions.create({
      model: payload.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: payload.maxTokens,
      temperature: payload.temperature,
    });

    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      processedPayload: payload,
      result: {
        content: completion.choices[0]?.message?.content || 'No response generated',
        usage: completion.usage,
        model: completion.model,
        task: payload.task.name,
        structure: payload.structure.title,
        company: payload.company.name,
        parameters: {
          model: payload.model,
          maxTokens: payload.maxTokens,
          temperature: payload.temperature
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
