import { prisma } from "@/app/lib/prisma";
import { parseJSON, methodNotAllowed } from "@/app/api/_utils/http";
type Ctx = { params: { slug: string; id: string } };
export async function GET(_req: Request, { params }: Ctx) {
  const field = await prisma.field.findUnique({ where: { id: params.id }});
  if (!field) return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
  return Response.json(field);
}
export async function PUT(req: Request, { params }: Ctx) {
  const body = await parseJSON(req);
  const updated = await prisma.field.update({
    where: { id: params.id },
    data: {
      label: body.label ?? undefined,
      key: body.key ?? undefined,
      type: body.type ?? undefined,
      required: typeof body.required === "boolean" ? body.required : undefined,
      options: body.options ?? undefined,
      order: Number.isFinite(body.order) ? body.order : undefined,
    },
  });
  return Response.json(updated);
}
export async function DELETE(_req: Request, { params }: Ctx) {
  await prisma.field.delete({ where: { id: params.id }});
  return new Response(null, { status: 204 });
}
export const POST = methodNotAllowed;
