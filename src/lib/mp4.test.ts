import { assertEquals } from "$std/assert/mod.ts";
import { findBox, readDuration, stripInitSegment, updateMoovDuration, mergeToStream, parseMfra } from "./mp4.ts";

const FIXTURE = Deno.readFileSync(new URL("../testdata/chunk.mp4", import.meta.url));

Deno.test("mp4: readDuration returns 0 for empty buffer", () => {
  assertEquals(readDuration(new Uint8Array(0)), 0);
});

Deno.test("mp4: readDuration returns 0 for fixture (fragmented moov)", () => {
  assertEquals(readDuration(FIXTURE), 0);
});

Deno.test("mp4: findBox locates all top-level boxes", () => {
  assertEquals(findBox(FIXTURE, "ftyp"), 0);
  assertEquals(findBox(FIXTURE, "moov"), 28);
  assertEquals(findBox(FIXTURE, "moof"), 1252);
  assertEquals(findBox(FIXTURE, "mdat"), 1808);
});

Deno.test("mp4: findBox returns -1 for nonexistent box type", () => {
  assertEquals(findBox(FIXTURE, "xxxx"), -1);
});

Deno.test("mp4: stripInitSegment removes ftyp and moov", () => {
  const stripped = stripInitSegment(FIXTURE);
  const type = String.fromCharCode(stripped[4], stripped[5], stripped[6], stripped[7]);
  assertEquals(type, "moof");
});

Deno.test("mp4: stripInitSegment preserves moof and mdat", () => {
  const stripped = stripInitSegment(FIXTURE);
  assertEquals(findBox(stripped, "moof"), 0);
  assertEquals(findBox(stripped, "mdat"), 556);
});

Deno.test("mp4: updateMoovDuration changes duration", () => {
  const copy = new Uint8Array(FIXTURE);
  updateMoovDuration(copy, 5);
  assertEquals(readDuration(copy), 5);
});

Deno.test("mp4: updateMoovDuration is no-op on empty buffer", () => {
  const empty = new Uint8Array(0);
  updateMoovDuration(empty, 5);
  assertEquals(empty.length, 0);
});

Deno.test("mp4: stripInitSegment returns empty for empty buffer", () => {
  const result = stripInitSegment(new Uint8Array(0));
  assertEquals(result.length, 0);
});

Deno.test("mp4: mergeToStream produces correct concatenation with mfra", async () => {
  const stripped = stripInitSegment(FIXTURE);
  const chunks = [new Uint8Array(FIXTURE), stripped, stripped];
  const parts: Uint8Array[] = [];

  const stream = new ReadableStream({
    async start(controller) {
      await mergeToStream(chunks, controller);
    },
  });

  for await (const chunk of stream) {
    parts.push(chunk as Uint8Array);
  }

  const merged = parts.reduce((a, b) => {
    const c = new Uint8Array(a.length + b.length);
    c.set(a);
    c.set(b, a.length);
    return c;
  }, new Uint8Array(0));

  // Should contain content + mfra appended at end
  const contentLen = FIXTURE.length + stripped.length * 2;
  assertEquals(merged.length > contentLen, true);

  // Verify mfra is present at the end
  const mfraOff = findBox(merged, "mfra");
  assertEquals(mfraOff > 0, true);
});

Deno.test("mp4: parseMfra reads fixture correctly", () => {
  const result = parseMfra(FIXTURE);
  assertEquals(result !== null, true);
  if (result) {
    assertEquals(result.tracks.length, 2);
    assertEquals(result.tracks[0].trackId, 1);
    assertEquals(result.tracks[1].trackId, 2);
    assertEquals(result.tracks[0].entries.length, 1);
    assertEquals(result.tracks[0].entries[0].moofOffset, 1252);
    assertEquals(result.tracks[0].entries[0].time, 0);
  }
});
