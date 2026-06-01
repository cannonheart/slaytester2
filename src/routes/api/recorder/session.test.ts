import { assertEquals } from "$std/assert/mod.ts";
import { eq } from "drizzle-orm";
import "../../../lib/env.ts";
import { resetDb } from "../../../db/db.ts";
import { push } from "../../../db/push.ts";
import { playtests } from "../../../db/schema.ts";
import { handler } from "./session.ts";

function makeDb() {
  return `file:${Deno.makeTempFileSync({ suffix: ".db" })}`;
}

function mockCtx(req: Request) {
  return { req, url: new URL(req.url), state: {} } as any;
}

Deno.test("Recorder session: creates session and decrements slot", async () => {
  const db = resetDb(makeDb());
  await push(db);
  await db.insert(playtests).values({
    id: "pt-1",
    name: "Test",
    availableSlots: 3,
    requestMic: 1,
    createdAt: Date.now(),
  }).run();

  const req = new Request("http://test/api/recorder/session", {
    method: "POST",
    body: JSON.stringify({ playtestId: "pt-1" }),
    headers: { "content-type": "application/json" },
  });
  const resp = await handler.POST(mockCtx(req));
  assertEquals(resp.status, 201);
  const body = await resp.json();
  assertEquals(typeof body.sessionId, "string");

  const pt = await db.select().from(playtests).where(eq(playtests.id, "pt-1")).get();
  assertEquals(pt?.availableSlots, 2);
});

Deno.test("Recorder session: returns 409 when no slots available", async () => {
  const db = resetDb(makeDb());
  await push(db);
  await db.insert(playtests).values({
    id: "pt-1",
    name: "Test",
    availableSlots: 0,
    requestMic: 1,
    createdAt: Date.now(),
  }).run();

  const req = new Request("http://test/api/recorder/session", {
    method: "POST",
    body: JSON.stringify({ playtestId: "pt-1" }),
    headers: { "content-type": "application/json" },
  });
  const resp = await handler.POST(mockCtx(req));
  assertEquals(resp.status, 409);
});

Deno.test("Recorder session: returns 404 for missing playtest", async () => {
  const db = resetDb(makeDb());
  await push(db);

  const req = new Request("http://test/api/recorder/session", {
    method: "POST",
    body: JSON.stringify({ playtestId: "nonexistent" }),
    headers: { "content-type": "application/json" },
  });
  const resp = await handler.POST(mockCtx(req));
  assertEquals(resp.status, 404);
});
