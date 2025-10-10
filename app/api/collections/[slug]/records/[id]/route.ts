import { prisma } from "@/app/lib/prisma";
type Ctx = { params: Promise<{ slug: string; id: string }> };
export async function GET(_req: Request, ctx: Ctx) {
  const params = await ctx.params;
  const rec = await prisma.record.findUnique({ where: { id: params.id }});
  if (!rec) return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
  return Response.json(rec);
}
export async function PUT(req: Request, ctx: Ctx) {
  const params = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const updated = await prisma.record.update({
    where: { id: params.id },
    data: { data: body?.data ?? undefined },
  });
  return Response.json(updated);
}
export async function DELETE(_req: Request, ctx: Ctx) {
  const params = await ctx.params;
  await prisma.record.delete({ where: { id: params.id }});
  return new Response(null, { status: 204 });
}
