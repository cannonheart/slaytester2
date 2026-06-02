import { assertEquals, assertStringIncludes } from "$std/assert/mod.ts";
import { render } from "preact-render-to-string";
import "../lib/env.ts";
import { handler } from "./login.tsx";
import { resetAuthRateLimits } from "../lib/auth.ts";

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

Deno.test("Login: GET returns 200 with login form", async () => {
  resetAuthRateLimits();
  const req = new Request("http://test/login");
  const resp = await handler.GET(mockCtx(req));
  assertEquals(resp.status, 200);
  const text = await resp.text();
  assertStringIncludes(text, "Slaytester 2");
  assertStringIncludes(text, "Admin Token");
  assertStringIncludes(text, "form");
});

Deno.test("Login: POST with correct token sets cookie and redirects to /", async () => {
  resetAuthRateLimits();
  const form = new FormData();
  form.set("token", "dev");
  const req = new Request("http://test/login", {
    method: "POST",
    body: form,
  });
  const resp = await handler.POST(mockCtx(req));
  assertEquals(resp.status, 303);
  assertEquals(resp.headers.get("location"), "/");
  const cookie = resp.headers.get("set-cookie") ?? "";
  assertStringIncludes(cookie, "token=dev");
  assertStringIncludes(cookie, "HttpOnly");
  assertStringIncludes(cookie, "Path=/");
});

Deno.test("Login: POST with empty token returns 400", async () => {
  resetAuthRateLimits();
  const form = new FormData();
  form.set("token", "");
  const req = new Request("http://test/login", {
    method: "POST",
    body: form,
  });
  const resp = await handler.POST(mockCtx(req));
  assertEquals(resp.status, 400);
});

Deno.test("Login: POST with wrong token returns 200 with error", async () => {
  resetAuthRateLimits();
  const form = new FormData();
  form.set("token", "wrong-token");
  const req = new Request("http://test/login", {
    method: "POST",
    body: form,
  });
  const resp = await handler.POST(mockCtx(req));
  assertEquals(resp.status, 200);
  const text = await resp.text();
  assertStringIncludes(text, "Invalid");
});

Deno.test("Login: rate limits after 5 failed attempts", async () => {
  resetAuthRateLimits();
  const form = () => {
    const f = new FormData();
    f.set("token", "wrong-token");
    return f;
  };

  for (let i = 0; i < 5; i++) {
    const req = new Request("http://test/login", {
      method: "POST",
      body: form(),
    });
    const resp = await handler.POST(mockCtx(req));
    assertEquals(resp.status, 200);
  }

  // 6th attempt should be rate limited
  const req = new Request("http://test/login", {
    method: "POST",
    body: form(),
  });
  const resp = await handler.POST(mockCtx(req));
  assertEquals(resp.status, 429);
});


