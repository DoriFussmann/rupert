import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), '.env.local'), override: true });
config({ path: path.resolve(process.cwd(), '.env'), override: false });
import { PrismaClient, FieldType } from "@prisma/client";

const prisma = new PrismaClient();

const COLLECTIONS = [
  { name: "Advisors", slug: "advisors" },
  { name: "Structures", slug: "structures" },
  { name: "Companies", slug: "companies" },
  { name: "Tasks", slug: "tasks" },
  { name: "Pages", slug: "pages" },
  { name: "System Prompts", slug: "system-prompts" },
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
    { label: "Name", key: "name", type: FieldType.text, required: true, order: 1 },
    { label: "Role", key: "role", type: FieldType.text, required: false, order: 2 },
    { label: "One-Liner", key: "oneliner", type: FieldType.text, required: false, order: 3 },
    { label: "Prompt", key: "prompt", type: FieldType.text, required: false, order: 4 },
    { label: "Image", key: "image", type: FieldType.image, required: false, order: 5 },
    { label: "Knowledge Feed", key: "knowledgeFeed", type: FieldType.text, required: false, order: 6 },
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

async function seedStructuresCollection() {
  const structures = await prisma.collection.findUnique({ where: { slug: "structures" } });
  if (!structures) return;

  const fields = [
    { label: "Title", key: "title", type: FieldType.text, required: true, order: 1 },
    { label: "Description", key: "description", type: FieldType.richtext, required: false, order: 2 },
    { label: "Tree", key: "tree", type: FieldType.json, required: false, order: 3 },
    { label: "Compiled", key: "compiled", type: FieldType.json, required: false, order: 4 },
    { label: "Live Preview", key: "livePreview", type: FieldType.boolean, required: false, order: 5 },
  ];

  for (const f of fields) {
    await prisma.field.upsert({
      where: { collectionId_key: { collectionId: structures.id, key: f.key } },
      update: { ...f },
      create: { ...f, collectionId: structures.id },
    });
  }
}

async function seedStructureTemplates() {
  const structures = await prisma.collection.findUnique({ where: { slug: "structures" } });
  if (!structures) return;

  const templates = [
    {
      title: "Template — Business Plan (Short)",
      description: "A concise business plan template covering essential elements",
      tree: {
        children: [
          {
            id: "exec-summary",
            title: "Executive Summary",
            children: [
              {
                id: "vision-mission",
                title: "Vision & Mission",
                children: [
                  { id: "q1", title: "What is your company's vision statement?" },
                  { id: "q2", title: "What is your core mission?" }
                ]
              },
              {
                id: "value-prop",
                title: "Value Proposition",
                children: [
                  { id: "q3", title: "What unique value do you provide?" },
                  { id: "q4", title: "Who is your target customer?" }
                ]
              }
            ]
          },
          {
            id: "market-analysis",
            title: "Market Analysis",
            children: [
              {
                id: "market-size",
                title: "Market Size & Opportunity",
                children: [
                  { id: "q5", title: "What is your total addressable market?" },
                  { id: "q6", title: "What is your serviceable addressable market?" }
                ]
              },
              {
                id: "competition",
                title: "Competitive Landscape",
                children: [
                  { id: "q7", title: "Who are your main competitors?" },
                  { id: "q8", title: "What is your competitive advantage?" }
                ]
              }
            ]
          }
        ]
      },
      livePreview: false
    },
    {
      title: "Template — Financial Model (Lite)",
      description: "A lightweight financial modeling framework",
      tree: {
        children: [
          {
            id: "revenue-model",
            title: "Revenue Model",
            children: [
              {
                id: "revenue-streams",
                title: "Revenue Streams",
                children: [
                  { id: "q9", title: "What are your primary revenue streams?" },
                  { id: "q10", title: "What is your pricing strategy?" }
                ]
              },
              {
                id: "growth-projections",
                title: "Growth Projections",
                children: [
                  { id: "q11", title: "What is your projected growth rate?" },
                  { id: "q12", title: "What are your key growth drivers?" }
                ]
              }
            ]
          },
          {
            id: "cost-structure",
            title: "Cost Structure",
            children: [
              {
                id: "fixed-costs",
                title: "Fixed Costs",
                children: [
                  { id: "q13", title: "What are your main fixed expenses?" },
                  { id: "q14", title: "What is your monthly burn rate?" }
                ]
              },
              {
                id: "variable-costs",
                title: "Variable Costs",
                children: [
                  { id: "q15", title: "What are your variable cost drivers?" },
                  { id: "q16", title: "What is your gross margin target?" }
                ]
              }
            ]
          }
        ]
      },
      livePreview: false
    }
  ];

  let created = 0;
  let updated = 0;

  for (const template of templates) {
    const existing = await prisma.record.findFirst({
      where: {
        collectionId: structures.id,
        data: {
          path: ["title"],
          equals: template.title
        }
      }
    });

    if (existing) {
      await prisma.record.update({
        where: { id: existing.id },
        data: { data: template }
      });
      updated++;
    } else {
      await prisma.record.create({
        data: {
          collectionId: structures.id,
          data: template
        }
      });
      created++;
    }
  }

  console.log(`Structure templates: created ${created}, updated ${updated}`);
}

async function seedToolsPagesCollection() {
  const tools = await prisma.collection.findUnique({ where: { slug: "pages" } });
  if (!tools) return;

  const fields = [
    { label: "Name", key: "name", type: FieldType.text, required: true, order: 1 },
    { label: "Main Advisor", key: "mainAdvisorId", type: FieldType.text, required: false, order: 2 },
    { label: "Description", key: "description", type: FieldType.richtext, required: false, order: 3 },
    { label: "Active", key: "active", type: FieldType.boolean, required: false, order: 4 },
    { label: "How it works 1", key: "howItWorks1", type: FieldType.text, required: false, order: 5 },
    { label: "How it works 2", key: "howItWorks2", type: FieldType.text, required: false, order: 6 },
    { label: "How it works 3", key: "howItWorks3", type: FieldType.text, required: false, order: 7 },
    { label: "How it works 4", key: "howItWorks4", type: FieldType.text, required: false, order: 8 },
  ];

  for (const f of fields) {
    await prisma.field.upsert({
      where: { collectionId_key: { collectionId: tools.id, key: f.key } },
      update: { ...f },
      create: { ...f, collectionId: tools.id },
    });
  }

  // Seed one record per page (all set to inactive by default)
  const pages = [
    { name: "Home", active: false },
    { name: "Login", active: false },
    { name: "Admin", active: false },
    { name: "Design Master", active: false },
    { name: "Data Mapper", active: false },
    { name: "Strategy Planner", active: false },
  ];
  const existing = await prisma.record.findFirst({ where: { collectionId: tools.id } });
  if (!existing) {
    await prisma.record.createMany({
      data: pages.map(p => ({ collectionId: tools.id, data: p })),
    });
  }
}

async function seedCompaniesCollection() {
  const companies = await prisma.collection.findUnique({ where: { slug: "companies" } });
  if (!companies) return;

  const fields = [
    { label: "Name", key: "name", type: FieldType.text, required: true, order: 1 },
    { label: "Description", key: "description", type: FieldType.richtext, required: false, order: 2 },
    { label: "Raw Data", key: "rawData", type: FieldType.richtext, required: false, order: 3 },
    { label: "Data Map", key: "dataMap", type: FieldType.json, required: false, order: 4 },
    { label: "Business Classification", key: "businessClassification", type: FieldType.text, required: false, order: 5 },
    { label: "Business Classification Confidence", key: "businessClassificationConfidence", type: FieldType.text, required: false, order: 6 },
    { label: "Business Classification Rationale", key: "businessClassificationRationale", type: FieldType.richtext, required: false, order: 7 },
    { label: "Business Classification Evidence", key: "businessClassificationEvidence", type: FieldType.richtext, required: false, order: 8 },
    { label: "Business Classification Modeling Implications", key: "businessClassificationModelingImplications", type: FieldType.richtext, required: false, order: 9 },
  ];

  for (const f of fields) {
    await prisma.field.upsert({
      where: { collectionId_key: { collectionId: companies.id, key: f.key } },
      update: { ...f },
      create: { ...f, collectionId: companies.id },
    });
  }
}

async function seedTasksCollection() {
  const tasks = await prisma.collection.findUnique({ where: { slug: "tasks" } });
  if (!tasks) return;

  const fields = [
    { label: "Name", key: "name", type: FieldType.text, required: true, order: 1 },
    { label: "Task Prompt", key: "taskPrompt", type: FieldType.text, required: false, order: 2 },
  ];

  for (const f of fields) {
    await prisma.field.upsert({
      where: { collectionId_key: { collectionId: tasks.id, key: f.key } },
      update: { ...f },
      create: { ...f, collectionId: tasks.id },
    });
  }
}

async function seedSystemPromptsCollection() {
  const systemPrompts = await prisma.collection.findUnique({ where: { slug: "system-prompts" } });
  if (!systemPrompts) return;

  const fields = [
    { label: "Name", key: "name", type: FieldType.text, required: true, order: 1 },
    { label: "Content", key: "content", type: FieldType.richtext, required: true, order: 2 },
  ];

  for (const f of fields) {
    await prisma.field.upsert({
      where: { collectionId_key: { collectionId: systemPrompts.id, key: f.key } },
      update: { ...f },
      create: { ...f, collectionId: systemPrompts.id },
    });
  }
}

async function main() {
  await ensureCollections();
  await seedAdvisorFields();
  await seedStructuresCollection();
  await seedStructureTemplates();
  await seedCompaniesCollection();
  await seedTasksCollection();
  await seedSystemPromptsCollection();
  await seedToolsPagesCollection();
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
