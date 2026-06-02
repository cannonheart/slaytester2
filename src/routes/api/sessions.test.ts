import { assertEquals } from "$std/assert/mod.ts";
import "../../lib/env.ts";
import { resetDb } from "../../db/db.ts";
import { push } from "../../db/push.ts";
import { playtests, sessions } from "../../db/schema.ts";
import { handler } from "./sessions.ts";
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

Deno.test("Sessions API: lists sessions for a playtest", async () => {
  resetDb(DB);
  const db = resetDb(DB);
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
    createdAt: 100,
  }).run();
  await db.insert(sessions).values({
    id: "s-2",
    playtestId: "pt-1",
    createdAt: 200,
  }).run();

  const req = new Request("http://test/api/sessions?playtestId=pt-1");
  const resp = await handler.GET(mockCtx(req));
  assertEquals(resp.status, 200);
  const body = await resp.json();
  assertEquals(body.length, 2);
});

Deno.test("Sessions API: returns 400 when playtestId is missing", async () => {
  resetDb(DB);
  await push(resetDb(DB));

  const req = new Request("http://test/api/sessions");
  const resp = await handler.GET(mockCtx(req));
  assertEquals(resp.status, 400);
});

Deno.test("Sessions API: returns empty array when no sessions", async () => {
  resetDb(DB);
  await push(resetDb(DB));

  const req = new Request("http://test/api/sessions?playtestId=pt-empty");
  const resp = await handler.GET(mockCtx(req));
  assertEquals(resp.status, 200);
  const body = await resp.json();
  assertEquals(body.length, 0);
});

Deno.test("Sessions API: rejects unauthorized requests", async () => {
  const req = new Request("http://test/api/sessions?playtestId=x");
  const resp = await middleware(mockMiddlewareCtx(req));
  assertEquals(resp.status, 303);
});
