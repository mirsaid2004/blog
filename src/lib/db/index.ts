import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

/**
 * Neon over HTTP: no connection to keep open, which suits serverless functions.
 * Multi-statement writes go through `db.batch([...])`, which runs as one transaction.
 */
function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set (see doc/setup-services.md)");
  return drizzle({ client: neon(url), schema });
}

let instance: ReturnType<typeof createDb> | undefined;

export function db() {
  return (instance ??= createDb());
}

export { schema };
