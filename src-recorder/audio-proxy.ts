type Connection = { source: AudioNode; output: number; input: number };

const tracked = new WeakSet<AudioContext>();
const tapped = new WeakSet<AudioContext>();
const pending: Connection[] = [];
let origConnect: Function;

function track(ctx: AudioContext): void {
  tracked.add(ctx);
  if (!(window as any).__slaytesterGameCtx) {
    (window as any).__slaytesterGameCtx = ctx;
  }
}

function sameCtx(node: AudioNode, target: AudioNode): boolean {
  try { node.context; } catch { return false; }
  try { target.context; } catch { return false; }
  return node.context === target.context;
}

const OVERRIDES: (keyof AudioContext)[] = [
  "createGain",
  "createBufferSource",
  "createOscillator",
  "createScriptProcessor",
  "createMediaElementSource",
  "createMediaStreamSource",
];

export function installAudioProxy(): void {
  const Orig = (window as any).AudioContext || (window as any).webkitAudioContext;
  if (!Orig) return;

  for (const name of OVERRIDES) {
    const orig = Orig.prototype[name];
    if (!orig) continue;
    Orig.prototype[name] = function (...args: any[]) {
      track(this);
      return orig.apply(this, args);
    };
  }

  origConnect = (AudioNode.prototype as any).connect;
  (AudioNode.prototype as any).connect = function (
    this: AudioNode,
    target: AudioNode,
    output?: number,
    input?: number,
  ) {
    origConnect.call(this, target, output, input);

    const ctx = this.context as AudioContext;
    if (tracked.has(ctx) && target instanceof AudioDestinationNode) {
      const outIdx = output ?? 0;
      const inIdx = input ?? 0;
      const cd = (window as any).__slaytesterCaptureDest;

      if (!cd || target !== cd) {
        pending.push({ source: this, output: outIdx, input: inIdx });
      }
      if (cd && target !== cd && sameCtx(this, cd)) {
        origConnect.call(this, cd, output, input);
      }
    }
    return target;
  };
}

export function retroactivelyCapture(cd: AudioNode): MediaStream | null {
  const byCtx = new Map<AudioContext, Connection[]>();
  for (const conn of pending) {
    const ctx = conn.source.context as AudioContext;
    if (!ctx || tapped.has(ctx)) continue;
    if (!byCtx.has(ctx)) byCtx.set(ctx, []);
    byCtx.get(ctx)!.push(conn);
  }

  for (const [ctx, conns] of byCtx) {
    tapped.add(ctx);
    const realDest = ctx.destination;
    const tap = ctx.createGain();
    const gameDest = ctx.createMediaStreamDestination();
    origConnect.call(tap, gameDest, 0, 0);
    origConnect.call(tap, realDest, 0, 0);

    for (const conn of conns) {
      try {
        origConnect.call(conn.source, tap, conn.output, 0);
      } catch (err) {
        console.warn("[Slaytester] bridge connection failed:", err);
      }
    }
    return gameDest.stream;
  }
  return null;
}
