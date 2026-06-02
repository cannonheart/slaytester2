import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { push } from "./push.ts";

const DB_URL = new URL("../../data/slaytester.db", import.meta.url).pathname;

let _client: ReturnType<typeof createClient> | null = null;
let _db: LibSQLDatabase | null = null;
let _pushed = false;

export async function getDb(): Promise<LibSQLDatabase> {
  if (!_db) {
    const dir = new URL("../../data", import.meta.url).pathname;
    try {
      await Deno.mkdir(dir, { recursive: true });
    } catch (e) {
      throw new Error(`[Slaytester] Failed to create data directory at ${dir}: ${e}`);
    }
    _client = createClient({ url: `file:${DB_URL}` });
    _db = drizzle(_client);
  }
  if (!_pushed) {
    _pushed = true;
    await push(_db);
  }
  return _db;
}

export function resetDb(url: string): LibSQLDatabase {
  _client?.close();
  _client = createClient({ url });
  _db = drizzle(_client);
  _pushed = false;
  return _db;
}

export type Db = LibSQLDatabase;
