import { assertEquals } from "$std/assert/mod.ts";
import { createDb } from "./db.ts";

Deno.test("DB: creates client with in-memory SQLite", () => {
  const db = createDb(":memory:");
  assertEquals(typeof db, "object");
  db.client.close();
});

Deno.test("DB: returned instance can execute a query", async () => {
  const db = createDb(":memory:");
  const r = await db.db.values<[{ v: number }]>("SELECT 1 AS v");
  assertEquals(r[0].v, 1);
  db.client.close();
});
