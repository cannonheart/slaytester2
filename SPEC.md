# Slaytester 2 — Specification

## Overview
A super simple web game recording platform. Game devs add a `<script>` tag to their game page. Players who visit can consent to having their gameplay (canvas + audio) recorded and uploaded. Devs watch recordings through a token-protected dashboard.

## Tech Stack
- **Runtime**: Deno 2
- **Web Framework**: Fresh 2.x (JSR `@fresh/core`, Builder mode)
- **Database**: SQLite via `@libsql/client` + Drizzle ORM (playtest + session metadata)
- **Storage**: Filesystem (video chunks)
- **Styling**: Tailwind CSS v4 via `@fresh/plugin-tailwind` (PostCSS build-time)
- **Module resolution**: `nodeModulesDir: "auto"` (needed for `enhanced-resolve` inside `@tailwindcss/postcss`)
- **Recorder bundler**: esbuild (IIFE, es2020 target)
- **Language**: TypeScript / TSX
- **Infrastructure**: Zero external services — no Docker, no PostgreSQL, no S3

## Architecture

```
Browser (player)                 Slaytester 2 Server
┌─────────────────────┐          ┌────────────────────────────┐
│ <script src=        │   ──►    │ /recorder.js  (static)     │
│   /recorder.js      │          │                            │
│   data-playtest     │   ──►    │ /api/recorder/config       │
│   -id="abc">        │   ──►    │ /api/recorder/session      │
│                     │   ──►    │ /api/recorder/upload       │
│ Canvas capture ─────┤   ──►    │ /api/recorder/finalize     │
│ Audio proxy ────────┤          │                            │
│ MediaRecorder ──────┤          │ /api/stream  (auth)        │
│ Chunks via POST ────┤          │                            │
└─────────────────────┘          │ / (dashboard)  [auth]      │
                                 │ /playtest/:id  [auth]      │
                                 │ /session/:id   [auth]      │
                                 │ /login         [no auth]   │
                                 │                            │
                                 │ SQLite ─── metadata         │
                                 │ data/ ───── video chunks   │
                                 └────────────────────────────┘
```

## Data Model (SQLite + Drizzle ORM)

### Schema (`src/db/schema.ts`)

```typescript
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
```

### DB Initialization (`src/db/db.ts`)

Lazily initialized singleton with auto-push. Tests call `resetDb(":memory:")` to swap to a private in-memory DB (per-test temp file for tests involving transactions, since libsql's `:memory:` doesn't survive transactions).

```typescript
export async function getDb(): Promise<LibSQLDatabase>
export function resetDb(url: string): LibSQLDatabase  // closes previous, pushes tables
```

### Slot Claim (transactional, permanent slots)

Slots are **permanent** — once a player claims a slot, it stays claimed forever. The finalize endpoint does NOT release slots. This means a crashed player's slot is never recycled.

```typescript
await db.transaction(async (tx) => {
  const p = tx.select().from(playtests)
    .where(eq(playtests.id, id)).get();
  if (!p || p.availableSlots <= 0) throw new Error("no slots");
  tx.update(playtests)
    .set({ availableSlots: p.availableSlots - 1 })
    .where(eq(playtests.id, id))
    .run();
  tx.insert(sessions).values({ id: sessionId, ... }).run();
});
```

## Recorder Flow

1. **Load** — Read `data-playtest-id` from `document.currentScript`, derive `BASE` from script URL
2. **Check config** — `GET {BASE}/api/recorder/config?playtestId=X`
   - Returns `{ availableSlots, requestMic }` if slots > 0
   - Returns `{ availableSlots: 0 }` if slots exhausted → exit silently
3. **Consent popup** — Show consent overlay (text + yes/no buttons, no privacy policy links). If declined → exit.
4. **Claim slot** — `POST {BASE}/api/recorder/session { playtestId }`
   - Server does an **atomic check**: read playtest, if `availableSlots > 0`, decrement and return `{ sessionId }`. Otherwise `409 Conflict`.
   - On 409, show "Playtest is full" message
5. **Mic setup** — If `requestMic === true`, mic consent + mic check flow. Otherwise skip.
6. **Canvas capture** — Find first `<canvas>`, call `captureStream(30)` for video track
7. **Audio capture** — Patch `AudioContext` via audio proxy. Patches `createScriptProcessor`, `createGain`, `createBufferSource`, etc. to track game audio contexts. Polls for late-initializing contexts (e.g., PICO-8's ScriptProcessor). Routes game audio + mic into a `MediaStreamAudioDestinationNode`.
8. **Record** — `MediaRecorder(stream, {mimeType: "video/mp4;codecs=avc3"})`, fires `ondataavailable` every 1s
9. **Upload** — Each chunk → `POST {BASE}/api/recorder/upload` as `FormData { sessionId, chunkIndex, chunkTime, blob }`
   - Accepted: 200
   - Validation: `chunkIndex` must be a non-negative integer (prevents path traversal)
   - Filesize: max 10MB per chunk (returns 413)
   - `sessionId` must match `^[a-zA-Z0-9_-]+$` (prevents path traversal)
10. **Finalize** — On `beforeunload`, `POST {BASE}/api/recorder/finalize { sessionId }` via `sendBeacon` with `Content-Type: application/json`
    - Best-effort. If the browser crashes, the session stays `"recording"` forever. No slot is released.

## Playtest Capacity

- Dev creates a playtest with `availableSlots: N` (e.g., 5)
- Each player who clicks "Accept" on consent claims one slot — server atomically decrements
- Slots are **permanent**. Finalizing a session does not release its slot.
- Dev can set `availableSlots` to any value at any time (increase or decrease) via the playtest detail page
- Setting to 0 immediately blocks new joiners
- The config endpoint returns `availableSlots` — if 0, recorder exits without showing UI
- The session claim endpoint does a final atomic check to prevent race conditions on the last slot
- The server rejects uploads for sessions that don't exist

## Playtest `requestMic`

- Part of playtest creation form, toggleable later via the playtest detail page
- Default: `true`
- When `false`: recorder skips all mic consent/capture steps entirely
- The recorder config response includes `requestMic` so the client knows whether to ask

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|---|
| `GET` | `/recorder.js` | No | Serve bundled recorder script |
| `GET` | `/api/recorder/config` | No | Returns `{ availableSlots, requestMic, maxDurationMinutes }` or `{ availableSlots: 0 }` |
| `POST` | `/api/recorder/session` | No | Claim slot. Atomic check+decrement. Returns `{ sessionId }` (201), 409, or 404 |
| `POST` | `/api/recorder/upload` | No | Upload chunk. Validates sessionId format, chunkIndex (non-negative int), max per-chunk size. FormData: `sessionId`, `chunkIndex`, `chunkTime`, `blob`. Rejects chunks beyond 60-min time limit or 900-chunk limit. |
| `GET` | `/api/stream` | Yes | Stream merged recording. Params: `sessionId` |

## Auth

A single `ADMIN_TOKEN` env variable protects all dashboard content:
- `/api/stream` requires the token
- `/api/recorder/*`, `/api/health`, and `/recorder.js` are **public** (CORS, no auth)
- Page routes check for token via cookie (`token=...`) or `admin-token` header
- `/login` shows a simple token entry form; on success sets cookie and redirects to `/`

## Dashboard Pages

| Route | Auth | Content |
|---|---|---|
| `/login` | No | Token entry form (shared components: PageLayout, Card, Heading, Input, Button) |
| `/` | Yes | Playtest list — name, slots remaining, created date, View link. Create form (name + slots + Create button via POST) |
| `/playtest/:id` | Yes | Single settings card: name input, slots input, requestMic checkbox, Save button. Embed code snippet (auto-derived from `ctx.url.origin`). Sessions table (status, chunks, date, Watch link) |
| `/session/:id` | Yes | Video playback via native `<video controls>` pointing to `/api/stream?sessionId=X` |

## Filesystem Storage

```
data/
  slaytester.db
  recordings/
    {sessionId}/
      0.mp4
      1.mp4
      ...
```

Playback merges chunks server-side: reads all chunk files, parses `tfdt` (Track Fragment Decode Time) to compute exact total duration in media timescale, converts to movie timescale and updates `mvhd` + `tkhd` duration fields. Strips init segments (ftyp/moov) from subsequent chunks. Appends rebuilt `mfra` box with adjusted `tfra` byte offsets for Safari seeking support. Serves with `Content-Length` and `Accept-Ranges: bytes` for proper browser timeline and seek support.

## Shared Components (`src/components/`)

| Component | Classes | Tests |
|---|---|---|
| `PageLayout` | `min-h-screen flex items-center justify-center bg-gray-50` | ✓ |
| `Card` | `bg-white p-8 rounded-2xl shadow-sm border max-w-sm w-full` | ✓ |
| `Heading` | `text-2xl font-bold text-center mb-6` | ✓ |
| `Input` | `border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-gray-500` | ✓ |
| `Button` | `bg-black text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-800 w-full` | ✓ |
| `Checkbox` | `appearance-none h-4 w-4 rounded border border-gray-300 checked:bg-black` | ✓ |

## Project Structure

```
slaytester2/
├── src/
│   ├── deno.json
│   ├── dev.ts                     # Fresh 2 Builder + tailwind plugin
│   ├── main.ts                    # App setup, static files, fs routes
│   ├── db/
│   │   ├── schema.ts              # Drizzle SQLite tables
│   │   ├── db.ts                  # Singleton getDb() + resetDb() for tests
│   │   └── push.ts                # CREATE TABLE IF NOT EXISTS
│   ├── lib/
│   │   ├── env.ts                 # .env loader
│   │   ├── auth.ts                # Token check
│   │   ├── mp4.ts                 # MP4 box parsing, tfdt duration, mfra rebuild, mergeToStream
│   │   └── default-recorder-conf.ts  # Popup CSS, text defaults, bitrate, fps
│   ├── routes/
│   │   ├── _app.tsx               # HTML shell + stylesheet
│   │   ├── _middleware.ts         # CORS + token auth
│   │   ├── _404.tsx
│   │   ├── login.tsx              # Token entry via ctx.render()
│   │   ├── index.tsx              # Dashboard — playtest list + create
│   │   ├── playtest/[id].tsx      # Playtest detail — settings, embed, sessions
│   │   ├── session/[id].tsx       # Playback page via native <video controls>
│   │   └── api/
│   │       ├── health.ts
│   │       ├── recorder/
│   │       │   ├── config.ts
│   │       │   ├── session.ts
│   │       │   └── upload.ts
│   │       ├── health.ts
│   │       └── stream.ts
│   ├── components/
│   │   ├── PageLayout.tsx
│   │   ├── Card.tsx
│   │   ├── Heading.tsx
│   │   ├── Input.tsx
│   │   ├── Button.tsx
│   │   └── Checkbox.tsx
│   └── static/
│       └── styles.css             # @import "tailwindcss"
├── src-recorder/
│   ├── main.ts                    # Recorder entry: load, config, consent, slot claim, mic, capture, record, upload, finalize
│   ├── capture.ts                 # Canvas capture + MediaRecorder + chunk upload
│   ├── popup.ts                   # Consent overlay (no privacy policy links)
│   ├── audio-proxy.ts             # AudioContext patching + late-initialization polling
│   ├── build.ts                   # esbuild bundler config
│   └── deno.json
├── data/
│   ├── slaytester.db              # Auto-created by getDb()
│   └── recordings/
├── .env
├── SPEC.md
└── .gitignore
```

## Source Changes from slaytester

| File | Changes |
|---|---|
| `src-recorder/main.ts` | `versionKey` → `playtestId`, add slot claim step, add `requestMic` gate, update API URL paths, `sendBeacon` with `application/json` Blob |
| `src-recorder/capture.ts` | Remove `versionKey`, update upload URL → `/api/recorder/upload`, prefer `avc3` codec |
| `src-recorder/popup.ts` | Remove privacy policy links, remove consent checkbox/disabled yes button |
| `src-recorder/audio-proxy.ts` | Add `createScriptProcessor` to override list, track tapped contexts with `WeakSet` |
| `src-recorder/build.ts` | Unchanged |
| `src/lib/mp4.ts` | Add `readVideoTimescale`, `computeTotalDuration` (tfdt-based), `readTfdt` (reads last moof), mfra parsing/building |
| `src/lib/env.ts` | Unchanged |
| `src/lib/default-recorder-conf.ts` | Copied from old slaytester, unchanged |
| `src/db/schema.ts` | New — Drizzle SQLite schema |
| `src/db/db.ts` | New — singleton with auto-push + test override |
| `src/db/push.ts` | New — CREATE TABLE on startup |

## Environment Variables (`.env`)

```
ADMIN_TOKEN=some-secret-string
```

That's it — one env var. SQLite database file lives at `data/slaytester.db` (auto-created by `getDb()`). No Docker, no S3, no PostgreSQL.

## Test Suite

- **110 tests total**, all passing
- Test pattern: `Deno.test()`, `assertEquals`/`assertStringIncludes` from `$std/assert`
- DB tests use `resetDb()` with temp file paths for transaction-isolated tests
- Auth tests use middleware handler directly (mock `ctx.next()`)
- Component tests render with `preact-render-to-string` and check output
- API handler tests mock `ctx` with `{ req, url, state, params, render }`

## Out of Scope (v1)

- Multi-user / teams
- Email / magic links
- Recording editing or trimming
- Live streaming / real-time watch
- Background chunk-stitching job
