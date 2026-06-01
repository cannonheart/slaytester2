import { assertEquals } from "$std/assert/mod.ts";
import "./env.ts";

Deno.test("Env: loads ADMIN_TOKEN from .env", () => {
  const token = Deno.env.get("ADMIN_TOKEN");
  assertEquals(typeof token, "string");
  assertEquals(token!.length > 0, true);
});
