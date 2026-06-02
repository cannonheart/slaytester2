export function buildChunkRequest(
  baseUrl: string,
  sessionId: string,
  chunkIndex: number,
  chunkTime: number,
  blob: Blob,
): { url: string; body: FormData } {
  const body = new FormData();
  body.append("sessionId", sessionId);
  body.append("chunkIndex", String(chunkIndex));
  body.append("chunkTime", String(chunkTime));
  body.append("blob", blob, `${chunkIndex}_${chunkTime}.mp4`);
  return { url: `${baseUrl}/api/recorder/upload`, body };
}

export function startCapture(
  baseUrl: string,
  sessionId: string,
  config: { bitrate: number },
  stream: MediaStream,
): { stop: () => void } {
  const mime = MediaRecorder.isTypeSupported("video/mp4;codecs=avc3")
    ? "video/mp4;codecs=avc3"
    : "video/mp4";
  console.log("[Slaytester] MediaRecorder mime:", mime);

  if (!MediaRecorder.isTypeSupported(mime)) {
    console.error("[Slaytester] video/mp4 not supported by MediaRecorder");
    return { stop: () => {} };
  }

  let recorder: MediaRecorder;
  try {
    recorder = new MediaRecorder(stream, {
      mimeType: mime,
      videoBitsPerSecond: config.bitrate,
    });
  } catch (err) {
    console.error("[Slaytester] MediaRecorder constructor failed:", err);
    return { stop: () => {} };
  }

  console.log("[Slaytester] MediaRecorder created:", {
    mimeType: recorder.mimeType,
    state: recorder.state,
    videoBitsPerSecond: (recorder as any).videoBitsPerSecond,
  });

  recorder.onstart = () => {
    console.log("[Slaytester] MediaRecorder started, state:", recorder.state);
  };
  recorder.onstop = () => {
    console.log("[Slaytester] MediaRecorder stopped, state:", recorder.state);
  };
  recorder.onerror = () => {
    console.error("[Slaytester] MediaRecorder error:", recorder.error);
    window.dispatchEvent(new CustomEvent("slaytester:error", {
      detail: { message: `MediaRecorder error: ${recorder.error?.message}`, chunkIndex },
    }));
  };

  let chunkIndex = 0;
  recorder.ondataavailable = (e) => {
    console.log(`[Slaytester] ondataavailable fired, size: ${e.data.size}`);
    if (e.data.size === 0) return;
    const idx = chunkIndex++;
    const chunkTime = Math.floor(performance.now());
    const { url, body } = buildChunkRequest(
      baseUrl,
      sessionId,
      idx,
      chunkTime,
      e.data,
    );
    console.log(
      `[Slaytester] Uploading chunk ${idx} (${e.data.size} bytes) to ${url}`,
    );
    fetch(url, { method: "POST", body })
      .then((res) => {
        if (!res.ok) {
          console.error(
            `[Slaytester] Upload failed for chunk ${idx}: ${res.status} ${res.statusText}`,
          );
          window.dispatchEvent(new CustomEvent("slaytester:error", {
            detail: { message: `Upload failed: HTTP ${res.status}`, chunkIndex: idx },
          }));
        } else {
          console.log(`[Slaytester] Chunk ${idx} uploaded`);
        }
      })
      .catch((err) => {
        console.error(`[Slaytester] Network error uploading chunk ${idx}:`, err);
        window.dispatchEvent(new CustomEvent("slaytester:error", {
          detail: { message: `Network error: ${(err as Error).message}`, chunkIndex: idx },
        }));
      });
  };

  stream.getTracks().forEach((t) =>
    console.log("[Slaytester] track:", t.kind, "readyState:", t.readyState, "enabled:", t.enabled, "muted:", t.muted)
  );

  try {
    recorder.start(1000);
    console.log("[Slaytester] recorder.start(1000) called successfully, state:", recorder.state);
  } catch (err) {
    console.error("[Slaytester] recorder.start failed:", err);
    window.dispatchEvent(new CustomEvent("slaytester:error", {
      detail: { message: `recorder.start failed: ${(err as Error).message}` },
    }));
    return { stop: () => {} };
  }

  setTimeout(() => {
    console.log("[Slaytester] recorder state 2s after start:", recorder.state);
  }, 2000);

  return {
    stop: () => {
      if (recorder.state !== "inactive") {
        console.log("[Slaytester] Stopping recorder");
        recorder.stop();
      }
    },
  };
}
