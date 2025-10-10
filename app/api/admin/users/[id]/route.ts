import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, ctx: Ctx) {
  const params = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  if (typeof body.name !== "undefined") data.name = body.name === null ? null : String(body.name);
  if (typeof body.role !== "undefined") data.role = String(body.role);
  if (typeof body.company !== "undefined") data.company = body.company === null ? null : String(body.company);
  if (typeof body.password === "string" && body.password.length > 0) {
    const bcrypt = (await import("bcryptjs")).default;
    data.password = await bcrypt.hash(body.password, 10);
  }
  const user = await prisma.user.update({ where: { id: params.id }, data, select: { id:true, email:true, name:true, role:true, company:true, createdAt:true }});
  return NextResponse.json(user);
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const params = await ctx.params;
  await prisma.user.delete({ where: { id: params.id }});
  return new NextResponse(null, { status: 204 });
}
