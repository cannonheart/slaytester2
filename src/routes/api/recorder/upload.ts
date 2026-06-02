import { getDb } from "../../../db/db.ts";
import { sessions } from "../../../db/schema.ts";
import { eq } from "drizzle-orm";

const MAX_CHUNK_SIZE = (() => {
  const mb = Deno.env.get("MAX_CHUNK_SIZE_MB");
  if (!mb) throw new Error("MAX_CHUNK_SIZE_MB env var is required");
  return parseInt(mb, 10) * 1024 * 1024;
})();

const MAX_DURATION_MS = (() => {
  const min = Deno.env.get("RECORDING_MAX_DURATION_MINUTES");
  if (!min) throw new Error("RECORDING_MAX_DURATION_MINUTES env var is required");
  return parseInt(min, 10) * 60 * 1000;
})();

const MAX_CHUNKS = (() => {
  const v = Deno.env.get("RECORDING_MAX_CHUNKS");
  if (!v) throw new Error("RECORDING_MAX_CHUNKS env var is required");
  return parseInt(v, 10);
})();

const SESSION_ID_RE = /^[a-zA-Z0-9_-]+$/;

let _recordingsDir: string | null = null;

function getRecordingsDir(): string {
  if (!_recordingsDir) {
    _recordingsDir = new URL("../../../../data/recordings", import.meta.url).pathname;
  }
  return _recordingsDir;
}

export function setRecordingsDir(dir: string) {
  _recordingsDir = dir;
}

export const handler = {
  async POST(ctx: any) {
    const form = await ctx.req.formData();
    const sessionId = form.get("sessionId") as string;
    const chunkIndex = form.get("chunkIndex") as string;
    const blob = form.get("blob") as Blob;

    if (!sessionId || chunkIndex == null || !blob) {
      return Response.json({ error: "sessionId, chunkIndex, and blob are required" }, { status: 400 });
    }

    if (!SESSION_ID_RE.test(sessionId)) {
      return Response.json({ error: "Invalid sessionId" }, { status: 400 });
    }

    const index = Number(chunkIndex);
    if (!Number.isInteger(index) || index < 0 || String(index) !== chunkIndex) {
      return Response.json({ error: "chunkIndex must be a non-negative integer" }, { status: 400 });
    }

    if (blob.size > MAX_CHUNK_SIZE) {
      return Response.json({ error: "Chunk exceeds maximum size of " + MAX_CHUNK_SIZE / (1024 * 1024) + "MB" }, { status: 413 });
    }

    const db = await getDb();
    const session = await db.select().from(sessions).where(eq(sessions.id, sessionId)).get();
    if (!session) {
      return Response.json({ error: "Session not found" }, { status: 404 });
    }

    if (Date.now() - session.createdAt > MAX_DURATION_MS) {
      return Response.json({ error: "Recording time limit exceeded" }, { status: 403 });
    }

    if ((session.chunkCount ?? 0) >= MAX_CHUNKS) {
      return Response.json({ error: "Recording time limit exceeded" }, { status: 403 });
    }

    const dir = `${getRecordingsDir()}/${sessionId}`;
    await Deno.mkdir(dir, { recursive: true });

    const bytes = await blob.bytes();
    await Deno.writeFile(`${dir}/${index}.mp4`, new Uint8Array(bytes));

    const newCount = (session.chunkCount ?? 0) + 1;
    await db.update(sessions)
      .set({ chunkCount: newCount })
      .where(eq(sessions.id, sessionId))
      .run();

    return new Response(null, { status: 200 });
  },
};
