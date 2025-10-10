import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

/**
 * Database connection test endpoint
 * Tests Prisma connection and returns collection counts
 * 
 * GET /api/db-test
 */
export async function GET() {
  try {
    // Test 1: Check if DATABASE_URL is set
    const hasDbUrl = !!process.env.DATABASE_URL;
    
    // Test 2: Extract database host (safely, without credentials)
    let dbHost = 'not set';
    let dbName = 'not set';
    if (process.env.DATABASE_URL) {
      try {
        const url = new URL(process.env.DATABASE_URL);
        dbHost = url.hostname;
        dbName = url.pathname.replace('/', '');
      } catch (e) {
        dbHost = 'invalid URL format';
      }
    }

    // Test 3: Try to connect and count collections
    let collectionCount = 0;
    let advisorCount = 0;
    let pageCount = 0;
    let connectionError = null;

    try {
      // Count collections
      collectionCount = await prisma.collection.count();

      // Get specific collection IDs
      const advisors = await prisma.collection.findUnique({ 
        where: { slug: 'advisors' },
        include: { _count: { select: { records: true } } }
      });
      
      const pages = await prisma.collection.findUnique({ 
        where: { slug: 'pages' },
        include: { _count: { select: { records: true } } }
      });

      advisorCount = advisors?._count.records || 0;
      pageCount = pages?._count.records || 0;

    } catch (error) {
      connectionError = error instanceof Error ? error.message : 'Unknown error';
    }

    return NextResponse.json({
      success: !connectionError,
      timestamp: new Date().toISOString(),
      database: {
        hasDbUrl,
        host: dbHost,
        database: dbName,
        connectionError,
      },
      counts: {
        collections: collectionCount,
        advisors: advisorCount,
        pages: pageCount,
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        vercel: process.env.VERCEL === '1' ? 'yes' : 'no',
        region: process.env.VERCEL_REGION || 'local',
      },
      message: connectionError 
        ? '❌ Database connection failed' 
        : collectionCount === 0
          ? '⚠️ Database connected but empty (no collections found)'
          : advisorCount === 0 || pageCount === 0
            ? '⚠️ Database connected but missing records (collections exist but empty)'
            : '✅ Database connected and seeded successfully',
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to test database connection',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

