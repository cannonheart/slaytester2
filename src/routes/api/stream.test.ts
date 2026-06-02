import { assertEquals, assertStringIncludes } from "$std/assert/mod.ts";
import "../../lib/env.ts";
import { handler, setRecordingsDir } from "./stream.ts";
import { handler as middleware } from "../_middleware.ts";

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

const FIXTURE = Deno.readFileSync(new URL("../../testdata/chunk.mp4", import.meta.url));

function makeSessionDir(sessionId: string, files: number): { base: string; sessionId: string } {
  const base = Deno.makeTempDirSync();
  const sessionDir = `${base}/${sessionId}`;
  Deno.mkdirSync(sessionDir, { recursive: true });
  for (let i = 0; i < files; i++) {
    Deno.writeFileSync(`${sessionDir}/${i}.mp4`, FIXTURE);
  }
  return { base, sessionId };
}

Deno.test("Stream API: returns 200 with merged video", async () => {
  const { base, sessionId } = makeSessionDir("s-1", 3);
  setRecordingsDir(base);

  const req = new Request(`http://test/api/stream?sessionId=${sessionId}`);
  const resp = await handler.GET(mockCtx(req));
  assertEquals(resp.status, 200);
  assertEquals(resp.headers.get("content-type"), "video/mp4");

  const body = await resp.arrayBuffer();
  assertEquals(body.byteLength > FIXTURE.length, true);
});

Deno.test("Stream API: returns 404 for empty directory", async () => {
  const dir = Deno.makeTempDirSync();
  setRecordingsDir(dir);

  const req = new Request("http://test/api/stream?sessionId=empty");
  const resp = await handler.GET(mockCtx(req));
  assertEquals(resp.status, 404);
});

Deno.test("Stream API: returns 404 for non-existent session", async () => {
  const dir = Deno.makeTempDirSync();
  setRecordingsDir(dir);

  const req = new Request("http://test/api/stream?sessionId=nonexistent");
  const resp = await handler.GET(mockCtx(req));
  assertEquals(resp.status, 404);
});

Deno.test("Stream API: returns 400 when sessionId missing", async () => {
  const req = new Request("http://test/api/stream");
  const resp = await handler.GET(mockCtx(req));
  assertEquals(resp.status, 400);
});

Deno.test("Stream API: rejects path traversal in sessionId", async () => {
  const req = new Request("http://test/api/stream?sessionId=../../etc");
  const resp = await handler.GET(mockCtx(req));
  assertEquals(resp.status, 400);
});

Deno.test("Stream API: rejects unauthorized requests", async () => {
  const req = new Request("http://test/api/stream?sessionId=x");
  const resp = await middleware(mockMiddlewareCtx(req));
  assertEquals(resp.status, 303);
});
