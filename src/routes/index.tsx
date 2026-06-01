import { getDb } from "../db/db.ts";
import { playtests } from "../db/schema.ts";
import { desc } from "drizzle-orm";
import { Button } from "../components/Button.tsx";

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function Page({ list, error }: { list: any[]; error?: string }) {
  return (
    <div class="min-h-screen bg-gray-50">
      <div class="max-w-4xl mx-auto p-8">
        <h1 class="text-4xl font-bold mb-8">Slaytester 2</h1>

        {error && <p class="text-red-500 text-sm mb-4">{error}</p>}

        <div class="bg-white p-6 rounded-2xl shadow-sm border mb-8">
          <h2 class="text-2xl font-bold mb-4">Create Playtest</h2>
          <form method="POST" class="flex gap-4 items-end">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text" name="name" placeholder="Playtest name" required
                class="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-gray-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Player Slots</label>
              <input
                type="number" name="availableSlots" placeholder="5" required min="1"
                class="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-gray-500 w-24"
              />
            </div>
            <Button type="submit">Create</Button>
          </form>
        </div>

        {list.length === 0
          ? <p class="text-gray-500">No playtests yet. Create one above.</p>
          : (
            <div class="bg-white rounded-2xl shadow-sm border overflow-hidden">
              <table class="w-full">
                <thead>
                  <tr class="border-b">
                    <th class="text-left px-6 py-3 text-sm font-medium text-gray-500">Name</th>
                    <th class="text-left px-6 py-3 text-sm font-medium text-gray-500">Slots</th>
                    <th class="text-left px-6 py-3 text-sm font-medium text-gray-500">Created</th>
                    <th class="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((pt) => (
                    <tr class="border-b last:border-b-0">
                      <td class="px-6 py-4 text-sm font-medium">{pt.name}</td>
                      <td class="px-6 py-4 text-sm text-gray-500">{pt.availableSlots}</td>
                      <td class="px-6 py-4 text-sm text-gray-500">{formatDate(pt.createdAt)}</td>
                      <td class="px-6 py-4 text-right">
                        <a href={`/playtest/${pt.id}`} class="text-blue-500 hover:underline text-sm">View</a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>
    </div>
  );
}

export const handler = {
  async GET(ctx: any) {
    const db = await getDb();
    const list = await db.select().from(playtests).orderBy(desc(playtests.createdAt)).all();
    return ctx.render(<Page list={list} />);
  },

  async POST(ctx: any) {
    const form = await ctx.req.formData();
    const name = form.get("name") as string;
    const availableSlots = form.get("availableSlots") as string;

    if (!name || !availableSlots) {
      const db = await getDb();
      const list = await db.select().from(playtests).orderBy(desc(playtests.createdAt)).all();
      return ctx.render(<Page list={list} error="Name and player count are required" />);
    }

    const db = await getDb();
    await db.insert(playtests).values({
      id: crypto.randomUUID(),
      name,
      availableSlots: Number(availableSlots),
      requestMic: 1,
      createdAt: Date.now(),
    }).run();

    return new Response(null, {
      status: 303,
      headers: { Location: "/" },
    });
  },
};
