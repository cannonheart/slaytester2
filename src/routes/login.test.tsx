import { assertEquals, assertStringIncludes } from "$std/assert/mod.ts";
import "../lib/env.ts";
import { handler } from "./login.tsx";

Deno.test("Login: GET returns 200 with login form", async () => {
  const req = new Request("http://test/login");
  const resp = await handler.GET(req, {} as any);
  assertEquals(resp.status, 200);
  const text = await resp.text();
  assertStringIncludes(text, "token");
  assertStringIncludes(text, "form");
});

Deno.test("Login: POST with correct token sets cookie and redirects to /", async () => {
  const form = new FormData();
  form.set("token", "dev");
  const req = new Request("http://test/login", {
    method: "POST",
    body: form,
  });
  const resp = await handler.POST(req, {} as any);
  assertEquals(resp.status, 303);
  assertEquals(resp.headers.get("location"), "/");
  const cookie = resp.headers.get("set-cookie") ?? "";
  assertStringIncludes(cookie, "token=dev");
  assertStringIncludes(cookie, "HttpOnly");
  assertStringIncludes(cookie, "Path=/");
});

Deno.test("Login: POST with empty token returns 400", async () => {
  const form = new FormData();
  form.set("token", "");
  const req = new Request("http://test/login", {
    method: "POST",
    body: form,
  });
  const resp = await handler.POST(req, {} as any);
  assertEquals(resp.status, 400);
});

Deno.test("Login: POST with wrong token returns 200 with error", async () => {
  const form = new FormData();
  form.set("token", "wrong-token");
  const req = new Request("http://test/login", {
    method: "POST",
    body: form,
  });
  const resp = await handler.POST(req, {} as any);
  assertEquals(resp.status, 200);
  const text = await resp.text();
  assertStringIncludes(text, "Invalid");
});
