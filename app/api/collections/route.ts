import { prisma } from "@/app/lib/prisma";
import { methodNotAllowed } from "@/app/api/_utils/http";
export async function GET() {
  const collections = await prisma.collection.findMany({ orderBy: { name: "asc" }});
  return Response.json(collections);
}
export const POST = methodNotAllowed;
export const PUT  = methodNotAllowed;
export const DELETE = methodNotAllowed;
