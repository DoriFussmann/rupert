import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const COLLECTIONS = [
  { name: "Advisors", slug: "advisors" },
  { name: "Structures", slug: "structures" },
] as const;

async function ensureCollections() {
  for (const c of COLLECTIONS) {
    await prisma.collection.upsert({
      where: { slug: c.slug },
      update: { name: c.name },
      create: { name: c.name, slug: c.slug },
    });
  }
}

async function seedAdvisorFields() {
  const advisors = await prisma.collection.findUnique({ where: { slug: "advisors" } });
  if (!advisors) return;

  const fields = [
    { label: "Name", key: "name", type: "text", required: true, order: 1 },
    { label: "Role", key: "role", type: "text", required: false, order: 2 },
    { label: "One-Liner", key: "oneliner", type: "text", required: false, order: 3 },
  ];

  for (const f of fields) {
    await prisma.field.upsert({
      where: { collectionId_key: { collectionId: advisors.id, key: f.key } },
      update: { ...f },
      create: { ...f, collectionId: advisors.id },
    });
  }

  // Example records (idempotent-ish: upsert by unique combo isn't defined on data; insert only if none)
  const existing = await prisma.record.findFirst({ where: { collectionId: advisors.id } });
  if (!existing) {
    await prisma.record.createMany({
      data: [
        { collectionId: advisors.id, data: { name: "Jane Doe", role: "Strategy", oneliner: "Operator turned advisor." } },
        { collectionId: advisors.id, data: { name: "John Roe", role: "Finance", oneliner: "Modeling nerd." } },
      ],
    });
  }
}

async function main() {
  await ensureCollections();
  await seedAdvisorFields();
}

main()
  .then(async () => {
    console.log("✅ Seed complete");
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
