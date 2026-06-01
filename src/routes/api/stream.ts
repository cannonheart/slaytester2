import { getDb } from "../../db/db.ts";
import { sessions } from "../../db/schema.ts";
import { eq } from "drizzle-orm";

export const handler = {
  async GET(ctx: any) {
    const sessionId = ctx.url.searchParams.get("sessionId");
    if (!sessionId) {
      return Response.json({ error: "sessionId query parameter is required" }, { status: 400 });
    }

    const db = await getDb();
    const session = await db.select().from(sessions).where(eq(sessions.id, sessionId)).get();
    if (!session) {
      return Response.json({ error: "Session not found" }, { status: 404 });
    }

    return Response.json({ sessionId, status: session.status, chunkCount: session.chunkCount });
  },
};
