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

Deno.test("Playtest detail: GET returns 200 with playtest info", async () => {
  resetDb(":memory:");
  const db = resetDb(":memory:");
  await push(db);
  await db.insert(playtests).values({
    id: "pt-1",
    name: "My Playtest",
    availableSlots: 5,
    requestMic: 1,
    createdAt: Date.now(),
  }).run();

  const req = new Request("http://test/playtest/pt-1");
  const resp = await handler.GET(mockCtx(req, { id: "pt-1" }));
  assertEquals(resp.status, 200);
  const text = await resp.text();
  assertStringIncludes(text, "My Playtest");
  assertStringIncludes(text, "5");
  assertStringIncludes(text, "recorder.js");
});

Deno.test("Playtest detail: GET shows sessions when they exist", async () => {
  resetDb(":memory:");
  const db = resetDb(":memory:");
  await push(db);
  await db.insert(playtests).values({
    id: "pt-1",
    name: "Test",
    availableSlots: 3,
    requestMic: 1,
    createdAt: Date.now(),
  }).run();
  await db.insert(sessions).values({
    id: "s-1",
    playtestId: "pt-1",
    createdAt: Date.now(),
    status: "recording",
  }).run();
  await db.insert(sessions).values({
    id: "s-2",
    playtestId: "pt-1",
    createdAt: Date.now() - 10000,
    status: "finalized",
  }).run();

  const req = new Request("http://test/playtest/pt-1");
  const resp = await handler.GET(mockCtx(req, { id: "pt-1" }));
  assertEquals(resp.status, 200);
  const text = await resp.text();
  assertStringIncludes(text, "Sessions");
  assertStringIncludes(text, "recording");
  assertStringIncludes(text, "finalized");
});

Deno.test("Playtest detail: GET shows not found for missing ID", async () => {
  resetDb(":memory:");
  await push(resetDb(":memory:"));

  const req = new Request("http://test/playtest/missing");
  const resp = await handler.GET(mockCtx(req, { id: "missing" }));
  assertEquals(resp.status, 200);
  const text = await resp.text();
  assertStringIncludes(text, "not found");
});

Deno.test("Playtest detail: GET shows settings card with name, slots, mic", async () => {
  resetDb(":memory:");
  const db = resetDb(":memory:");
  await push(db);
  await db.insert(playtests).values({
    id: "pt-1",
    name: "My Game",
    availableSlots: 5,
    requestMic: 1,
    createdAt: Date.now(),
  }).run();

  const req = new Request("http://test/playtest/pt-1");
  const resp = await handler.GET(mockCtx(req, { id: "pt-1" }));
  assertEquals(resp.status, 200);
  const text = await resp.text();
  assertStringIncludes(text, "Settings");
  assertStringIncludes(text, "My Game");
  assertStringIncludes(text, "5");
  assertStringIncludes(text, "Save");
});

Deno.test("Playtest detail: POST updates name", async () => {
  resetDb(":memory:");
  const db = resetDb(":memory:");
  await push(db);
  await db.insert(playtests).values({
    id: "pt-1",
    name: "Old Name",
    availableSlots: 5,
    requestMic: 1,
    createdAt: Date.now(),
  }).run();

  const form = new FormData();
  form.set("name", "New Name");
  form.set("availableSlots", "5");
  form.set("requestMic", "on");
  const req = new Request("http://test/playtest/pt-1", {
    method: "POST",
    body: form,
  });
  const resp = await handler.POST(mockCtx(req, { id: "pt-1" }));
  assertEquals(resp.status, 303);

  const getResp = await handler.GET(mockCtx(
    new Request("http://test/playtest/pt-1"),
    { id: "pt-1" },
  ));
  const text = await getResp.text();
  assertStringIncludes(text, "New Name");
});

Deno.test("Playtest detail: POST updates availableSlots", async () => {
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

  const form = new FormData();
  form.set("availableSlots", "10");
  const req = new Request("http://test/playtest/pt-1", {
    method: "POST",
    body: form,
  });
  const resp = await handler.POST(mockCtx(req, { id: "pt-1" }));
  assertEquals(resp.status, 303);

  const getResp = await handler.GET(mockCtx(
    new Request("http://test/playtest/pt-1"),
    { id: "pt-1" },
  ));
  const text = await getResp.text();
  assertStringIncludes(text, "10");
});

Deno.test("Playtest detail: rejects unauthorized requests", async () => {
  const req = new Request("http://test/playtest/pt-1");
  const resp = await middleware(mockMiddlewareCtx(req));
  assertEquals(resp.status, 303);
});
