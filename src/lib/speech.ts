// Browser text-to-speech ("Listen" buttons) and one shared speech-to-text engine.

export function speakText(text: string | undefined, accent = "en-US"): void {
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

// Speech recognition is built into Chrome and Edge but is not part of TypeScript's standard
// browser types, so this describes just the parts we use.
interface RecognitionResult {
  isFinal: boolean;
  [index: number]: { transcript: string };
}
interface RecognitionEvent {
  resultIndex: number;
  results: ArrayLike<RecognitionResult>;
}
interface RecognitionErrorEvent {
  error: string;
}
interface Recognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}
type RecognitionConstructor = new () => Recognition;

export interface CaptureOptions {
  lang: string;
  /** What is already in the text box: dictation continues after it. */
  initialText: string;
  onText: (text: string) => void;
  onNotice?: (message: string) => void;
}

// Only one microphone session can run at a time. "owner" says which text box
// is currently being dictated into (for example "sp", "po" or "sc").
let recognition: Recognition | null = null;
let owner: string | null = null;
let baseText = "";
let handlers: Pick<CaptureOptions, "onText" | "onNotice"> | null = null;
const subscribers = new Set<() => void>();

const notify = () => subscribers.forEach((fn) => fn());

export const subscribeCapture = (fn: () => void): (() => void) => {
  subscribers.add(fn);
  return () => {
    subscribers.delete(fn);
  };
};

export const getCaptureOwner = (): string | null => owner;

function finish() {
  owner = null;
  notify();
}

function getRecognition(): Recognition | null {
  const speech = window as unknown as { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor };
  const SpeechRec = speech.SpeechRecognition || speech.webkitSpeechRecognition;
  if (!SpeechRec) return null;
  if (!recognition) {
    recognition = new SpeechRec();
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      if (!owner || !handlers) return;
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]!;
        const piece = result[0]!.transcript;
        if (result.isFinal) {
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

export function startCapture(newOwner: string, { lang, initialText, onText, onNotice }: CaptureOptions): void {
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
  } catch {
    owner = null;
  }
  notify();
}

export function stopCapture(): void {
  if (recognition && owner) {
    try {
      recognition.stop();
    } catch {
      // already stopped
    }
  }
  owner = null;
  notify();
}
