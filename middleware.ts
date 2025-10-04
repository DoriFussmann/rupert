import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// Verify cookie token (returns true if valid)
async function isAuthed(req: NextRequest) {
  try {
    const jwtSecret = process.env.JWT_SECRET || process.env.AUTH_JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET not configured');
      return false;
    }
    
    const secret = new TextEncoder().encode(jwtSecret);
    const token = req.cookies.get("auth-token")?.value || req.cookies.get("auth")?.value;
    
    if (!token) return false;
    
    await jwtVerify(token, secret);
    return true;
  } catch (error) {
    console.error('Auth verification failed:', error);
    return false;
  }
}

// Public routes that don't require authentication
const publicRoutes = [
  '/',           // Home page
  '/login',      // Login/signup page
  '/api/auth',   // Auth endpoints (login, signup, logout)
  '/api/health', // Health check
];

// Check if a path is public
function isPublicRoute(pathname: string): boolean {
  // Exact match or starts with pattern
  return publicRoutes.some(route => {
    if (route === pathname) return true;
    if (pathname.startsWith(route + '/')) return true;
    return false;
  });
}

export async function middleware(req: NextRequest) {
  try {
    const { pathname } = req.nextUrl;
    const method = req.method.toUpperCase();

    // Allow public routes
    if (isPublicRoute(pathname)) {
      return NextResponse.next();
    }

    // Allow access to static files and Next.js internals
    if (
      pathname.startsWith('/_next') ||
      pathname.startsWith('/static') ||
      pathname.startsWith('/uploads') ||
      pathname.includes('.') // Files with extensions (images, fonts, etc.)
    ) {
      return NextResponse.next();
    }

    // Check authentication for all other routes
    const authenticated = await isAuthed(req);

    // Allow read-only API calls (GET requests) for non-authenticated users
    // This allows them to see content on the home page
    if (!authenticated && pathname.startsWith('/api') && method === 'GET') {
      return NextResponse.next();
    }

    // Protect all pages except home and login
    if (!authenticated && !pathname.startsWith('/api')) {
      const url = new URL("/login", req.url);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }

    // Protect mutating API routes (POST, PUT, DELETE, PATCH) for non-authenticated users
    if (!authenticated && pathname.startsWith('/api')) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized" }), 
        { 
          status: 401, 
          headers: { "Content-Type": "application/json" } 
        }
      );
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    // On error, allow the request through to avoid blocking the entire site
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};