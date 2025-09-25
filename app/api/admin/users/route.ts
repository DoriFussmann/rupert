import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" }, select: { id:true, email:true, name:true, role:true, company:true, createdAt:true }});
  return NextResponse.json(users);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  if (!body?.email || !body?.password) return NextResponse.json({ error: "email and password required" }, { status: 400 });
  const bcrypt = (await import("bcryptjs")).default;
  const hashed = await bcrypt.hash(String(body.password), 10);
  const user = await prisma.user.create({
    data: { 
      email: String(body.email), 
      name: body.name ? String(body.name) : null, 
      password: hashed, 
      role: body.role ? String(body.role) : "user",
      company: body.company ? String(body.company) : null
    },
    select: { id:true, email:true, name:true, role:true, company:true, createdAt:true }
  });
  return NextResponse.json(user, { status: 201 });
}
