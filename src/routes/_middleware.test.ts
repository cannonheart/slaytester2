import { assertEquals } from "$std/assert/mod.ts";
import "../lib/env.ts";
import { resetAuthRateLimits } from "../lib/auth.ts";
import { handler } from "./_middleware.ts";

function mockCtx(
  req: Request,
  options?: { nextStatus?: number },
) {
  return {
    req,
    next: () =>
      Promise.resolve(new Response("ok", { status: options?.nextStatus ?? 200 })),
    url: new URL(req.url),
    state: {},
  } as any;
}

function mockCtxWithIp(
  req: Request,
  ip: string,
  options?: { nextStatus?: number },
) {
  const r = new Request(req.url, {
    method: req.method,
    headers: { "x-forwarded-for": ip, ...Object.fromEntries(req.headers) },
    body: req.body,
  });
  return {
    req: r,
    next: () =>
      Promise.resolve(new Response("ok", { status: options?.nextStatus ?? 200 })),
    url: new URL(r.url),
    state: {},
  } as any;
}

Deno.test("Middleware: allows public /api/recorder/ paths without token", async () => {
  resetAuthRateLimits();
  const req = new Request("http://test/api/recorder/config?playtestId=x");
  const resp = await handler(mockCtx(req));
  assertEquals(resp.status, 200);
});

Deno.test("Middleware: allows public /recorder.js without token", async () => {
  const req = new Request("http://test/recorder.js");
  const resp = await handler(mockCtx(req));
  assertEquals(resp.status, 200);
});

Deno.test("Middleware: allows public /login without token", async () => {
  const req = new Request("http://test/login");
  const resp = await handler(mockCtx(req));
  assertEquals(resp.status, 200);
});

Deno.test("Middleware: blocks /dashboard without token", async () => {
  resetAuthRateLimits();
  const req = new Request("http://test/");
  const resp = await handler(mockCtx(req));
  assertEquals(resp.status, 303);
});

Deno.test("Middleware: blocks /playtest/xyz without token", async () => {
  resetAuthRateLimits();
  const req = new Request("http://test/playtest/xyz");
  const resp = await handler(mockCtx(req));
  assertEquals(resp.status, 303);
});

Deno.test("Middleware: blocks /session/xyz without token", async () => {
  resetAuthRateLimits();
  const req = new Request("http://test/session/xyz");
  const resp = await handler(mockCtx(req));
  assertEquals(resp.status, 303);
});

Deno.test("Middleware: blocks /api/stream without token", async () => {
  resetAuthRateLimits();
  const req = new Request("http://test/api/stream?sessionId=x");
  const resp = await handler(mockCtx(req));
  assertEquals(resp.status, 303);
});

Deno.test("Middleware: allows / with valid token cookie", async () => {
  resetAuthRateLimits();
  const req = new Request("http://test/", {
    headers: { "cookie": "token=dev" },
  });
  const resp = await handler(mockCtx(req));
  assertEquals(resp.status, 200);
});

Deno.test("Middleware: allows / with valid token header", async () => {
  resetAuthRateLimits();
  const req = new Request("http://test/", {
    headers: { "admin-token": "dev" },
  });
  const resp = await handler(mockCtx(req));
  assertEquals(resp.status, 200);
});

Deno.test("Middleware: blocks / with wrong token cookie", async () => {
  resetAuthRateLimits();
  const req = new Request("http://test/", {
    headers: { "cookie": "token=wrong" },
  });
  const resp = await handler(mockCtx(req));
  assertEquals(resp.status, 303);
});

Deno.test("Middleware: handles OPTIONS with CORS headers", async () => {
  const req = new Request("http://test/api/recorder/config", {
    method: "OPTIONS",
  });
  const resp = await handler(mockCtx(req));
  assertEquals(resp.status, 200);
  assertEquals(resp.headers.get("access-control-allow-origin"), "*");
});

Deno.test("Middleware: adds CORS headers to API responses", async () => {
  const req = new Request("http://test/api/recorder/config");
  const resp = await handler(mockCtx(req));
  assertEquals(resp.status, 200);
  assertEquals(resp.headers.get("access-control-allow-origin"), "*");
});
