import { assertEquals } from "$std/assert/mod.ts";
import "../../lib/env.ts";
import { resetDb } from "../../db/db.ts";
import { push } from "../../db/push.ts";
import { playtests } from "../../db/schema.ts";
import { handler } from "./playtests.ts";
import { handler as middleware } from "../_middleware.ts";

const DB = ":memory:";

function mockCtx(req: Request) {
  return { req, url: new URL(req.url), state: {} } as any;
}

function mockMiddlewareCtx(req: Request) {
  return {
    req,
    url: new URL(req.url),
    state: {},
    next: () => Promise.resolve(new Response("ok", { status: 200 })),
  } as any;
}

Deno.test("Playtests API: creates a playtest", async () => {
  resetDb(DB);
  await push(resetDb(DB));

  const req = new Request("http://test/api/playtests", {
    method: "POST",
    body: JSON.stringify({ name: "Test Game", availableSlots: 5 }),
    headers: { "content-type": "application/json" },
  });
  const resp = await handler.POST(mockCtx(req));
  assertEquals(resp.status, 201);
  const body = await resp.json();
  assertEquals(body.name, "Test Game");
  assertEquals(body.availableSlots, 5);
  assertEquals(body.requestMic, 1);
});

Deno.test("Playtests API: returns 400 when name is missing", async () => {
  resetDb(DB);
  await push(resetDb(DB));

  const req = new Request("http://test/api/playtests", {
    method: "POST",
    body: JSON.stringify({ availableSlots: 5 }),
    headers: { "content-type": "application/json" },
  });
  const resp = await handler.POST(mockCtx(req));
  assertEquals(resp.status, 400);
});

Deno.test("Playtests API: lists playtests", async () => {
  resetDb(DB);
  const db = resetDb(DB);
  await push(db);

  await db.insert(playtests).values({
    id: "1",
    name: "First",
    availableSlots: 3,
    requestMic: 1,
    createdAt: 100,
  }).run();
  await db.insert(playtests).values({
    id: "2",
    name: "Second",
    availableSlots: 5,
    requestMic: 0,
    createdAt: 200,
  }).run();

  const resp = await handler.GET();
  assertEquals(resp.status, 200);
  const body = await resp.json();
  assertEquals(body.length, 2);
  assertEquals(body[0].name, "Second");
  assertEquals(body[1].name, "First");
});

Deno.test("Playtests API: returns 400 when name exceeds 200 characters", async () => {
  resetDb(DB);
  await push(resetDb(DB));

  const req = new Request("http://test/api/playtests", {
    method: "POST",
    body: JSON.stringify({ name: "x".repeat(201), availableSlots: 5 }),
    headers: { "content-type": "application/json" },
  });
  const resp = await handler.POST(mockCtx(req));
  assertEquals(resp.status, 400);
});

Deno.test("Playtests API: rejects unauthorized requests", async () => {
  const req = new Request("http://test/api/playtests");
  const resp = await middleware(mockMiddlewareCtx(req));
  assertEquals(resp.status, 303);
});
