# Slaytester 2 — Specification

## Overview
A super simple web game recording platform. Game devs add a `<script>` tag to their game page. Players who visit can consent to having their gameplay (canvas + audio) recorded and uploaded. Devs watch recordings through a token-protected dashboard.

## Tech Stack
- **Runtime**: Deno 2
- **Web Framework**: Fresh 2 (file-based routing, islands, Preact SSR)
- **Storage**: Deno KV (playtest + session metadata) + Filesystem (video chunks)
- **Styling**: Tailwind CSS 3 (via Fresh plugin)
- **Recorder bundler**: esbuild (IIFE, es2020 target)
- **Language**: TypeScript / TSX
- **Infrastructure**: Zero external services — no Docker, no database server, no S3

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
│ Chunks via POST ────┤          │ /api/playtests  (auth)     │
└─────────────────────┘          │ /api/playtests/:id  (auth) │
                                 │ /api/sessions  (auth)      │
                                 │                            │
                                 │ / (dashboard)  [auth]      │
                                 │ /playtest/:id  [auth]      │
                                 │ /session/:id   [auth]      │
                                 │ /login         [no auth]   │
                                 │                            │
                                 │ Deno KV ─── metadata       │
                                 │ data/ ───── video chunks   │
                                 └────────────────────────────┘
```

## Data Model (Deno KV)

```
["playtest", playtestId] → {
  id: string,
  name: string,
  availableSlots: number,
  requestMic: boolean,
  createdAt: number,
}

["session", sessionId] → {
  id: string,
  playtestId: string,
  createdAt: number,
  status: "recording" | "finalized" | "failed",
  chunkCount: number,
  duration: number | null,
}

["session_by_playtest", playtestId, sessionId] → true
```

Lookup patterns:
- All playtests: `kv.list({prefix: ["playtest"]})`
- Single playtest: `kv.get(["playtest", id])` → update in place
- Sessions for playtest: `kv.list({prefix: ["session_by_playtest", playtestId]})` → batch `kv.get(["session", sessionId])`
- Single session: `kv.get(["session", id])`

## Recorder Flow

The game dev adds one line to their HTML:
```html
<script src="https://server.com/recorder.js" data-playtest-id="abc-123-..."></script>
```

1. **Load** — Read `data-playtest-id` from `document.currentScript`, derive `BASE` from script URL
2. **Check config** — `GET {BASE}/api/recorder/config?playtestId=X`
   - Returns `{ availableSlots, requestMic, ...popupConfig }` if slots > 0
   - Returns `{ availableSlots: 0 }` if slots exhausted → exit silently
3. **Consent popup** — Show consent overlay (reuse slaytester's `showConsentPopup`). If declined → exit.
4. **Claim slot** — If accepted, `POST {BASE}/api/recorder/session { playtestId }`
   - Server does an **atomic check**: read playtest, if `availableSlots > 0`, decrement and return `{ sessionId }`. Otherwise `409 Conflict`.
   - On 409, show "Playtest is full" message to the player
5. **Mic setup** — If `requestMic === true`, follow slaytester's mic consent + mic check flow. Otherwise skip.
6. **Canvas capture** — Find first `<canvas>`, call `captureStream(30)` for video track
7. **Audio capture** — Patch `AudioContext` via `installAudioProxy` + `retroactivelyCapture` (reuse `audio-proxy.ts`). Route game audio + mic (if any) into a `MediaStreamAudioDestinationNode`
8. **Record** — Combine video + audio tracks into `MediaRecorder(stream, {mimeType: "video/mp4", videoBitsPerSecond: bitrate})`, fire `ondataavailable` every 1s
9. **Upload** — Each chunk → `POST {BASE}/api/recorder/upload` as `FormData { sessionId, chunkIndex, chunkTime, blob }`
10. **Finalize** — On `beforeunload`, `POST {BASE}/api/recorder/finalize { sessionId }`

## Playtest Capacity

- Dev creates a playtest with `availableSlots: N` (e.g., 5)
- Each player who clicks "Accept" on consent claims one slot → server atomically decrements
- Dev can **set** `availableSlots` to any value at any time (increase or decrease) via the playtest detail page
- Setting to 0 immediately blocks new joiners
- The config endpoint returns `availableSlots` — if 0, recorder exits without showing UI
- The session claim endpoint does a final atomic check to prevent race conditions on the last slot
- The server rejects uploads for sessions that don't exist, preventing garbage data

## Playtest `requestMic`

- Part of playtest creation form, toggleable later via the playtest detail page
- Default: `true`
- When `false`: recorder skips all mic consent/capture steps entirely
- The recorder config response includes `requestMic` so the client knows whether to ask

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/recorder.js` | No | Serve bundled recorder script |
| `GET` | `/api/recorder/config` | No | Returns `{ availableSlots, requestMic, ...popupConfig }` or `{ availableSlots: 0 }` |
| `POST` | `/api/recorder/session` | No | Claim slot. Atomic check+decrement. Returns `{ sessionId }` or `409` |
| `POST` | `/api/recorder/upload` | No | Upload chunk. Validates session exists. FormData: `sessionId`, `chunkIndex`, `chunkTime`, `blob` |
| `POST` | `/api/recorder/finalize` | No | Mark session finalized. Body: `{ sessionId }` |
| `GET` | `/api/stream` | Yes | Stream merged recording. Params: `sessionId&merge=true` |
| `GET` | `/api/playtests` | Yes | List all playtests |
| `POST` | `/api/playtests` | Yes | Create playtest. Body: `{ name, availableSlots, requestMic? }` |
| `PATCH` | `/api/playtests/:id` | Yes | Update playtest. Body: `{ availableSlots?, requestMic? }` |
| `GET` | `/api/sessions?playtestId=X` | Yes | List sessions for a playtest |

## Auth

A single `ADMIN_TOKEN` env variable protects all dashboard content:
- Everything under `/api/playtests`, `/api/sessions`, `/api/stream` requires the token
- `/api/recorder/*` and `/recorder.js` are **public** (CORS, no auth)
- Page routes check for token via cookie (`token=...`) or query param (`?token=...`)
- `/login` shows a simple token entry form; on success sets cookie and redirects to `/`

## Dashboard Pages

| Route | Auth | Content |
|---|---|---|
| `/login` | No | Token entry form |
| `/` | Yes | Playtest list — name, slots remaining, created date, link to each |
| `/playtest/:id` | Yes | Detail page — name, slot counter (direct-set number input + Update button), `requestMic` toggle, embed code snippet, list of sessions with status/link to watch |
| `/session/:id` | Yes | Video playback via Playback island (adapted from slaytester) |

## Filesystem Storage

```
data/
  recordings/
    {sessionId}/
      0.mp4
      1.mp4
      ...
```

Playback merges chunks server-side using the same `mp4.ts` logic from slaytester: find the first valid chunk with a `moov` box, update its duration metadata, then stream all remaining chunks with init segments stripped.

## Reused Code from slaytester

| File | Modification |
|---|---|
| `src-recorder/main.ts` | Replace `versionKey`→`playtestId`, add slot claim step, add `requestMic` gate, update API URL paths |
| `src-recorder/capture.ts` | Update upload URL → `/api/recorder/upload` |
| `src-recorder/popup.ts` | Unchanged |
| `src-recorder/audio-proxy.ts` | Unchanged |
| `src-recorder/build.ts` | Unchanged (esbuild config) |
| `src/lib/mp4.ts` | Unchanged |
| `src/lib/env.ts` | Unchanged (.env loader) |
| `src/lib/default-recorder-conf.ts` | Unchanged |
| `src/islands/Playback.tsx` | Update stream URL → `/api/stream?sessionId=X` |

## Project Structure

```
slaytester2/
├── src/
│   ├── deno.json
│   ├── fresh.config.ts
│   ├── fresh.gen.ts              # auto-generated
│   ├── dev.ts
│   ├── main.ts
│   ├── tailwind.config.ts
│   ├── routes/
│   │   ├── _app.tsx
│   │   ├── _middleware.ts        # CORS + token auth
│   │   ├── _404.tsx
│   │   ├── login.tsx             # Token entry
│   │   ├── index.tsx             # Dashboard — playtest list
│   │   ├── playtest/[id].tsx     # Playtest detail
│   │   ├── session/[id].tsx      # Playback page
│   │   └── api/
│   │       ├── recorder/
│   │       │   ├── config.ts
│   │       │   ├── session.ts
│   │       │   ├── upload.ts
│   │       │   └── finalize.ts
│   │       ├── playtests.ts
│   │       ├── playtests/[id].ts
│   │       ├── sessions.ts
│   │       └── stream.ts
│   ├── islands/
│   │   ├── Playback.tsx
│   │   └── CreatePlaytestForm.tsx
│   ├── components/
│   │   ├── PageLayout.tsx
│   │   ├── Heading.tsx
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── Card.tsx
│   ├── lib/
│   │   ├── env.ts
│   │   ├── kv.ts
│   │   ├── auth.ts
│   │   ├── mp4.ts
│   │   └── default-recorder-conf.ts
│   └── static/
│       ├── styles.css
│       └── recorder.js
├── src-recorder/
│   ├── main.ts
│   ├── capture.ts
│   ├── popup.ts
│   ├── audio-proxy.ts
│   ├── build.ts
│   ├── deno.json
│   └── tests/
├── data/
│   └── recordings/
├── .env
├── SPEC.md
└── .gitignore
```

## Environment Variables (`.env`)

```
ADMIN_TOKEN=some-secret-string
```

That's it — one env var. No database URL, no S3 config, no Docker.

## Out of Scope (v1)
- Multi-user / teams
- Email / magic links
- Recording editing or trimming
- Live streaming / real-time watch
- Background chunk-stitching job
- Privacy policy page
