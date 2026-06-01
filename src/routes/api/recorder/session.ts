import { getDb } from "../../../db/db.ts";
import { playtests, sessions } from "../../../db/schema.ts";
import { eq } from "drizzle-orm";

export const handler = {
  async POST(ctx: any) {
    const body = await ctx.req.json();
    const { playtestId } = body;

    if (!playtestId) {
      return Response.json({ error: "playtestId is required" }, { status: 400 });
    }

    const db = await getDb();
    const pt = await db.select().from(playtests).where(eq(playtests.id, playtestId)).get();

    if (!pt) {
      return Response.json({ error: "Playtest not found" }, { status: 404 });
    }

    if (pt.availableSlots <= 0) {
      return Response.json({ error: "No slots available" }, { status: 409 });
    }

    const sessionId = crypto.randomUUID();

    await db.transaction(async (tx) => {
      const current = await tx.select().from(playtests).where(eq(playtests.id, playtestId)).get();
      if (!current || current.availableSlots <= 0) {
        throw new Error("no slots");
      }
      await tx.update(playtests)
        .set({ availableSlots: current.availableSlots - 1 })
        .where(eq(playtests.id, playtestId))
        .run();
      await tx.insert(sessions).values({
        id: sessionId,
        playtestId,
        createdAt: Date.now(),
      }).run();
    });

    return Response.json({ sessionId }, { status: 201 });
  },
};
