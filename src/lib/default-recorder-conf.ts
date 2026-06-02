export const defaultRecorderConfig = {
  popupText:
    "This game is running a playtest! Do you want to join the playtest and record your gameplay?",
  privacyPolicyUrl: null,
  popupYes: "Sure!",
  popupNo: "Nah",
  popupFooter: "powered by Slaytester",

  requestMic: true,
  popupMic: "Enable your microphone for commentary?",

  fps: 30,

  css: `
.st-overlay {
  position:fixed;
  z-index:999999;

  display:flex;
  align-items:center;
  justify-content:center;
  inset:0;

  background:rgba(0,0,0,0.6);
  font-family:sans-serif;
}

.st-card {
  background:#fff;
  border-radius:1rem;
  padding:2rem;
  max-width:20rem;
  width:90%;
  text-align:center;
}

.st-text {
  margin:0 0 1.5rem;
  font-size:1rem;
  color:#000;
  line-height:1.5;
}

.st-footer {
  margin:1.5rem 0 0;
  font-size:0.8rem;
  color:#2b001855;
}

.st-link {
  color:#2b0018;
}

.st-checkbox {
  display:flex;
  align-items:center;
  gap:0.8rem;
  margin-bottom:1.5rem;
  justify-content:center;
  font-size:0.8rem;
}

.st-btns {
  display:flex;
  gap:1rem;
  justify-content:center;
}

.st-btn {
  padding:0.6rem 1.6rem;
  border-radius:0.6rem;
  font-size:1rem;
  cursor:pointer;
}

.st-btn-yes {
  background:#2b0018;
  color:#fff;
}
.st-btn-yes:disabled { opacity:0.4;cursor:default; }

.st-btn-no {
  background:none;
  color:#2b0018;
  border:2px solid #2b0018;
}`,

  bitrate: 1_000_000,
};
