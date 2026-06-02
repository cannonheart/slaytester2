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
            showMicConsentPopup(config, () => {
              navigator.mediaDevices.getUserMedia({ audio: true })
                .then((stream) => {
                  showMicCheckPopup(config, stream, (micStream) => {
                    startRecording(config, sessionId, micStream);
                  }, () => {
                    stream.getTracks().forEach((t) => t.stop());
                    showMicConsentPopup(config, () => {
                      navigator.mediaDevices.getUserMedia({ audio: true })
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
    const canvas = document.querySelector("canvas");
    if (!canvas) {
      console.error("[Slaytester] no canvas element found on page");
      return;
    }

    const fps = (config.fps as number) ?? 30;
    console.log("[Slaytester] capturing canvas at", fps, "fps");

    let canvasStream: MediaStream;
    try {
      const ctx = (canvas as HTMLCanvasElement).getContext("2d");
      if (ctx) {
        ctx.globalAlpha = 0.01;
        ctx.fillRect(0, 0, 1, 1);
        ctx.globalAlpha = 1;
      }
      canvasStream = (canvas as HTMLCanvasElement).captureStream(fps);
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

    const filler = audioCtx.createConstantSource();
    filler.offset.value = 0;
    filler.connect(captureDest);
    filler.start();

    function bridgeGameStream(gs: MediaStream) {
      const bridge = audioCtx.createMediaStreamSource(gs);
      bridge.connect(captureDest);
      console.log("[Slaytester] bridged game audio to recorder");
    }

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
      const micGain = audioCtx.createGain();
      micSource.connect(micGain);
      micGain.connect(captureDest);
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

    addEventListener("beforeunload", () => {
      if (handle) handle.stop();
      navigator.sendBeacon(
        `${BASE}/api/recorder/finalize`,
        new Blob([JSON.stringify({ sessionId })], { type: "application/json" }),
      );
    });
  }
})();
