import { assertEquals } from "$std/assert/mod.ts";
import { resetDb } from "./db.ts";
import { push } from "./push.ts";
import { playtests, sessions } from "./schema.ts";
import { eq } from "drizzle-orm";

Deno.test("Schema: playtests insert and select roundtrip", async () => {
  const db = resetDb(":memory:");
  await push(db);

  const id = crypto.randomUUID();
  const now = Date.now();
  await db.insert(playtests).values({
    id,
    name: "Test Playtest",
    availableSlots: 5,
    requestMic: 1,
    createdAt: now,
  });

  const row = await db.select().from(playtests).where(eq(playtests.id, id)).get();
  assertEquals(row?.name, "Test Playtest");
  assertEquals(row?.availableSlots, 5);
  assertEquals(row?.requestMic, 1);
  assertEquals(row?.createdAt, now);
});

Deno.test("Schema: sessions insert and select roundtrip", async () => {
  const db = resetDb(":memory:");
  await push(db);

  const playtestId = crypto.randomUUID();
  const sessionId = crypto.randomUUID();
  const now = Date.now();

  await db.insert(playtests).values({
    id: playtestId,
    name: "Playtest",
    availableSlots: 1,
    createdAt: now,
  });

  await db.insert(sessions).values({
    id: sessionId,
    playtestId,
    createdAt: now,
  });

  const row = await db.select().from(sessions).where(eq(sessions.id, sessionId)).get();
  assertEquals(row?.playtestId, playtestId);
  assertEquals(row?.status, "recording");
  assertEquals(row?.chunkCount, 0);
  assertEquals(row?.duration, null);
});

Deno.test("Schema: default values on sessions", async () => {
  const db = resetDb(":memory:");
  await push(db);

  const playtestId = crypto.randomUUID();
  const now = Date.now();
  await db.insert(playtests).values({
    id: playtestId,
    name: "P",
    availableSlots: 1,
    createdAt: now,
  });

  await db.insert(sessions).values({
    id: crypto.randomUUID(),
    playtestId,
    createdAt: now,
  });

  const rows = await db.select().from(sessions).all();
  assertEquals(rows.length, 1);
  assertEquals(rows[0].status, "recording");
  assertEquals(rows[0].chunkCount, 0);
});
