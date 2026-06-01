import { assertEquals } from "$std/assert/mod.ts";
import "./env.ts";
import { checkToken, isAuthorized } from "./auth.ts";

const CORRECT_TOKEN = "dev";

Deno.test("Auth: checkToken returns true for correct token", () => {
  assertEquals(checkToken(CORRECT_TOKEN), true);
});

Deno.test("Auth: checkToken returns false for wrong token", () => {
  assertEquals(checkToken("wrong-token"), false);
});

Deno.test("Auth: checkToken returns false for empty string", () => {
  assertEquals(checkToken(""), false);
});

Deno.test("Auth: isAuthorized checks header", () => {
  const req = new Request("http://test/", {
    headers: { "admin-token": CORRECT_TOKEN },
  });
  assertEquals(isAuthorized(req), true);
});

Deno.test("Auth: isAuthorized checks cookie", () => {
  const req = new Request("http://test/", {
    headers: { "cookie": "token=dev" },
  });
  assertEquals(isAuthorized(req), true);
});

Deno.test("Auth: isAuthorized checks query param", () => {
  const req = new Request("http://test/?token=dev");
  assertEquals(isAuthorized(req), true);
});

Deno.test("Auth: isAuthorized returns false with no auth", () => {
  const req = new Request("http://test/");
  assertEquals(isAuthorized(req), false);
});

Deno.test("Auth: isAuthorized returns false for wrong cookie value", () => {
  const req = new Request("http://test/", {
    headers: { "cookie": "token=wrong" },
  });
  assertEquals(isAuthorized(req), false);
});
