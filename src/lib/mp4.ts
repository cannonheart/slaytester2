function u32(buf: Uint8Array, off: number): number {
  return (buf[off] << 24) | (buf[off + 1] << 16) | (buf[off + 2] << 8) | buf[off + 3];
}

function u64(buf: Uint8Array, off: number): number {
  return Number((BigInt(u32(buf, off)) << 32n) | BigInt(u32(buf, off + 4)));
}

function boxSize(buf: Uint8Array, off: number): number {
  const size = u32(buf, off);
  if (size === 0) return buf.length - off;
  if (size === 1) {
    return Number((BigInt(u32(buf, off + 8)) << 32n) | BigInt(u32(buf, off + 12)));
  }
  return size;
}

function boxType(buf: Uint8Array, off: number): string {
  return String.fromCharCode(buf[off + 4], buf[off + 5], buf[off + 6], buf[off + 7]);
}

export function findBox(buf: Uint8Array, type: string, start = 0): number {
  let off = start;
  while (off < buf.length - 8) {
    const sz = boxSize(buf, off);
    if (boxType(buf, off) === type) return off;
    off += sz;
  }
  return -1;
}

export function readDuration(buf: Uint8Array): number {
  const moovOff = findBox(buf, "moov");
  if (moovOff === -1) return 0;

  const mvhdOff = findBox(buf, "mvhd", moovOff + 8);
  if (mvhdOff === -1) return 0;

  const version = buf[mvhdOff + 8];
  const base = mvhdOff + 8 + 1 + 3;

  let timescaleOff: number;
  let durOff: number;
  if (version === 1) {
    timescaleOff = base + 8 + 8;
    durOff = timescaleOff + 4;
  } else {
    timescaleOff = base + 4 + 4;
    durOff = timescaleOff + 4;
  }

  const timescale = u32(buf, timescaleOff);
  if (timescale === 0) return 0;

  const duration = version === 1
    ? Number((BigInt(u32(buf, durOff)) << 32n) | BigInt(u32(buf, durOff + 4)))
    : u32(buf, durOff);

  return duration / timescale;
}

export function readTfdt(buf: Uint8Array): number {
  let off = 0;
  let lastMoof = -1;
  while (off < buf.length - 8) {
    const mf = findBox(buf, "moof", off);
    if (mf === -1) break;
    lastMoof = mf;
    off = mf + boxSize(buf, mf);
  }
  if (lastMoof === -1) return 0;

  const trafOff = findBox(buf, "traf", lastMoof + 8);
  if (trafOff === -1) return 0;
  const tfdtOff = findBox(buf, "tfdt", trafOff + 8);
  if (tfdtOff === -1) return 0;

  const version = buf[tfdtOff + 8];
  const timeOff = tfdtOff + 12;
  return version === 1
    ? Number((BigInt(u32(buf, timeOff)) << 32n) | BigInt(u32(buf, timeOff + 4)))
    : u32(buf, timeOff);
}

export function readVideoTimescale(buf: Uint8Array): number {
  const moovOff = findBox(buf, "moov");
  if (moovOff === -1) return 1000;

  // Find first trak → mdia → mdhd
  const firstTrak = findBox(buf, "trak", moovOff + 8);
  if (firstTrak === -1) return 1000;
  const mdiaOff = findBox(buf, "mdia", firstTrak + 8);
  if (mdiaOff === -1) return 1000;
  const mdhdOff = findBox(buf, "mdhd", mdiaOff + 8);
  if (mdhdOff === -1) return 1000;

  const version = buf[mdhdOff + 8];
  const base = mdhdOff + 12;
  const tsOff = version === 1 ? base + 8 + 8 : base + 4 + 4;
  const ts = u32(buf, tsOff);
  return ts > 0 ? ts : 1000;
}

export function computeTotalDuration(chunks: Uint8Array[]): number {
  if (chunks.length <= 1) return 0;

  // Use the last chunk's tfdt as the total duration in media timescale units
  return readTfdt(chunks[chunks.length - 1]);
}

export function updateMoovDuration(buf: Uint8Array, duration: number): void {
  const moovOff = findBox(buf, "moov");
  if (moovOff === -1) return;

  const mvhdOff = findBox(buf, "mvhd", moovOff + 8);
  if (mvhdOff === -1) return;

  const version = buf[mvhdOff + 8];
  const base = mvhdOff + 8 + 1 + 3;

  let timescaleOff: number;
  let durOff: number;
  if (version === 1) {
    timescaleOff = base + 8 + 8;
    durOff = timescaleOff + 4;
  } else {
    timescaleOff = base + 4 + 4;
    durOff = timescaleOff + 4;
  }

  const timescale = u32(buf, timescaleOff);
  const newDuration = duration; // already in timescale units

  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  if (version === 1) {
    dv.setBigUint64(durOff, BigInt(newDuration));
  } else {
    dv.setUint32(durOff, newDuration);
  }

  // Update per-track durations (tkhd inside each trak)
  // so the browser doesn't skip the audio track due to tkhd.duration=0.
  let off = moovOff + 8;
  while (off < moovOff + boxSize(buf, moovOff) - 8) {
    const sz = boxSize(buf, off);
    if (boxType(buf, off) === "trak") {
      const tkhdOff = findBox(buf, "tkhd", off + 8);
      if (tkhdOff !== -1) {
        const tkhdVer = buf[tkhdOff + 8];
        const tkhdBase = tkhdOff + 8 + 1 + 3;
        // tkhd: creation_time(4/8) + modification_time(4/8) + track_id(4) + reserved(4) + duration(4/8)
        let tkhdDurOff: number;
        if (tkhdVer === 1) {
          tkhdDurOff = tkhdBase + 8 + 8 + 4 + 4;
        } else {
          tkhdDurOff = tkhdBase + 4 + 4 + 4 + 4;
        }
        if (tkhdVer === 1) {
          dv.setBigUint64(tkhdDurOff, BigInt(newDuration));
        } else {
          dv.setUint32(tkhdDurOff, newDuration);
        }
      }
    }
    off += sz;
  }
}

export function stripInitSegment(buf: Uint8Array): Uint8Array {
  let off = 0;
  while (off < buf.length - 8) {
    const t = boxType(buf, off);
    if (t !== "ftyp" && t !== "moov") break;
    off += boxSize(buf, off);
  }
  return buf.slice(off);
}

interface TfraEntry {
  time: number;
  moofOffset: number;
}

interface TrackEntry {
  trackId: number;
  entries: TfraEntry[];
}

export function parseMfra(buf: Uint8Array): { tracks: TrackEntry[]; mfroSize: number } | null {
  const mfraOff = findBox(buf, "mfra");
  if (mfraOff === -1) return null;

  const tracks: TrackEntry[] = [];
  let mfroSize = 0;
  let inner = mfraOff + 8;

  while (inner < mfraOff + boxSize(buf, mfraOff) - 8) {
    const sz = boxSize(buf, inner);
    const t = boxType(buf, inner);

    if (t === "tfra") {
      const version = buf[inner + 8];
      const flags3 = buf[inner + 11];
      const trafNumSz = (flags3 >> 7) & 1;
      const trunNumSz = (flags3 >> 6) & 1;
      const sampNumSz = (flags3 >> 5) & 1;
      const offBytes = version === 1 ? 8 : 4;
      const numBytes = (trafNumSz + 1) + (trunNumSz + 1) + (sampNumSz + 1);

      const base = inner + 12;
      const trackId = u32(buf, base);
      const entryCount = u32(buf, base + 8);
      const entrySize = offBytes * 2 + numBytes;
      const entries: TfraEntry[] = [];
      let entryPos = base + 12;

      for (let i = 0; i < entryCount; i++) {
        const time = version === 1 ? u64(buf, entryPos) : u32(buf, entryPos);
        const moofOff = version === 1 ? u64(buf, entryPos + offBytes) : u32(buf, entryPos + offBytes);
        entries.push({ time, moofOffset: moofOff });

        entryPos += offBytes * 2 + numBytes;
      }

      tracks.push({ trackId, entries });
    } else if (t === "mfro") {
      mfroSize = sz;
    }

    inner += sz;
  }

  return { tracks, mfroSize };
}

export function buildMfra(tracks: TrackEntry[], totalSize: number, cumSizes: number[]): Uint8Array {
  const parts: Uint8Array[] = [];

  for (const track of tracks) {
    const trackBuf = buildTfra(track, cumSizes);
    parts.push(trackBuf);
  }

  // Build mfro
  const mfroSize = 16;
  const mfro = new Uint8Array(mfroSize);
  const dv = new DataView(mfro.buffer, mfro.byteOffset, mfro.byteLength);
  dv.setUint32(0, mfroSize);
  dv.setUint32(4, 0x6d66726f); // "mfro"
  dv.setUint32(8, mfroSize + parts.reduce((s, p) => s + p.length, 0));

  parts.push(mfro);

  const mfraPayload = parts.reduce((a, b) => {
    const c = new Uint8Array(a.length + b.length);
    c.set(a);
    c.set(b, a.length);
    return c;
  }, new Uint8Array(0));

  const mfraSize = 8 + mfraPayload.length;
  const out = new Uint8Array(mfraSize);
  const dv2 = new DataView(out.buffer, out.byteOffset, out.byteLength);
  dv2.setUint32(0, mfraSize);
  dv2.setUint32(4, 0x6d667261); // "mfra"
  out.set(mfraPayload, 8);
  return out;
}

function setU64(buf: Uint8Array, off: number, val: number): void {
  buf[off] = (val >> 56) & 0xff;
  buf[off + 1] = (val >> 48) & 0xff;
  buf[off + 2] = (val >> 40) & 0xff;
  buf[off + 3] = (val >> 32) & 0xff;
  buf[off + 4] = (val >> 24) & 0xff;
  buf[off + 5] = (val >> 16) & 0xff;
  buf[off + 6] = (val >> 8) & 0xff;
  buf[off + 7] = val & 0xff;
}

function buildTfra(track: TrackEntry, cumSizes: number[]): Uint8Array {
  const offBytes = 8;
  const numBytes = 3;
  const entrySize = offBytes * 2 + numBytes;
  const bodySize = 12 + entrySize * track.entries.length;
  const tfraSize = 8 + bodySize;

  const out = new Uint8Array(tfraSize);
  const dv = new DataView(out.buffer, out.byteOffset, out.byteLength);

  dv.setUint32(0, tfraSize);
  dv.setUint32(4, 0x74667261);
  dv.setUint8(8, 1);
  dv.setUint32(9, 0);
  dv.setUint32(12, track.trackId);
  dv.setUint32(16, 0);
  dv.setUint32(20, track.entries.length);

  let entryPos = 24;
  for (let i = 0; i < track.entries.length; i++) {
    const e = track.entries[i];
    const adjustedOff = e.moofOffset + cumSizes[i];
    setU64(out, entryPos, e.time);
    setU64(out, entryPos + 8, adjustedOff);
    entryPos += 16;
    out[entryPos++] = 1;
    out[entryPos++] = 1;
    out[entryPos++] = 1;
  }

  return out;
}

export async function mergeToStream(
  chunks: Uint8Array[],
  controller: ReadableStreamDefaultController<Uint8Array>,
): Promise<void> {
  // Parse mfra from last chunk before we modify anything
  const mfraInfo = parseMfra(chunks[chunks.length - 1]);

  // Compute stripped sizes for cumulative offset calculation
  const chunkSizes: number[] = [];
  for (let i = 0; i < chunks.length; i++) {
    chunkSizes.push(i === 0 ? chunks[i].length : stripInitSegment(chunks[i]).length);
  }

  const cumSizes: number[] = [];
  let running = 0;
  for (const sz of chunkSizes) {
    cumSizes.push(running);
    running += sz;
  }

  // Compute exact total duration from tfdt (in media timescale units)
  const mediaTimescale = readVideoTimescale(chunks[0]);
  let totalDur = computeTotalDuration(chunks);

  // Read mvhd timescale for conversion
  let movieTimescale = 1000;
  const moovOff = findBox(chunks[0], "moov");
  if (moovOff !== -1) {
    const mvhdOff = findBox(chunks[0], "mvhd", moovOff + 8);
    if (mvhdOff !== -1) {
      const version = chunks[0][mvhdOff + 8];
      const base = mvhdOff + 8 + 1 + 3;
      const tsOff = version === 1 ? base + 8 + 8 : base + 4 + 4;
      movieTimescale = u32(chunks[0], tsOff);
    }
  }

  // Convert tfdt total from media timescale to movie timescale
  if (totalDur > 0 && mediaTimescale > 0) {
    totalDur = Math.round(totalDur / mediaTimescale * movieTimescale);
  }
  if (totalDur === 0 && movieTimescale > 0) {
    totalDur = movieTimescale * 1;
  }

  // Enqueue all chunks
  for (let i = 0; i < chunks.length; i++) {
    if (i === 0) {
      updateMoovDuration(chunks[i], totalDur);
      controller.enqueue(chunks[i]);
    } else {
      controller.enqueue(stripInitSegment(chunks[i]));
    }
  }

  // Append adjusted mfra if present
  if (mfraInfo && mfraInfo.tracks.length > 0) {
    const mfra = buildMfra(mfraInfo.tracks, running, cumSizes);
    controller.enqueue(mfra);
  }

  controller.close();
}
