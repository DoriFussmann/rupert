import { prisma } from "@/app/lib/prisma";
import { methodNotAllowed } from "@/app/api/_utils/http";
type Ctx = { params: { slug: string } };
export async function GET(_req: Request, { params }: Ctx) {
  const { slug } = params;
  const c = await prisma.collection.findUnique({ where: { slug }});
  if (!c) return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
  return Response.json(c);
}
export const POST = methodNotAllowed;
export const PUT  = methodNotAllowed;
export const DELETE = methodNotAllowed;
