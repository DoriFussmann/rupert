import { config } from "dotenv";
config({ override: true });
import { PrismaClient } from "@prisma/client";

const g = global as typeof global & {
  prisma?: PrismaClient;
};

export const prisma = g.prisma || new PrismaClient({
  log: ["warn", "error"]
});

if (process.env.NODE_ENV !== "production") g.prisma = prisma;
