import { prisma } from "@/app/lib/prisma";
import { FieldType } from "@prisma/client";
import { parseJSON, methodNotAllowed } from "@/app/api/_utils/http";
type Ctx = { params: Promise<{ slug: string }> };
export async function GET(_req: Request, ctx: Ctx) {
  const params = await ctx.params;
  const col = await prisma.collection.findUnique({ where: { slug: params.slug }});
  if (!col) return new Response(JSON.stringify({ error: "Collection not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
  const fields = await prisma.field.findMany({ where: { collectionId: col.id }, orderBy: { order: "asc" }});
  return Response.json(fields);
}
export async function POST(req: Request, ctx: Ctx) {
  const params = await ctx.params;
  const col = await prisma.collection.findUnique({ where: { slug: params.slug }});
  if (!col) return new Response(JSON.stringify({ error: "Collection not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
  const body = await parseJSON(req);
  const created = await prisma.field.create({
    data: {
      collectionId: col.id,
      label: String(body.label ?? ""),
      key: String(body.key ?? ""),
      type: (body.type ?? "text") as FieldType,
      required: Boolean(body.required ?? false),
      options: body.options ?? null,
      order: Number.isFinite(body.order) ? body.order : 0,
    },
  });
  return Response.json(created, { status: 201 });
}
export const PUT = methodNotAllowed;
export const DELETE = methodNotAllowed;
