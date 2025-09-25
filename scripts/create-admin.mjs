#!/usr/bin/env node

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { config } from "dotenv";

// Load environment variables
config();

const prisma = new PrismaClient({
  log: ["warn", "error"]
});

async function createAdmin() {
  try {
    // Get environment variables with defaults
    const email = process.env.ADMIN_EMAIL || "admin@example.com";
    const password = process.env.ADMIN_PASSWORD || "admin123";
    const name = process.env.ADMIN_NAME || "Admin User";

    console.log(`Creating/updating admin user: ${email}`);

    // Hash the password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Upsert the admin user
    const admin = await prisma.user.upsert({
      where: {
        email: email
      },
      update: {
        name: name,
        password: hashedPassword,
        role: "admin",
        updatedAt: new Date()
      },
      create: {
        email: email,
        name: name,
        password: hashedPassword,
        role: "admin"
      }
    });

    console.log("✅ Admin user created/updated successfully:");
    console.log(`   ID: ${admin.id}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Name: ${admin.name}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   Created: ${admin.createdAt}`);
    console.log(`   Updated: ${admin.updatedAt}`);

  } catch (error) {
    console.error("❌ Error creating admin user:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createAdmin();
