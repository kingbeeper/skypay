import "dotenv/config";
import path from "node:path";
import { defineConfig } from "@prisma/config";

// Prisma 7 reads DATABASE_URL here for CLI commands (db push, generate,
// migrate, seed). The runtime client gets its connection separately via a
// driver adapter passed to `new PrismaClient({ adapter })`.
export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  datasource: {
    url: process.env.DATABASE_URL,
  },
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
