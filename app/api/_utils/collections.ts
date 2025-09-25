import { prisma } from "@/app/lib/prisma";
export async function getCollectionBySlug(slug: string) {
  return prisma.collection.findUnique({ where: { slug } });
}
