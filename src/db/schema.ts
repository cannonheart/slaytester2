import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const playtests = sqliteTable("playtests", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  availableSlots: integer("available_slots").notNull(),
  requestMic: integer("request_mic").notNull().default(1),
  createdAt: integer("created_at").notNull(),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  playtestId: text("playtest_id").notNull(),
  createdAt: integer("created_at").notNull(),
  status: text("status").notNull().default("recording"),
  chunkCount: integer("chunk_count").default(0),
  duration: real("duration"),
});
