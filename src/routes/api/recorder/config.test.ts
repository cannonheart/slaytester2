import { assertEquals } from "$std/assert/mod.ts";
import "../../../lib/env.ts";
import { resetDb } from "../../../db/db.ts";
import { push } from "../../../db/push.ts";
import { playtests } from "../../../db/schema.ts";
import { handler } from "./config.ts";

function mockCtx(req: Request) {
  return { req, url: new URL(req.url), state: {} } as any;
}

Deno.test("Recorder config: returns availableSlots and requestMic", async () => {
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

  const req = new Request("http://test/api/recorder/config?playtestId=pt-1");
  const resp = await handler.GET(mockCtx(req));
  assertEquals(resp.status, 200);
  const body = await resp.json();
  assertEquals(body.availableSlots, 5);
  assertEquals(body.requestMic, 1);
  assertEquals(body.maxDurationMinutes, 60);
});

Deno.test("Recorder config: returns availableSlots 0 when slotless", async () => {
  resetDb(":memory:");
  const db = resetDb(":memory:");
  await push(db);
  await db.insert(playtests).values({
    id: "pt-1",
    name: "Test",
    availableSlots: 0,
    requestMic: 1,
    createdAt: Date.now(),
  }).run();

  const req = new Request("http://test/api/recorder/config?playtestId=pt-1");
  const resp = await handler.GET(mockCtx(req));
  assertEquals(resp.status, 200);
  const body = await resp.json();
  assertEquals(body.availableSlots, 0);
});

Deno.test("Recorder config: returns availableSlots 0 for missing playtest", async () => {
  resetDb(":memory:");
  await push(resetDb(":memory:"));

  const req = new Request("http://test/api/recorder/config?playtestId=nonexistent");
  const resp = await handler.GET(mockCtx(req));
  assertEquals(resp.status, 200);
  const body = await resp.json();
  assertEquals(body.availableSlots, 0);
});

Deno.test("Recorder config: returns 400 when playtestId missing", async () => {
  const req = new Request("http://test/api/recorder/config");
  const resp = await handler.GET(mockCtx(req));
  assertEquals(resp.status, 400);
});
