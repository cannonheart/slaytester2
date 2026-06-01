import { assertEquals } from "$std/assert/mod.ts";
import { handler } from "./health.ts";

Deno.test("Health: returns 200 with status ok", async () => {
  const req = new Request("http://test/api/health");
  const res = await handler.GET(req, {} as any);
  assertEquals(res.status, 200);
  assertEquals(await res.json(), { status: "ok" });
});
