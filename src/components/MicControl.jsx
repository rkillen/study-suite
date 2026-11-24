import { Mic } from "lucide-react";
import { useStudy } from "../context/StudyContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { useSpeechCapture } from "../lib/useSpeechCapture.js";

// Start/stop microphone button plus its status text.
// "text" is what is already in the box; "onText" receives the live transcript.
export default function MicControl({ id, idleLabel, text, onText, large = false }) {
  const { prefs } = useStudy();
  const { showToast } = useToast();
  const { listening, start, stop } = useSpeechCapture(id);

  const toggle = () => {
    if (listening) {
      stop();
    } else {
      start({ lang: prefs.accent, initialText: text, onText, onNotice: showToast });
    }
  };

  const sizeClass = large ? "px-4 py-2.5 gap-2" : "px-4 py-2 gap-1.5";
  const colorClass = listening ? "mic-recording bg-charcoal-900" : "bg-crimson-700 hover:bg-crimson-800";

  return (
    <div className={`flex items-center ${large ? "gap-2.5" : "gap-2"}`}>
      <button
        type="button"
        onClick={toggle}
        className={`rounded-xl text-white text-xs font-medium flex items-center transition-colors ${sizeClass} ${colorClass}`}
      >
        <Mic className={large ? "w-4 h-4" : "w-3.5 h-3.5"} /> <span>{listening ? "Stop Recording" : idleLabel}</span>
      </button>
      <span className={`font-mono text-charcoal-400 ${large ? "text-xs" : "text-[11px]"}`}>
        {listening ? `Listening (${prefs.accent})...` : "Ready"}
      </span>
    </div>
  );
}
