interface PopupConfig {
  popupText: string;
  privacyPolicyUrl: string | null;
  popupYes: string;
  popupNo: string;
  popupFooter: string;
  popupMic: string;
  css: string;
  apiBase: string;
}

function ensureStyle(css: string): void {
  const id = "st-style";
  if (document.getElementById(id)) return;
  const el = document.createElement("style");
  el.id = id;
  el.textContent = css;
  document.head.appendChild(el);
}

function showCard(): { card: HTMLDivElement; cleanup: () => void } {
  const overlay = document.createElement("div");
  overlay.className = "st-overlay";
  const card = document.createElement("div");
  card.className = "st-card";
  overlay.appendChild(card);
  document.body.appendChild(overlay);
  return {
    card,
    cleanup: () => {
      document.body.removeChild(overlay);
      const style = document.getElementById("st-style");
      style?.parentNode?.removeChild(style);
    },
  };
}

function addParagraph(card: HTMLDivElement, text: string): void {
  const p = document.createElement("p");
  p.className = "st-text";
  p.textContent = text;
  card.appendChild(p);
}

function addButtons(
  card: HTMLDivElement,
  yesLabel: string,
  noLabel: string,
  onYes: () => void,
  onNo: () => void,
): HTMLButtonElement {
  const div = document.createElement("div");
  div.className = "st-btns";
  const yes = document.createElement("button");
  yes.className = "st-btn-yes st-btn";
  yes.textContent = yesLabel;
  const no = document.createElement("button");
  no.className = "st-btn-no st-btn";
  no.textContent = noLabel;
  yes.addEventListener("click", onYes);
  no.addEventListener("click", onNo);
  div.appendChild(yes);
  div.appendChild(no);
  card.appendChild(div);
  return yes;
}

export function showConsentPopup(
  config: PopupConfig,
  onYes: () => void,
  onNo: () => void,
): void {
  ensureStyle(config.css);
  const { card, cleanup } = showCard();

  addParagraph(card, config.popupText);

  addButtons(card, config.popupYes, config.popupNo, () => {
    cleanup();
    onYes();
  }, () => {
    cleanup();
    onNo();
  });

  const footer = document.createElement("p");
  footer.className = "st-footer";
  footer.textContent = config.popupFooter;
  card.appendChild(footer);
}

export function showMicConsentPopup(
  config: PopupConfig,
  onYes: () => void,
  onNo: () => void,
): void {
  ensureStyle(config.css);
  const { card, cleanup } = showCard();
  addParagraph(card, config.popupMic);
  addButtons(card, config.popupYes, config.popupNo, () => {
    cleanup();
    onYes();
  }, () => {
    cleanup();
    onNo();
  });
}

export function showMicCheckPopup(
  config: PopupConfig,
  stream: MediaStream,
  onYes: (stream: MediaStream) => void,
  onNo: () => void,
): void {
  ensureStyle(config.css);
  const { card, cleanup } = showCard();

  const audio = document.createElement("audio");
  audio.srcObject = stream;
  audio.muted = false;
  audio.play().catch(() => {});

  addParagraph(card, "Mic check \u2014 can you hear yourself?");
  addButtons(card, "Yes", "Go back", () => {
    audio.pause();
    audio.srcObject = null;
    cleanup();
    onYes(stream);
  }, () => {
    audio.pause();
    audio.srcObject = null;
    cleanup();
    onNo();
  });
}
