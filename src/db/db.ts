import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import type { LibSQLDatabase } from "drizzle-orm/libsql";

const DB_PATH = "file:data/slaytester.db";

export function createDb(url = DB_PATH) {
  const client = createClient({ url });
  const db = drizzle(client);
  return { db, client };
}

export type Db = LibSQLDatabase;
