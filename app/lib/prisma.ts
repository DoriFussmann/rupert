import { config } from "dotenv";
config({ override: true });
import { PrismaClient } from "@prisma/client";

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
