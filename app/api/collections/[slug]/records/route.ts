import { prisma } from "@/app/lib/prisma";
import { parseJSON, methodNotAllowed } from "@/app/api/_utils/http";
type Ctx = { params: Promise<{ slug: string }> };
export async function GET(_req: Request, ctx: Ctx) {
  const { slug } = await ctx.params;
  const col = await prisma.collection.findUnique({ where: { slug }});
  if (!col) return new Response(JSON.stringify({ error: "Collection not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
  const records = await prisma.record.findMany({ where: { collectionId: col.id }, orderBy: { createdAt: "desc" }});
  return Response.json(records);
}
export async function POST(req: Request, ctx: Ctx) {
  const { slug } = await ctx.params;
  const col = await prisma.collection.findUnique({ where: { slug }});
  if (!col) return new Response(JSON.stringify({ error: "Collection not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
  const body = await parseJSON(req);
  const created = await prisma.record.create({
    data: { collectionId: col.id, data: body?.data ?? {} },
  });
  return Response.json(created, { status: 201 });
}
export const PUT = methodNotAllowed;
export const DELETE = methodNotAllowed;
