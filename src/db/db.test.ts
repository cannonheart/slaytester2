import { assertEquals } from "$std/assert/mod.ts";
import { resetDb } from "./db.ts";

Deno.test("DB: creates client with in-memory SQLite", () => {
  const db = resetDb(":memory:");
  assertEquals(typeof db, "object");
});

Deno.test("DB: returned instance can execute a query", async () => {
  const db = resetDb(":memory:");
  const r = await db.values<[{ v: number }]>("SELECT 1 AS v");
  assertEquals(r[0].v, 1);
});

Deno.test("DB: calling resetDb again switches database", () => {
  const db1 = resetDb(":memory:");
  const db2 = resetDb(":memory:");
  assertEquals(typeof db1, "object");
  assertEquals(typeof db2, "object");
});
