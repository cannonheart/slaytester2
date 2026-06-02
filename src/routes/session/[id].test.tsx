import { assertEquals, assertStringIncludes } from "$std/assert/mod.ts";
import { render } from "preact-render-to-string";
import "../../lib/env.ts";
import { resetDb } from "../../db/db.ts";
import { push } from "../../db/push.ts";
import { playtests, sessions } from "../../db/schema.ts";
import { handler } from "./[id].tsx";
import { handler as middleware } from "../_middleware.ts";

function mockCtx(req: Request, params?: Record<string, string>) {
  return {
    req,
    url: new URL(req.url),
    params: params ?? {},
    state: {},
    render: (vnode: any) => {
      const body = render(vnode);
      return new Response(body, { headers: { "content-type": "text/html" } });
    },
  } as any;
}

function mockMiddlewareCtx(req: Request) {
  return {
    req,
    url: new URL(req.url),
    state: {},
    next: () => Promise.resolve(new Response("ok", { status: 200 })),
  } as any;
}

Deno.test("Session page: GET returns 200 with video player", async () => {
  resetDb(":memory:");
  const db = resetDb(":memory:");
  await push(db);
  await db.insert(playtests).values({
    id: "pt-1",
    name: "Test Game",
    availableSlots: 5,
    requestMic: 1,
    createdAt: Date.now(),
  }).run();
  await db.insert(sessions).values({
    id: "s-1",
    playtestId: "pt-1",
    createdAt: Date.now(),
  }).run();

  const req = new Request("http://test/session/s-1");
  const resp = await handler.GET(mockCtx(req, { id: "s-1" }));
  assertEquals(resp.status, 200);
  const text = await resp.text();
  assertStringIncludes(text, "Test Game");
  assertStringIncludes(text, "video");
  assertStringIncludes(text, "api/stream?sessionId=s-1");
  assertStringIncludes(text, "controls");
});

Deno.test("Session page: shows finalized status", async () => {
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
    status: "finalized",
  }).run();

  const req = new Request("http://test/session/s-1");
  const resp = await handler.GET(mockCtx(req, { id: "s-1" }));
  assertEquals(resp.status, 200);
  const text = await resp.text();
  assertStringIncludes(text, "finalized");
});

Deno.test("Session page: returns 404 for missing session", async () => {
  resetDb(":memory:");
  await push(resetDb(":memory:"));

  const req = new Request("http://test/session/missing");
  const resp = await handler.GET(mockCtx(req, { id: "missing" }));
  assertEquals(resp.status, 200);
  const text = await resp.text();
  assertStringIncludes(text, "not found");
});

Deno.test("Session page: rejects unauthorized requests", async () => {
  const req = new Request("http://test/session/s-1");
  const resp = await middleware(mockMiddlewareCtx(req));
  assertEquals(resp.status, 303);
});
