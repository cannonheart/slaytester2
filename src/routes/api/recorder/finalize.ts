import { getDb } from "../../../db/db.ts";
import { sessions } from "../../../db/schema.ts";
import { eq } from "drizzle-orm";

export const handler = {
  async POST(ctx: any) {
    const body = await ctx.req.json();
    const { sessionId } = body;

    if (!sessionId) {
      return Response.json({ error: "sessionId is required" }, { status: 400 });
    }

    const db = await getDb();
    const session = await db.select().from(sessions).where(eq(sessions.id, sessionId)).get();
    if (!session) {
      return Response.json({ error: "Session not found" }, { status: 404 });
    }

    await db.update(sessions)
      .set({ status: "finalized" })
      .where(eq(sessions.id, sessionId))
      .run();

    return Response.json({ status: "finalized" });
  },
};
