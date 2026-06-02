import { showConsentPopup, showMicConsentPopup, showMicCheckPopup } from "./popup.ts";
import { startCapture } from "./capture.ts";
import { installAudioProxy, retroactivelyCapture } from "./audio-proxy.ts";
import { defaultRecorderConfig } from "../src/lib/default-recorder-conf.ts";

(function () {
  installAudioProxy();

  const script = document.currentScript;
  const playtestId = script?.getAttribute("data-playtest-id");
  if (!playtestId) {
    console.warn("[Slaytester] no data-playtest-id found on script tag");
    return;
  }

  console.log("[Slaytester] loaded for playtest:", playtestId);

  const SCRIPT_URL = script?.src ?? "";
  const BASE = SCRIPT_URL.replace(/\/recorder\.js(\?.*)?$/, "");
  console.log("[Slaytester] base URL:", BASE);

  fetch(`${BASE}/api/recorder/config?playtestId=${playtestId}`)
    .then((r) => {
      if (!r.ok) throw new Error(`config fetch returned ${r.status}`);
      return r.json();
    })
    .then((serverConfig) => {
      if (serverConfig.availableSlots === 0) {
        console.log("[Slaytester] playtest is full, exiting");
        return;
      }

      const config = { ...defaultRecorderConfig, ...serverConfig, apiBase: BASE };
      console.log("[Slaytester] config received:", config);

      showConsentPopup(config, () => {
        // Claim a slot
        fetch(`${BASE}/api/recorder/session`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ playtestId }),
        })
          .then((r) => {
            if (r.status === 409) {
              console.log("[Slaytester] playtest is full");
              showFullMessage(config);
              return;
            }
            if (!r.ok) throw new Error(`session claim returned ${r.status}`);
            return r.json();
          })
          .then((data) => {
            if (!data?.sessionId) return;
            const sessionId = data.sessionId;
            console.log("[Slaytester] session claimed:", sessionId);

            if (!config.requestMic) {
              startRecording(config, sessionId, null);
              return;
            }
            if (!navigator.mediaDevices) {
              showMicNotAvailable(config);
              return;
            }
            showMicConsentPopup(config, () => {
              navigator.mediaDevices.getUserMedia({ audio: { autoGainControl: false, echoCancellation: false, noiseSuppression: false } })
                .then((stream) => {
                  showMicCheckPopup(config, stream, (micStream) => {
                    startRecording(config, sessionId, micStream);
                  }, () => {
                    stream.getTracks().forEach((t) => t.stop());
                    showMicConsentPopup(config, () => {
                      navigator.mediaDevices.getUserMedia({ audio: { autoGainControl: false, echoCancellation: false, noiseSuppression: false } })
                        .then((s) => showMicCheckPopup(config, s,
                          (ms) => startRecording(config, sessionId, ms),
                          () => { s.getTracks().forEach((t) => t.stop()); },
                        ));
                    }, () => startRecording(config, sessionId, null));
                  });
                })
                .catch((err) => {
                  console.warn("[Slaytester] getUserMedia failed, recording without mic:", err);
                  startRecording(config, sessionId, null);
                });
            }, () => startRecording(config, sessionId, null));
          })
          .catch((err) => console.error("[Slaytester] failed to claim session:", err));
      }, () => console.log("[Slaytester] recording declined by user"));
    })
    .catch((err) => console.error("[Slaytester] failed to fetch config:", err));

  function showMicNotAvailable(config: Record<string, unknown>) {
    const overlay = document.createElement("div");
    overlay.className = "st-overlay";
    const card = document.createElement("div");
    card.className = "st-card";
    const p = document.createElement("p");
    p.className = "st-text";
    p.textContent = "Microphone access requires HTTPS or getting served from localhost. Recording without mic.";
    card.appendChild(p);
    const btn = document.createElement("button");
    btn.className = "st-btn-yes st-btn";
    btn.textContent = "OK";
    btn.addEventListener("click", () => document.body.removeChild(overlay));
    card.appendChild(btn);
    overlay.appendChild(card);
    document.body.appendChild(overlay);
    const styleId = "st-style";
    if (!document.getElementById(styleId)) {
      const el = document.createElement("style");
      el.id = styleId;
      el.textContent = config.css as string;
      document.head.appendChild(el);
    }
  }

  function showFullMessage(config: Record<string, unknown>) {
    const overlay = document.createElement("div");
    overlay.className = "st-overlay";
    const card = document.createElement("div");
    card.className = "st-card";
    const p = document.createElement("p");
    p.className = "st-text";
    p.textContent = "This playtest is full. Thanks for your interest!";
    card.appendChild(p);
    overlay.appendChild(card);
    document.body.appendChild(overlay);
    const styleId = "st-style";
    if (!document.getElementById(styleId)) {
      const el = document.createElement("style");
      el.id = styleId;
      el.textContent = config.css as string;
      document.head.appendChild(el);
    }
  }

  async function startRecording(
    config: Record<string, unknown>,
    sessionId: string,
    micStream: MediaStream | null,
  ) {
    function logCanvasInfo(): void {
      const all = document.querySelectorAll("canvas");
      console.log(`[Slaytester] Found ${all.length} canvas(es):`);
      all.forEach((c, i) => {
        const r = c.getBoundingClientRect();
        console.log(`  [${i}] id="${c.id}" class="${c.className}" internal=${c.width}x${c.height} css=${Math.round(r.width)}x${Math.round(r.height)} visible=${r.width > 0 && r.height > 0}`);
      });
    }

    const fps = (config.fps as number) ?? 30;
    console.log("[Slaytester] capturing canvas at", fps, "fps");

    // Wait for a game canvas with reasonable dimensions
    logCanvasInfo();
    let gameCanvas: HTMLCanvasElement | null = null;
    for (let attempt = 0; attempt < 20; attempt++) {
      for (const c of document.querySelectorAll("canvas")) {
        const cr = c.getBoundingClientRect();
        if (c.width > 0 && c.height > 0 && cr.width > 0 && cr.height > 0) {
          gameCanvas = c;
          break;
        }
      }
      if (gameCanvas) break;
      await new Promise((r) => setTimeout(r, 1000));
    }
    if (!gameCanvas) {
      console.error("[Slaytester] No suitable canvas found after 20s");
      logCanvasInfo();
      return;
    }
    console.log("[Slaytester] Selected canvas:", gameCanvas.id || "(no id)", gameCanvas.width, "x", gameCanvas.height);

    let recordW = Math.round(gameCanvas.getBoundingClientRect().width) || gameCanvas.width;
    let recordH = Math.round(gameCanvas.getBoundingClientRect().height) || gameCanvas.height;
    console.log("[Slaytester] recording at:", recordW, "x", recordH);

    let canvasStream: MediaStream;
    try {
      const capture = document.createElement("canvas");
      capture.width = recordW;
      capture.height = recordH;
      capture.style.position = "fixed";
      capture.style.left = "-9999px";
      capture.style.top = "0";
      document.body.appendChild(capture);

      const ctx2d = capture.getContext("2d")!;
      ctx2d.imageSmoothingEnabled = false;

      // Log size changes but don't resize — captureStream is locked to initial size
      const resizeObserver = new ResizeObserver(() => {
        const rect = gameCanvas!.getBoundingClientRect();
        const newW = Math.round(rect.width) || gameCanvas!.width;
        const newH = Math.round(rect.height) || gameCanvas!.height;
        if (newW !== recordW || newH !== recordH) {
          console.log("[Slaytester] Canvas size changed:", recordW, "x", recordH, "→", newW, "x", newH, "(recording continues at", recordW, "x", recordH, ")");
        }
      });
      resizeObserver.observe(gameCanvas);

      // Draw first frame synchronously so captureStream has content
      ctx2d.drawImage(gameCanvas, 0, 0, recordW, recordH);

      // Continue drawing each frame
      let frame = 0;
      (function copy() {
        ctx2d.drawImage(gameCanvas!, 0, 0, recordW, recordH);
        ctx2d.fillStyle = frame % 2 === 0 ? "#000" : "#fff";
        ctx2d.fillRect(0, 0, 2, 2);
        frame++;
        requestAnimationFrame(copy);
      })();

      canvasStream = capture.captureStream(fps);
    } catch (err) {
      console.error("[Slaytester] canvas.captureStream failed:", err);
      return;
    }

    const videoTracks = canvasStream.getVideoTracks();
    console.log("[Slaytester] canvas video tracks:", videoTracks.length);
    if (videoTracks.length === 0) {
      console.warn("[Slaytester] canvas has no video tracks");
    }

    console.log("[Slaytester] session ID:", sessionId);

    let audioCtx: AudioContext;
    try {
      audioCtx = new AudioContext();
      console.log("[Slaytester] audioCtx state:", audioCtx.state);
      if (audioCtx.state === "suspended") {
        await audioCtx.resume();
        console.log("[Slaytester] audioCtx resumed");
      }
    } catch (err) {
      console.error("[Slaytester] failed to create AudioContext:", err);
      return;
    }

    const captureDest = audioCtx.createMediaStreamDestination();
    (window as any).__slaytesterCaptureDest = captureDest;
    console.log("[Slaytester] capture destination created");

    function showRecordingIndicator() {
      if (document.getElementById("st-rec-indicator")) return;
      if (!document.getElementById("st-rec-style")) {
        const style = document.createElement("style");
        style.id = "st-rec-style";
        style.textContent = `@keyframes st-rec-pulse{0%,100%{opacity:1}50%{opacity:0.3}}`;
        document.head.appendChild(style);
      }
      const el = document.createElement("div");
      el.id = "st-rec-indicator";
      Object.assign(el.style, {
        position: "fixed", top: "12px", right: "12px",
        background: "rgba(0,0,0,0.65)", color: "#fff",
        fontFamily: "sans-serif", fontSize: "13px",
        padding: "6px 14px", borderRadius: "20px",
        zIndex: "999999", display: "flex",
        alignItems: "center", gap: "6px",
        pointerEvents: "none",
      });
      el.innerHTML = '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#ff4444;animation:st-rec-pulse 1.5s infinite"></span> REC';
      document.body.appendChild(el);
    }

    const finalGain = audioCtx.createGain();
    finalGain.gain.value = 1.0;
    finalGain.connect(captureDest);

    const filler = audioCtx.createConstantSource();
    filler.offset.value = 0;
    filler.connect(finalGain);
    filler.start();

    function bridgeGameStream(gs: MediaStream) {
      try {
        const bridge = audioCtx.createMediaStreamSource(gs);
        const gameGain = audioCtx.createGain();
        gameGain.gain.value = 0.38;
        bridge.connect(gameGain);
        gameGain.connect(finalGain);
        console.log("[Slaytester] bridged game audio to recorder");
      } catch (err) {
        console.error("[Slaytester] failed to bridge game audio:", err);
      }
    }

    // Poll for game audio context that may init after the recorder starts
    const initialStream = retroactivelyCapture(captureDest);
    if (initialStream) {
      bridgeGameStream(initialStream);
    } else {
      const pollTimer = setInterval(() => {
        const gs = retroactivelyCapture(captureDest);
        if (gs) {
          clearInterval(pollTimer);
          bridgeGameStream(gs);
        }
      }, 1000);
    }

    if (micStream) {
      const micTracks = micStream.getAudioTracks();
      console.log("[Slaytester] connecting mic:", micTracks.length, "track(s)");
      const micSource = audioCtx.createMediaStreamSource(micStream);
      const compressor = audioCtx.createDynamicsCompressor();
      compressor.threshold.value = -25;
      compressor.ratio.value = 15;
      compressor.attack.value = 0.005;
      compressor.release.value = 0.15;
      const micGain = audioCtx.createGain();
      micGain.gain.value = 1.3;
      micSource.connect(compressor);
      compressor.connect(micGain);
      micGain.connect(finalGain);
    } else {
      console.log("[Slaytester] no mic stream, recording without microphone");
    }

    console.log("[Slaytester] capture dest audio tracks:", captureDest.stream.getAudioTracks().length);

    const combinedTracks: MediaStreamTrack[] = [
      ...videoTracks,
      ...captureDest.stream.getAudioTracks(),
    ];
    const combinedStream = new MediaStream(combinedTracks);
    console.log("[Slaytester] combined stream tracks:", combinedStream.getTracks().length);

    const handle = startCapture(
      BASE,
      sessionId,
      config as { bitrate: number },
      combinedStream,
    );

    showRecordingIndicator();

    addEventListener("beforeunload", () => {
      if (handle) handle.stop();
    });
  }
})();
