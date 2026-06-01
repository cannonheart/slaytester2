import { assertEquals } from "$std/assert/mod.ts";
import { resetDb } from "./db.ts";
import { push } from "./push.ts";

Deno.test("Push: creates playtests and sessions tables", async () => {
  const db = resetDb(":memory:");
  await push(db);

  const tables = await db.values<[{ name: string }]>(
    "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('playtests', 'sessions') ORDER BY name",
  );
  assertEquals(tables.length, 2);
  assertEquals(tables[0].name, "playtests");
  assertEquals(tables[1].name, "sessions");
});

Deno.test("Push: is idempotent when run twice", async () => {
  const db = resetDb(":memory:");
  await push(db);
  await push(db);

  const tables = await db.values<[{ name: string }]>(
    "SELECT count(*) AS name FROM sqlite_master WHERE type='table' AND name='playtests'",
  );
  assertEquals(tables[0].name, 1);
});
