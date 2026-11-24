// Browser text-to-speech ("Listen" buttons) and one shared speech-to-text engine.

export function speakText(text, accent = "en-US") {
  if (!("speechSynthesis" in window) || !text) return;
  const clean = text.replace(/[«»"]/g, "").trim();
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(clean);
  utterance.lang = accent;
  utterance.rate = 0.95;
  const voices = window.speechSynthesis.getVoices();
  const match = voices.find((v) => v.lang === accent) || voices.find((v) => v.lang.startsWith("en"));
  if (match) utterance.voice = match;
  window.speechSynthesis.speak(utterance);
}

// Only one microphone session can run at a time. "owner" says which text box
// is currently being dictated into (for example "sp", "po" or "sc").
let recognition = null;
let owner = null;
let baseText = "";
let handlers = null;
const subscribers = new Set();

const notify = () => subscribers.forEach((fn) => fn());

export const subscribeCapture = (fn) => {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
};

export const getCaptureOwner = () => owner;

function finish() {
  owner = null;
  notify();
}

function getRecognition() {
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRec) return null;
  if (!recognition) {
    recognition = new SpeechRec();
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      if (!owner || !handlers) return;
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const piece = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          baseText += piece.trim() + " ";
        } else {
          interim += piece;
        }
      }
      handlers.onText((baseText + interim).trim());
    };

    recognition.onerror = (event) => {
      if (event.error !== "aborted" && event.error !== "no-speech") {
        handlers?.onNotice?.(`Microphone notice: ${event.error}`);
      }
      finish();
    };

    recognition.onend = finish;
  }
  return recognition;
}

export function startCapture(newOwner, { lang, initialText, onText, onNotice }) {
  const rec = getRecognition();
  if (!rec) {
    onNotice?.("Live speech recognition is unavailable in this browser—type or paste your transcript directly.");
    return;
  }
  if (owner) stopCapture();

  baseText = initialText.trim() ? initialText.trim() + " " : "";
  handlers = { onText, onNotice };
  owner = newOwner;
  rec.lang = lang;

  try {
    rec.start();
  } catch (e) {
    owner = null;
  }
  notify();
}

export function stopCapture() {
  if (recognition && owner) {
    try {
      recognition.stop();
    } catch (e) {
      // already stopped
    }
  }
  owner = null;
  notify();
}
