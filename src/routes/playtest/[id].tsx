import { getDb } from "../../db/db.ts";
import { playtests as ptTable, sessions as sTable } from "../../db/schema.ts";
import { eq, desc } from "drizzle-orm";
import { Checkbox } from "../../components/Checkbox.tsx";

function Page({ pt, sessions, base }: { pt: any; sessions: any[]; base: string }) {
  return (
    <div class="min-h-screen bg-gray-50">
      <div class="max-w-4xl mx-auto p-8">
        <a href="/" class="text-blue-500 hover:underline text-sm mb-4 inline-block">
          &larr; Back to Dashboard
        </a>

        <div class="bg-white p-6 rounded-2xl shadow-sm border mb-8">
          <h2 class="text-lg font-bold mb-4">Settings</h2>
          <form method="POST" class="flex gap-4 items-end">
            <div class="flex-1">
              <label class="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text" name="name"
                value={pt.name}
                class="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-gray-500 w-full"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Slots</label>
              <input
                type="number" name="availableSlots"
                value={pt.availableSlots} min="0"
                class="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-gray-500 w-20"
              />
            </div>
            <div class="pb-1">
              <Checkbox name="requestMic" checked={pt.requestMic === 1} label="Request mic" />
            </div>
            <button
              type="submit"
              class="bg-black text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-800"
            >
              Save
            </button>
          </form>
        </div>

        <div class="bg-white p-6 rounded-2xl shadow-sm border mb-8">
          <h2 class="text-lg font-bold mb-4">Embed Code</h2>
          <pre class="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
{`<script src="${base}/recorder.js" data-playtest-id="${pt.id}"></script>`}
          </pre>
        </div>

        <div class="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <h2 class="text-lg font-bold px-6 py-4 border-b">Sessions</h2>
          {sessions.length === 0
            ? <p class="text-gray-500 px-6 py-8 text-center">No sessions yet.</p>
            : (
              <table class="w-full">
                <thead>
                  <tr class="border-b">
                    <th class="text-left px-6 py-3 text-sm font-medium text-gray-500">Chunks</th>
                    <th class="text-left px-6 py-3 text-sm font-medium text-gray-500">Created</th>
                    <th class="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s) => (
                    <tr class="border-b last:border-b-0">
                      <td class="px-6 py-4 text-sm text-gray-500">{s.chunkCount ?? 0}</td>
                      <td class="px-6 py-4 text-sm text-gray-500">
                        {new Date(s.createdAt).toLocaleDateString("en-US", {
                          year: "numeric", month: "short", day: "numeric",
                        })}
                      </td>
                      <td class="px-6 py-4 text-right">
                        <a href={`/session/${s.id}`} class="text-blue-500 hover:underline text-sm">
                          Watch
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </div>
      </div>
    </div>
  );
}

function notFound() {
  return (
    <div class="min-h-screen bg-gray-50 flex items-center justify-center">
      <div class="text-center">
        <h1 class="text-4xl font-bold mb-4">Playtest not found</h1>
        <a href="/" class="text-blue-500 hover:underline">Back to Dashboard</a>
      </div>
    </div>
  );
}

export const handler = {
  async GET(ctx: any) {
    const { id } = ctx.params;
    const base = ctx.url.origin;
    const db = await getDb();
    const pt = await db.select().from(ptTable).where(eq(ptTable.id, id)).get();
    if (!pt) return ctx.render(notFound());

    const sessionList = await db.select().from(sTable)
      .where(eq(sTable.playtestId, id))
      .orderBy(desc(sTable.createdAt))
      .all();

    return ctx.render(
      <Page pt={pt} sessions={sessionList} base={base} />,
    );
  },

  async POST(ctx: any) {
    const { id } = ctx.params;
    const form = await ctx.req.formData();
    const db = await getDb();

    const update: Record<string, any> = {};
    const name = form.get("name");
    if (name !== null && typeof name === "string" && name.trim()) update.name = name.trim();

    const slots = form.get("availableSlots");
    if (slots !== null) update.availableSlots = Number(slots);

    update.requestMic = form.get("requestMic") === "on" ? 1 : 0;

    if (Object.keys(update).length > 0) {
      await db.update(ptTable).set(update).where(eq(ptTable.id, id)).run();
    }

    return new Response(null, {
      status: 303,
      headers: { Location: `/playtest/${id}` },
    });
  },
};
