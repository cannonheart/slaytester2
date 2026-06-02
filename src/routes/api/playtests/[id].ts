import { getDb } from "../../../db/db.ts";
import { playtests } from "../../../db/schema.ts";
import { eq } from "drizzle-orm";

export const handler = {
  async PATCH(ctx: any) {
    const { id } = ctx.params;
    const body = await ctx.req.json();
    const { availableSlots, requestMic } = body;

    const db = await getDb();
    const existing = await db.select().from(playtests).where(eq(playtests.id, id)).get();
    if (!existing) {
      return Response.json({ error: "Playtest not found" }, { status: 404 });
    }

    const update: Record<string, any> = {};
    if (availableSlots != null) {
      const slotNum = Number(availableSlots);
      if (!Number.isInteger(slotNum) || slotNum < 0) {
        return Response.json({ error: "availableSlots must be a non-negative integer" }, { status: 400 });
      }
      update.availableSlots = slotNum;
    }
    if (requestMic != null) update.requestMic = requestMic ? 1 : 0;

    if (Object.keys(update).length > 0) {
      await db.update(playtests).set(update).where(eq(playtests.id, id)).run();
    }

    const row = await db.select().from(playtests).where(eq(playtests.id, id)).get();
    return Response.json(row);
  },
};
