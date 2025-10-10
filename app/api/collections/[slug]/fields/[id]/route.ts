import { prisma } from "@/app/lib/prisma";
import { FieldType } from "@prisma/client";
import { parseJSON, methodNotAllowed } from "@/app/api/_utils/http";
type Ctx = { params: Promise<{ slug: string; id: string }> };
export async function GET(_req: Request, ctx: Ctx) {
  const params = await ctx.params;
  const field = await prisma.field.findUnique({ where: { id: params.id }});
  if (!field) return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
  return Response.json(field);
}
export async function PUT(req: Request, ctx: Ctx) {
  const params = await ctx.params;
  const body = await parseJSON(req);
  const updated = await prisma.field.update({
    where: { id: params.id },
    data: {
      label: body.label ?? undefined,
      key: body.key ?? undefined,
      type: body.type ? (body.type as FieldType) : undefined,
      required: typeof body.required === "boolean" ? body.required : undefined,
      options: body.options ?? undefined,
      order: Number.isFinite(body.order) ? body.order : undefined,
    },
  });
  return Response.json(updated);
}
export async function DELETE(_req: Request, ctx: Ctx) {
  const params = await ctx.params;
  await prisma.field.delete({ where: { id: params.id }});
  return new Response(null, { status: 204 });
}
export const POST = methodNotAllowed;
