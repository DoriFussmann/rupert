import { NextRequest } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { jwtVerify } from "jose";

export async function GET(req: NextRequest) {
  const started = Date.now();

  // Env check
  const env = {
    DATABASE_URL: !!process.env.DATABASE_URL,
    AUTH_JWT_SECRET: !!(process.env.AUTH_JWT_SECRET || process.env.JWT_SECRET),
    NODE_ENV: process.env.NODE_ENV || "development",
  };

  // DB check
  const db = { ok: false as boolean, error: null as null | string };
  try {
    await prisma.$queryRaw`SELECT 1`;
    db.ok = true;
  } catch (e: unknown) {
    db.ok = false;
    db.error = e instanceof Error ? e.message : "DB error";
  }

  // Auth check (cookie is optional)
  const secret = new TextEncoder().encode(process.env.AUTH_JWT_SECRET || process.env.JWT_SECRET || "dev-secret");
  let auth = { authenticated: false as boolean, email: null as string | null, role: null as string | null };
  const token = req.cookies.get("auth-token")?.value || req.cookies.get("auth")?.value;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, secret);
      auth = { 
        authenticated: true, 
        email: (typeof payload?.email === 'string' ? payload.email : null), 
        role: (typeof payload?.role === 'string' ? payload.role : null) 
      };
    } catch {
      auth = { authenticated: false, email: null, role: null };
    }
  }

  const result = {
    ok: env.DATABASE_URL && env.AUTH_JWT_SECRET && db.ok,
    env,
    db,
    auth,
    latencyMs: Date.now() - started,
    time: new Date().toISOString(),
  };
  return Response.json(result, { status: result.ok ? 200 : 500 });
}
