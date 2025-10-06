require("dotenv").config({ override: true });
const { PrismaClient } = require("@prisma/client");
const slug = process.argv[2] || "tools-pages";
(async () => {
  const prisma = new PrismaClient();
  try {
    const col = await prisma.collection.findUnique({ where: { slug } });
    if (!col) { console.log(JSON.stringify({ error: 'Collection not found', slug }, null, 2)); return; }
    const fields = await prisma.field.findMany({ where: { collectionId: col.id }, orderBy: { order: 'asc' } });
    const records = await prisma.record.findMany({ where: { collectionId: col.id }, orderBy: { createdAt: 'asc' } });
    const projected = records.map(r => {
      const row = { id: r.id, name: r.data?.name ?? '' };
      for (const f of fields) {
        row[f.key] = r.data?.[f.key] ?? '';
      }
      return row;
    });
    console.log(JSON.stringify({
      collection: { id: col.id, name: col.name, slug: col.slug },
      fields: fields.map(f => ({ label: f.label, key: f.key, type: f.type, required: f.required, order: f.order })),
      records: projected
    }, null, 2));
  } catch (e) {
    console.error('ERR', e?.message || e);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();
