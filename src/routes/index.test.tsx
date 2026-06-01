import { assertEquals, assertStringIncludes } from "$std/assert/mod.ts";
import { render } from "preact-render-to-string";
import "../lib/env.ts";
import { resetDb } from "../db/db.ts";
import { push } from "../db/push.ts";
import { playtests } from "../db/schema.ts";
import { handler } from "./index.tsx";
import { handler as middleware } from "./_middleware.ts";

function mockCtx(req: Request) {
  return {
    req,
    url: new URL(req.url),
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

Deno.test("Index: GET returns 200 with create form and empty list", async () => {
  resetDb(":memory:");
  await push(resetDb(":memory:"));

  const req = new Request("http://test/");
  const resp = await handler.GET!(mockCtx(req));
  assertEquals(resp.status, 200);
  const text = await resp.text();
  assertStringIncludes(text, "Slaytester 2");
  assertStringIncludes(text, "name");
  assertStringIncludes(text, "availableSlots");
  assertStringIncludes(text, "Create");
});

Deno.test("Index: POST with valid data creates playtest and redirects", async () => {
  resetDb(":memory:");
  await push(resetDb(":memory:"));

  const form = new FormData();
  form.set("name", "New Game");
  form.set("availableSlots", "10");
  const req = new Request("http://test/", {
    method: "POST",
    body: form,
  });
  const resp = await handler.POST!(mockCtx(req));
  assertEquals(resp.status, 303);
  assertEquals(resp.headers.get("location"), "/");
});

Deno.test("Index: created playtest appears in list", async () => {
  resetDb(":memory:");
  const db = resetDb(":memory:");
  await push(db);

  await db.insert(playtests).values({
    id: "pt-1",
    name: "Existing Game",
    availableSlots: 5,
    requestMic: 1,
    createdAt: Date.now(),
  }).run();

  const req = new Request("http://test/");
  const resp = await handler.GET!(mockCtx(req));
  assertEquals(resp.status, 200);
  const text = await resp.text();
  assertStringIncludes(text, "Existing Game");
  assertStringIncludes(text, "5");
});

Deno.test("Index: POST with missing fields shows error", async () => {
  resetDb(":memory:");
  await push(resetDb(":memory:"));

  const form = new FormData();
  form.set("name", "");
  form.set("availableSlots", "");
  const req = new Request("http://test/", {
    method: "POST",
    body: form,
  });
  const resp = await handler.POST!(mockCtx(req));
  assertEquals(resp.status, 200);
  const text = await resp.text();
  assertStringIncludes(text, "required");
});

Deno.test("Index: rejects unauthorized requests", async () => {
  const req = new Request("http://test/");
  const resp = await middleware(mockMiddlewareCtx(req));
  assertEquals(resp.status, 303);
});
