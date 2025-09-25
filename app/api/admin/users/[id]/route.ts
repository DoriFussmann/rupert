import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

type Ctx = { params: { id: string } };

export async function PUT(req: Request, { params }: Ctx) {
  const body = await req.json().catch(() => ({}));
  const data: any = {};
  if (typeof body.name !== "undefined") data.name = body.name === null ? null : String(body.name);
  if (typeof body.role !== "undefined") data.role = String(body.role);
  if (typeof body.password === "string" && body.password.length > 0) {
    const bcrypt = (await import("bcryptjs")).default;
    data.password = await bcrypt.hash(body.password, 10);
  }
  const user = await prisma.user.update({ where: { id: params.id }, data, select: { id:true, email:true, name:true, role:true, createdAt:true }});
  return NextResponse.json(user);
}

export async function DELETE(_req: Request, { params }: Ctx) {
  await prisma.user.delete({ where: { id: params.id }});
  return new NextResponse(null, { status: 204 });
}
