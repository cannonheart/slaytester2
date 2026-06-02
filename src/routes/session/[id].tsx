import { getDb } from "../../db/db.ts";
import { playtests, sessions } from "../../db/schema.ts";
import { eq } from "drizzle-orm";
import { computeDurationFromChunks } from "../../lib/mp4.ts";

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function page(session: any, playtestName: string, duration: number) {
  return (
    <div class="min-h-screen bg-gray-50">
      <div class="max-w-4xl mx-auto p-8">
        <a href={`/playtest/${session.playtestId}`} class="text-blue-500 hover:underline text-sm mb-4 inline-block">
          &larr; Back to Playtest
        </a>

        <h1 class="text-4xl font-bold mb-2">{playtestName}</h1>
        <p class="text-sm text-gray-500 mb-8">
          Session {session.id.slice(0, 8)} &middot;{" "}
          {formatDuration(duration)} &middot;{" "}
          {formatDate(session.createdAt)}
        </p>

        <div class="bg-black rounded-2xl overflow-hidden mb-8">
          <video
            controls
            class="w-full max-h-[70vh]"
            src={`/api/stream?sessionId=${session.id}`}
          >
            Your browser does not support the video element.
          </video>
        </div>
      </div>
    </div>
  );
}

function notFound() {
  return (
    <div class="min-h-screen bg-gray-50 flex items-center justify-center">
      <div class="text-center">
        <h1 class="text-4xl font-bold mb-4">Session not found</h1>
        <a href="/" class="text-blue-500 hover:underline">Back to Dashboard</a>
      </div>
    </div>
  );
}

const RECORDINGS_DIR = new URL("../../../data/recordings", import.meta.url).pathname;

export const handler = {
  async GET(ctx: any) {
    const { id } = ctx.params;
    const db = await getDb();
    const session = await db.select().from(sessions).where(eq(sessions.id, id)).get();
    if (!session) return ctx.render(notFound());

    const pt = await db.select().from(playtests).where(eq(playtests.id, session.playtestId)).get();
    const name = pt?.name ?? "Unknown Playtest";

    // Compute duration from the first and last chunk
    let duration = 0;
    try {
      const dir = `${RECORDINGS_DIR}/${id}`;
      const files: string[] = [];
      for await (const e of Deno.readDir(dir)) {
        if (e.isFile && e.name.endsWith(".mp4")) files.push(e.name);
      }
      if (files.length >= 2) {
        files.sort((a, b) => parseInt(a) - parseInt(b));
        const first = await Deno.readFile(`${dir}/${files[0]}`);
        const last = await Deno.readFile(`${dir}/${files[files.length - 1]}`);
        duration = computeDurationFromChunks(first, last);
      }
    } catch (e) {
      console.error(`[Slaytester] Failed to read chunks for session ${id}:`, e);
    }

    return ctx.render(page(session, name, duration));
  },
};
