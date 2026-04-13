// This config is for local schema generation only (drizzle-kit generate).
// Migrations are applied via wrangler: npm run db:migrate:local
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/db/schema.ts",
  out: "./migrations",
});
