#!/usr/bin/env node
/**
 * Quick script to seed collections in production
 * Run: node scripts/seed-collections.mjs
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const COLLECTIONS = [
  { name: "Advisors", slug: "advisors" },
  { name: "Structures", slug: "structures" },
  { name: "Companies", slug: "companies" },
  { name: "Tasks", slug: "tasks" },
  { name: "Pages", slug: "pages" },
  { name: "System Prompts", slug: "system-prompts" },
];

async function main() {
  console.log('🔍 Checking collections...\n');
  
  // Check existing collections
  const existing = await prisma.collection.findMany();
  console.log(`Found ${existing.length} existing collections:`);
  existing.forEach(c => console.log(`  ✓ ${c.name} (${c.slug})`));
  console.log();
  
  // Create missing collections
  let created = 0;
  let updated = 0;
  
  for (const c of COLLECTIONS) {
    const result = await prisma.collection.upsert({
      where: { slug: c.slug },
      update: { name: c.name },
      create: { name: c.name, slug: c.slug },
    });
    
    if (existing.find(e => e.slug === c.slug)) {
      updated++;
      console.log(`  ↻ Updated: ${c.name}`);
    } else {
      created++;
      console.log(`  ✨ Created: ${c.name}`);
    }
  }
  
  console.log();
  console.log(`✅ Done! Created: ${created}, Updated: ${updated}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });

