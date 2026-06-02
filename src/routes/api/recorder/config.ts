import { getDb } from "../../../db/db.ts";
import { playtests } from "../../../db/schema.ts";
import { eq } from "drizzle-orm";

export const handler = {
  async GET(ctx: any) {
    const playtestId = ctx.url.searchParams.get("playtestId");
    if (!playtestId) {
      return Response.json({ error: "playtestId is required" }, { status: 400 });
    }

    const db = await getDb();
    const pt = await db.select().from(playtests).where(eq(playtests.id, playtestId)).get();

    if (!pt || pt.availableSlots <= 0) {
      return Response.json({ availableSlots: 0 });
    }

    return Response.json({
      availableSlots: pt.availableSlots,
      requestMic: pt.requestMic,
      maxDurationMinutes: parseInt(Deno.env.get("RECORDING_MAX_DURATION_MINUTES")!, 10),
    });
  },
};
