import { prisma } from "@/app/lib/prisma";
import { parseJSON, methodNotAllowed } from "@/app/api/_utils/http";
type Ctx = { params: { slug: string } };
export async function GET(_req: Request, { params }: Ctx) {
  const col = await prisma.collection.findUnique({ where: { slug: params.slug }});
  if (!col) return new Response(JSON.stringify({ error: "Collection not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
  const fields = await prisma.field.findMany({ where: { collectionId: col.id }, orderBy: { order: "asc" }});
  return Response.json(fields);
}
export async function POST(req: Request, { params }: Ctx) {
  const col = await prisma.collection.findUnique({ where: { slug: params.slug }});
  if (!col) return new Response(JSON.stringify({ error: "Collection not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
  const body = await parseJSON(req);
  const created = await prisma.field.create({
    data: {
      collectionId: col.id,
      label: String(body.label ?? ""),
      key: String(body.key ?? ""),
      type: String(body.type ?? "text"),
      required: Boolean(body.required ?? false),
      options: body.options ?? null,
      order: Number.isFinite(body.order) ? body.order : 0,
    },
  });
  return Response.json(created, { status: 201 });
}
export const PUT = methodNotAllowed;
export const DELETE = methodNotAllowed;
