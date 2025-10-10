import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  try {
    // Temporarily allow all requests to bypass middleware issues in production
    // TODO: Re-enable authentication once Edge Runtime issues are resolved
    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)' 
  ],
};