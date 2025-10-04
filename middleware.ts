import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow these paths
  if (
    pathname === '/' ||
    pathname === '/login' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/health') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/uploads') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Allow GET requests to API routes (for public data access)
  if (pathname.startsWith('/api') && req.method === 'GET') {
    return NextResponse.next();
  }

  // Check authentication
  try {
    const token = req.cookies.get("auth-token")?.value;
    
    if (token) {
      const jwtSecret = process.env.JWT_SECRET || process.env.AUTH_JWT_SECRET || "fallback-key";
      const secret = new TextEncoder().encode(jwtSecret);
      await jwtVerify(token, secret);
      return NextResponse.next();
    }
  } catch {
    // Token invalid, continue to redirect
  }

  // Redirect to login for protected pages
  if (!pathname.startsWith('/api')) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Block unauthenticated API requests
  return new NextResponse(
    JSON.stringify({ error: "Unauthorized" }), 
    { status: 401, headers: { "Content-Type": "application/json" } }
  );
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};