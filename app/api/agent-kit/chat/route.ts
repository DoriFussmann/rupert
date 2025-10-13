import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/app/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await verifyJWT(token);
    const { message } = await req.json();

    // Call OpenAI workflow API
    const response = await fetch('https://api.openai.com/v1/workflows/runs', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workflow_id: process.env.WORKFLOW_ID,
        input: {
          message: message
        }
      })
    });

    const data = await response.json();
    
    return NextResponse.json({ 
      response: data.output?.message || JSON.stringify(data.output || data)
    });
  } catch (error) {
    console.error('Workflow error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}


