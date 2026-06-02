import { mergeToStream } from "../../lib/mp4.ts";

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
    } catch {
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

    const chunks: Uint8Array[] = [];
    for (const name of fileNames) {
      const data = await Deno.readFile(`${dir}/${name}`);
      chunks.push(data);
    }

    const stream = new ReadableStream({
      async start(controller) {
        await mergeToStream(chunks, controller);
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "video/mp4" },
    });
  },
};
