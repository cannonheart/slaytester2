import { assertEquals } from "$std/assert/mod.ts";
import "../../../lib/env.ts";
import { resetDb } from "../../../db/db.ts";
import { push } from "../../../db/push.ts";
import { playtests } from "../../../db/schema.ts";
import { handler } from "./[id].ts";
import { handler as middleware } from "../../_middleware.ts";

const DB = ":memory:";

function mockCtx(req: Request, params?: Record<string, string>) {
  return { req, url: new URL(req.url), params: params ?? {}, state: {} } as any;
}

function mockMiddlewareCtx(req: Request) {
  return {
    req,
    url: new URL(req.url),
    state: {},
    next: () => Promise.resolve(new Response("ok", { status: 200 })),
  } as any;
}

Deno.test("Playtest detail API: updates availableSlots", async () => {
  resetDb(DB);
  const db = resetDb(DB);
  await push(db);
  await db.insert(playtests).values({
    id: "test-id",
    name: "Test",
    availableSlots: 5,
    requestMic: 1,
    createdAt: Date.now(),
  }).run();

  const req = new Request("http://test/api/playtests/test-id", {
    method: "PATCH",
    body: JSON.stringify({ availableSlots: 3 }),
    headers: { "content-type": "application/json" },
  });
  const resp = await handler.PATCH(mockCtx(req, { id: "test-id" }));
  assertEquals(resp.status, 200);
  const body = await resp.json();
  assertEquals(body.availableSlots, 3);
  assertEquals(body.requestMic, 1);
});

Deno.test("Playtest detail API: updates requestMic", async () => {
  resetDb(DB);
  const db = resetDb(DB);
  await push(db);
  await db.insert(playtests).values({
    id: "test-id",
    name: "Test",
    availableSlots: 5,
    requestMic: 1,
    createdAt: Date.now(),
  }).run();

  const req = new Request("http://test/api/playtests/test-id", {
    method: "PATCH",
    body: JSON.stringify({ requestMic: false }),
    headers: { "content-type": "application/json" },
  });
  const resp = await handler.PATCH(mockCtx(req, { id: "test-id" }));
  assertEquals(resp.status, 200);
  const body = await resp.json();
  assertEquals(body.requestMic, 0);
});

Deno.test("Playtest detail API: returns 404 for missing playtest", async () => {
  resetDb(DB);
  await push(resetDb(DB));

  const req = new Request("http://test/api/playtests/nonexistent", {
    method: "PATCH",
    body: JSON.stringify({ availableSlots: 3 }),
    headers: { "content-type": "application/json" },
  });
  const resp = await handler.PATCH(mockCtx(req, { id: "nonexistent" }));
  assertEquals(resp.status, 404);
});

Deno.test("Playtest detail API: rejects unauthorized requests", async () => {
  const req = new Request("http://test/api/playtests/test-id");
  const resp = await middleware(mockMiddlewareCtx(req));
  assertEquals(resp.status, 303);
});
