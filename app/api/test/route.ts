import { NextResponse } from 'next/server';

/**
 * Simple test endpoint to verify API routes are working
 * GET /api/test
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'API routes are working!',
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
    }
  });
}

