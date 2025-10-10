import { PrismaClient } from "@prisma/client";

// Only use dotenv in development (not in Edge Runtime)
if (typeof process !== 'undefined' && process.env.NODE_ENV !== "production" && typeof window === 'undefined') {
  try {
    const { config } = require("dotenv");
    config({ override: true });
  } catch (e) {
    // dotenv not available in Edge Runtime, that's ok
  }
}

const skipDb = process.env.SKIP_DB === "1";

const g = global as typeof global & {
  prisma?: PrismaClient | null;
};

export const prisma = skipDb 
  ? null 
  : (g.prisma || new PrismaClient({
      log: ["warn", "error"]
    }));

if (process.env.NODE_ENV !== "production" && !skipDb) {
  g.prisma = prisma;
}
