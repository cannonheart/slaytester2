import { assertEquals } from "$std/assert/mod.ts";
import { eq } from "drizzle-orm";
import "../../../lib/env.ts";
import { resetDb } from "../../../db/db.ts";
import { push } from "../../../db/push.ts";
import { playtests, sessions } from "../../../db/schema.ts";
import { handler, setRecordingsDir } from "./upload.ts";

const TMP = Deno.makeTempDirSync();

function mockCtx(req: Request) {
  return { req, url: new URL(req.url), state: {} } as any;
}

Deno.test("Recorder upload: writes chunk and updates chunkCount", async () => {
  setRecordingsDir(TMP);
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
  }).run();

  const form = new FormData();
  form.set("sessionId", "s-1");
  form.set("chunkIndex", "0");
  form.set("chunkTime", "1000");
  form.set("blob", new Blob(["video data"]));

  const req = new Request("http://test/api/recorder/upload", {
    method: "POST",
    body: form,
  });
  const resp = await handler.POST(mockCtx(req));
  assertEquals(resp.status, 200);

  const file = await Deno.readTextFile(`${TMP}/s-1/0.mp4`);
  assertEquals(file, "video data");

  const s = await db.select().from(sessions).where(eq(sessions.id, "s-1")).get();
  assertEquals(s?.chunkCount, 1);
});

Deno.test("Recorder upload: rejects non-existent session", async () => {
  setRecordingsDir(TMP);
  resetDb(":memory:");
  await push(resetDb(":memory:"));

  const form = new FormData();
  form.set("sessionId", "nonexistent");
  form.set("chunkIndex", "0");
  form.set("blob", new Blob(["data"]));

  const req = new Request("http://test/api/recorder/upload", {
    method: "POST",
    body: form,
  });
  const resp = await handler.POST(mockCtx(req));
  assertEquals(resp.status, 404);
});

Deno.test("Recorder upload: rejects path traversal in chunkIndex", async () => {
  const form = new FormData();
  form.set("sessionId", "s-1");
  form.set("chunkIndex", "../../etc/passwd");
  form.set("blob", new Blob(["x"]));

  const req = new Request("http://test/api/recorder/upload", {
    method: "POST",
    body: form,
  });
  const resp = await handler.POST(mockCtx(req));
  assertEquals(resp.status, 400);
});

Deno.test("Recorder upload: rejects negative chunkIndex", async () => {
  const form = new FormData();
  form.set("sessionId", "s-1");
  form.set("chunkIndex", "-1");
  form.set("blob", new Blob(["x"]));

  const req = new Request("http://test/api/recorder/upload", {
    method: "POST",
    body: form,
  });
  const resp = await handler.POST(mockCtx(req));
  assertEquals(resp.status, 400);
});

Deno.test("Recorder upload: rejects chunkIndex with decimals", async () => {
  const form = new FormData();
  form.set("sessionId", "s-1");
  form.set("chunkIndex", "1.5");
  form.set("blob", new Blob(["x"]));

  const req = new Request("http://test/api/recorder/upload", {
    method: "POST",
    body: form,
  });
  const resp = await handler.POST(mockCtx(req));
  assertEquals(resp.status, 400);
});

Deno.test("Recorder upload: rejects oversized chunk", async () => {
  const big = new Uint8Array(11 * 1024 * 1024);
  const form = new FormData();
  form.set("sessionId", "s-1");
  form.set("chunkIndex", "0");
  form.set("blob", new Blob([big]));

  const req = new Request("http://test/api/recorder/upload", {
    method: "POST",
    body: form,
  });
  const resp = await handler.POST(mockCtx(req));
  assertEquals(resp.status, 413);
});

Deno.test("Recorder upload: rejects invalid sessionId characters", async () => {
  const form = new FormData();
  form.set("sessionId", "../evil");
  form.set("chunkIndex", "0");
  form.set("blob", new Blob(["x"]));

  const req = new Request("http://test/api/recorder/upload", {
    method: "POST",
    body: form,
  });
  const resp = await handler.POST(mockCtx(req));
  assertEquals(resp.status, 400);
});
