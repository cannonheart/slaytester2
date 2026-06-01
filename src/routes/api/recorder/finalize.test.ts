import { assertEquals } from "$std/assert/mod.ts";
import { eq } from "drizzle-orm";
import "../../../lib/env.ts";
import { resetDb } from "../../../db/db.ts";
import { push } from "../../../db/push.ts";
import { playtests, sessions } from "../../../db/schema.ts";
import { handler } from "./finalize.ts";

function mockCtx(req: Request) {
  return { req, url: new URL(req.url), state: {} } as any;
}

Deno.test("Recorder finalize: marks session as finalized", async () => {
  resetDb(":memory:");
  const db = resetDb(":memory:");
  await push(db);
  await db.insert(playtests).values({
    id: "pt-1",
    name: "Test",
    availableSlots: 5,
    requestMic: 1,
    createdAt: Date.now(),
  }).run();
  await db.insert(sessions).values({
    id: "s-1",
    playtestId: "pt-1",
    createdAt: Date.now(),
  }).run();

  const req = new Request("http://test/api/recorder/finalize", {
    method: "POST",
    body: JSON.stringify({ sessionId: "s-1" }),
    headers: { "content-type": "application/json" },
  });
  const resp = await handler.POST(mockCtx(req));
  assertEquals(resp.status, 200);

  const s = await db.select().from(sessions).where(eq(sessions.id, "s-1")).get();
  assertEquals(s?.status, "finalized");
});

Deno.test("Recorder finalize: returns 404 for non-existent session", async () => {
  resetDb(":memory:");
  await push(resetDb(":memory:"));

  const req = new Request("http://test/api/recorder/finalize", {
    method: "POST",
    body: JSON.stringify({ sessionId: "nonexistent" }),
    headers: { "content-type": "application/json" },
  });
  const resp = await handler.POST(mockCtx(req));
  assertEquals(resp.status, 404);
});
