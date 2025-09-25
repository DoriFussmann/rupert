import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.AUTH_JWT_SECRET || process.env.JWT_SECRET || "dev-secret");

// Verify cookie token (returns true if valid)
async function isAuthed(req: NextRequest) {
  const token = req.cookies.get("auth-token")?.value || req.cookies.get("auth")?.value;
  if (!token) return false;
  try { await jwtVerify(token, secret); return true; } catch { return false; }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const method = req.method.toUpperCase();

  // 1) Protect Admin UI
  if (pathname.startsWith("/admin")) {
    if (!(await isAuthed(req))) {
      const url = new URL("/login", req.url);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // 2) Protect admin APIs (all methods)
  if (pathname.startsWith("/api/admin/")) {
    if (!(await isAuthed(req))) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
    }
    return NextResponse.next();
  }

  // 3) Protect mutating collection APIs (non-GET only)
  const isCollectionsAPI =
    pathname.startsWith("/api/collections/") &&
    (pathname.includes("/fields") || pathname.includes("/records"));

  if (isCollectionsAPI && method !== "GET") {
    if (!(await isAuthed(req))) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/collections/:path*",
  ],
};