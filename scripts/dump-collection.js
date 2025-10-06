require("dotenv").config({ override: true });
const { PrismaClient } = require("@prisma/client");
const slug = process.argv[2] || "tools-pages";
(async () => {
  const prisma = new PrismaClient();
  try {
    const col = await prisma.collection.findUnique({ where: { slug } });
    if (!col) { console.log("[]"); return; }
    const recs = await prisma.record.findMany({ where: { collectionId: col.id }, orderBy: { createdAt: "asc" } });
    const out = recs.map(r => r.data?.name || "");
    console.log(JSON.stringify(out, null, 2));
  } catch (e) {
    console.error("ERR", e?.message || e);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();
