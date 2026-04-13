import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export type DrizzleClient = ReturnType<typeof createDb>;

/**
 * Creates a Drizzle ORM client bound to a Cloudflare D1 database.
 * Usage: const db = createDb(c.env.DB);
 */
export function createDb(d1: D1Database) {
  return drizzle(d1, { schema });
}

export * from "./schema";
