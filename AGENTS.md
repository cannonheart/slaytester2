# Slaytester 2 — Agent Guide

## Overview

Web game recording platform. Game devs add `<script src="BASE/recorder.js" data-playtest-id="abc">` to their game page. Players consent, record gameplay (canvas + audio + optional mic), and chunks upload to the server. Devs watch recordings through a token-protected dashboard.

**Tech stack**: Deno 2 + Fresh 2.x + SQLite (via libsql + Drizzle ORM) + Tailwind v4 (via `@fresh/plugin-tailwind`) + esbuild (recorder bundler).

## Commands

Start from `src/` unless noted otherwise.

| What | Command | Where |
|---|---|---|
| Dev server | `deno task start` | `src/` |
| Run all tests | `deno task test` | `src/` |
| Run single test file | `deno test -A --no-check routes/login.test.tsx` | `src/` |
| Type check | `deno check dev.ts main.ts` or `deno task check` | `src/` |
| Build recorder.js | `deno run -A build.ts` | `src-recorder/` |
| Build production assets | `deno task build` | `src/` |

Tests use `--no-check` (skip type-checking for speed). All 93 tests pass.

## Architecture

### Server (`src/`)

Fresh 2 with Builder mode. Routes are file-based in `src/routes/`.

| Route | Auth | What it does |
|---|---|---|
| `/login` | No | Token form, rate-limited after 5 failures |
| `/` | Yes | Playtest list + create form |
| `/playtest/:id` | Yes | Settings, embed code, sessions table |
| `/session/:id` | Yes | Video playback (`<video controls src="/api/stream?sessionId=X">`) |
| `/api/recorder/config` | No | Returns `{ availableSlots, requestMic, maxDurationMinutes }` or `{ availableSlots: 0 }` |
| `/api/recorder/session` | No | Atomically claims a slot, returns `{ sessionId }` or 409 |
| `/api/recorder/upload` | No | Writes chunk to disk. Validates size (10MB), time limit (60min), chunk limit (900). Returns 403 on limit. |
| `/api/stream` | Yes | Merges chunks to a temp file, serves with Content-Length and Accept-Ranges. |
| `/api/health` | No | `{ status: "ok" }` |

**Middleware** (`_middleware.ts`):
- All paths except `/login`, `/api/health`, `/api/recorder/*`, and static files require auth.
- Auth via `admin-token` header or `token` cookie. Query param auth removed.
- CORS headers (`Access-Control-Allow-Origin: *`) only on `/api/recorder/*` and `/api/health`.
- Failed auth attempts are rate-limited (shared with login page — 5 failures → exponential backoff).

### Recorder client (`src-recorder/`)

Browser-side script bundled by esbuild into `src/static/recorder.js` (IIFE, minified, es2020).

**Build**: `deno run -A build.ts` from `src-recorder/`. Output goes to `src/static/recorder.js`.

**Flow**: `load → config fetch → localStorage check → consent popup → claim slot → mic setup → canvas capture (30fps) → audio proxy → record (4s timeslice) → upload chunks → beforeunload → stop`.

Key details:
- Offscreen canvas at CSS-displayed size, nearest-neighbor rendering (pixel art safe)
- Game audio captured via `AudioContext` proxy + polling for late-initializing contexts
- Mic processed through `DynamicsCompressorNode` (ratio 6, threshold -35dB) + make-up gain
- Both mic and game audio go through a 40Hz highpass filter
- Cancelable `navigator.mediaDevices.getUserMedia` with `autoGainControl: false`, `echoCancellation: false`, `noiseSuppression: false`
- Chunks every 4 seconds (`MediaRecorder.start(4000)`)
- Players can only join a playtest once (localStorage)
- Server returning 403 on upload triggers `slaytester:timeout` event → shows "time limit reached" overlay

### Database (`src/db/`)

SQLite via `@libsql/client` + Drizzle ORM. Singleton `getDb()` with auto-push on first access. Tests use `resetDb('file:temp.db')` (in-memory doesn't survive transactions).

Tables: `playtests` (id, name, availableSlots, requestMic, createdAt), `sessions` (id, playtestId, createdAt, chunkCount, duration).

### Video pipeline (`src/lib/mp4.ts`)

Pure-function MP4 box parsing. Key exports:
- `mergeToFile(dest, firstChunk, lastChunk, midChunks)` — writes merged output to a temp file
- `mergeToStream(firstChunk, lastChunk, midChunks, controller)` — streams merged output
- `computeDurationFromChunks(firstChunk, lastChunk)` — returns duration in seconds
- `readTfdt(buf)`, `readVideoTimescale(buf)`, `parseMfra(buf)`, `buildMfra(tracks, totalSize, cumSizes)`
- `updateMoovDuration(buf, duration)` — sets mvhd + tkhd duration fields
- `stripInitSegment(buf)` — removes ftyp + moov boxes
- The mfra box is rebuilt with adjusted byte offsets for Safari seeking support
- `setU64` uses BigInt for 64-bit writes (avoids JS 32-bit truncation)

## Environment Variables (`.env`)

All required at startup — validated in `src/lib/env.ts`. Missing `ADMIN_TOKEN` exits with error; others use defaults.

```
ADMIN_TOKEN=dev
RECORDING_MAX_DURATION_MINUTES=60    # Max recording length in minutes
RECORDING_MAX_CHUNKS=900             # Max chunks per session (60min × 60s ÷ 4s)
MAX_CHUNK_SIZE_MB=10                 # Max size per uploaded chunk in MB
```

## Testing

93 tests across: components (6), db (7), auth (7), middleware (13), health (1), recorder API (9), stream (6), login (5), index (5), playtest detail (7), session (3), mp4 (15).

**Pattern**: `Deno.test()`, `assertEquals`/`assertStringIncludes` from `$std/assert`. Component tests render with `preact-render-to-string`. API tests mock `ctx` with `{ req, url, state, render, params }`. Auth tests run requests through the middleware handler with mock `ctx.next()`. DB tests use `resetDb()` with temp file paths.

## Key Gotchas

- `libsql`'s `:memory:` database doesn't survive transactions — tests involving transactions must use temp file DB (`file:${tempPath}`).
- Drizzle ORM queries are async (`.get()`, `.all()`, `.run()` all return Promises).
- The recorder client uses browser DOM types that LSP can't resolve in Deno — ignore LSP errors in `src-recorder/`.
- `parseInt` in env var loading handles trailing comment text (e.g., `"60    # comment"` → `60`).
- `nodeModulesDir: "auto"` is required for Tailwind v4 PostCSS (`enhanced-resolve` needs symlinks in `node_modules`).
- `deno.json` has `"lib": ["dom"]` for LSP (even though recorder code is bundled for browser by esbuild).
