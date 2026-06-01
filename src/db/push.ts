import { sql } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";

export async function push(db: LibSQLDatabase) {
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS playtests (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      available_slots INTEGER NOT NULL,
      request_mic INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL
    )
  `);

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      playtest_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'recording',
      chunk_count INTEGER DEFAULT 0,
      duration REAL
    )
  `);
}
