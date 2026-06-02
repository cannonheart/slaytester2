import { getDb } from "../../db/db.ts";
import { playtests } from "../../db/schema.ts";
import { eq, desc } from "drizzle-orm";

export const handler = {
  async GET() {
    const db = await getDb();
    const rows = await db.select().from(playtests).orderBy(desc(playtests.createdAt)).all();
    return Response.json(rows);
  },

  async POST(ctx: any) {
    const body = await ctx.req.json();
    const { name, availableSlots, requestMic } = body;

    if (!name || availableSlots == null) {
      return Response.json({ error: "name and availableSlots are required" }, { status: 400 });
    }
    if (typeof name === "string" && name.length > 200) {
      return Response.json({ error: "name must be under 200 characters" }, { status: 400 });
    }

    const db = await getDb();
    const id = crypto.randomUUID();
    await db.insert(playtests).values({
      id,
      name,
      availableSlots: Number(availableSlots),
      requestMic: requestMic != null ? (requestMic ? 1 : 0) : 1,
      createdAt: Date.now(),
    }).run();

    const row = await db.select().from(playtests).where(eq(playtests.id, id)).get();
    return Response.json(row, { status: 201 });
  },
};
