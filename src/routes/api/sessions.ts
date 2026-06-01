import { getDb } from "../../db/db.ts";
import { sessions } from "../../db/schema.ts";
import { eq, desc } from "drizzle-orm";

export const handler = {
  async GET(ctx: any) {
    const playtestId = ctx.url.searchParams.get("playtestId");
    if (!playtestId) {
      return Response.json({ error: "playtestId query parameter is required" }, { status: 400 });
    }

    const db = await getDb();
    const rows = await db.select().from(sessions)
      .where(eq(sessions.playtestId, playtestId))
      .orderBy(desc(sessions.createdAt))
      .all();

    return Response.json(rows);
  },
};
