import { mergeToFile } from "../../lib/mp4.ts";

const SESSION_ID_RE = /^[a-zA-Z0-9_-]+$/;

let _recordingsDir: string | null = null;

function getRecordingsDir(): string {
  if (!_recordingsDir) {
    _recordingsDir = new URL("../../../data/recordings", import.meta.url).pathname;
  }
  return _recordingsDir;
}

export function setRecordingsDir(dir: string) {
  _recordingsDir = dir;
}

export const handler = {
  async GET(ctx: any) {
    const sessionId = ctx.url.searchParams.get("sessionId");
    if (!sessionId) {
      return Response.json({ error: "sessionId is required" }, { status: 400 });
    }

    if (!SESSION_ID_RE.test(sessionId)) {
      return Response.json({ error: "Invalid sessionId" }, { status: 400 });
    }

    const dir = `${getRecordingsDir()}/${sessionId}`;

    let fileNames: string[];
    try {
      fileNames = [];
      for await (const entry of Deno.readDir(dir)) {
        if (entry.isFile && entry.name.endsWith(".mp4")) {
          fileNames.push(entry.name);
        }
      }
    } catch (e) {
      console.error(`[Slaytester] Failed to read chunks for session ${sessionId}:`, e);
      return Response.json({ error: "Session not found" }, { status: 404 });
    }

    if (fileNames.length === 0) {
      return Response.json({ error: "No chunks found" }, { status: 404 });
    }

    fileNames.sort((a, b) => {
      const ai = parseInt(a, 10);
      const bi = parseInt(b, 10);
      return ai - bi;
    });

    const firstChunk = await Deno.readFile(`${dir}/${fileNames[0]}`);
    const lastChunk = await Deno.readFile(`${dir}/${fileNames[fileNames.length - 1]}`);

    async function* readMid(): AsyncIterable<Uint8Array> {
      for (let i = 1; i < fileNames.length - 1; i++) {
        yield await Deno.readFile(`${dir}/${fileNames[i]}`);
      }
    }

    // Write merged output to temp file so we can serve with Content-Length
    const tmpPath = await Deno.makeTempFile({ suffix: ".mp4" });
    const tmpFile = await Deno.open(tmpPath, { write: true });
    try {
      await mergeToFile(tmpFile, firstChunk, lastChunk, readMid());
      tmpFile.close();

      const stat = await Deno.stat(tmpPath);
      const file = await Deno.open(tmpPath);

      // Remove before returning — the open fd keeps the inode alive until
      // the response stream is consumed. If the client disconnects, the
      // fd closes and the temp file is cleaned up by the OS.
      Deno.remove(tmpPath);

      return new Response(file.readable, {
        headers: {
          "Content-Type": "video/mp4",
          "Content-Length": String(stat.size),
          "Accept-Ranges": "bytes",
        },
      });
    } catch (err) {
      Deno.remove(tmpPath).catch(() => {});
      throw err;
    }
  },
};
