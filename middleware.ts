import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  // Temporarily allow all requests to bypass middleware issues in production
  // TODO: Re-enable authentication once Edge Runtime issues are resolved
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};