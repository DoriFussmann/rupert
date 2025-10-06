require("dotenv").config({ override: true });
const { PrismaClient } = require("@prisma/client");
(async () => {
  const prisma = new PrismaClient();
  try {
    const col = await prisma.collection.findUnique({ where: { slug: "advisors" } });
    if (!col) { console.log("[]"); return; }
    const recs = await prisma.record.findMany({ where: { collectionId: col.id }, orderBy: { createdAt: "desc" } });
    const out = recs.map(r => ({
      name: r.data?.name ?? "",
      role: r.data?.role ?? "",
      oneliner: r.data?.oneliner ?? "",
      prompt: r.data?.prompt ?? ""
    }));
    console.log(JSON.stringify(out, null, 2));
  } catch (e) {
    console.error("ERR", e?.message || e);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();
