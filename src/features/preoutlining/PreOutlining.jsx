import { useEffect, useState } from "react";
import { Mic, Play, Shuffle } from "lucide-react";
import MicControl from "../../components/MicControl.jsx";
import { useStudy } from "../../context/StudyContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { playGentleChime } from "../../lib/chime.js";
import { pickAnotherIndex } from "../../lib/random.js";
import { stopCapture } from "../../lib/speech.js";

const DURATIONS = [15, 30, 45, 60];
const RING_CIRCUMFERENCE = 213.6;

export default function PreOutlining() {
  const { library, prefs, updatePrefs, addStory } = useStudy();
  const { showToast } = useToast();

  const duration = prefs.outlineDuration;
  const [remaining, setRemaining] = useState(duration);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState("Ready to Outline");
  const [scratchpad, setScratchpad] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [transcript, setTranscript] = useState("");

  const questions = library.preOutliningQuestions;
  const question = questions.length ? questions[prefs.outlineQuestionIndex % questions.length] : "";

  useEffect(() => {
    if (!running) return undefined;
    const id = setInterval(() => setRemaining((r) => r - 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (running && remaining <= 0) {
      setRunning(false);
      setStatus("Time's up — begin speaking");
      playGentleChime();
      showToast("Outline time complete — begin speaking.");
    }
  }, [running, remaining, showToast]);

  const resetTimer = (seconds = duration) => {
    setRunning(false);
    setRemaining(seconds);
    setStatus("Ready to Outline");
  };

  const chooseDuration = (seconds) => {
    updatePrefs({ outlineDuration: seconds });
    resetTimer(seconds);
  };

  const toggleTimer = () => {
    if (running) {
      setRunning(false);
      setStatus("Paused");
      return;
    }
    if (remaining <= 0) setRemaining(duration);
    setRunning(true);
    setStatus("Mapping response...");
  };

  const nextQuestion = () => {
    updatePrefs({ outlineQuestionIndex: pickAnotherIndex(questions.length, prefs.outlineQuestionIndex) });
    setScratchpad("");
    resetTimer();
  };

  const toggleDrawer = () => {
    if (drawerOpen) stopCapture();
    setDrawerOpen(!drawerOpen);
  };

  const saveTranscriptToStoryLog = () => {
    const spoken = transcript.trim();
    if (!spoken) {
      showToast("Capture or enter a spoken response first.");
      return;
    }
    addStory({
      title: `Pre-Outline Response: ${question.slice(0, 42)}${question.length > 42 ? "..." : ""}`,
      prompt: question,
      body: spoken,
    });
    showToast("Saved spoken response to Personal Story Log.");
  };

  const ratio = duration > 0 ? remaining / duration : 0;

  return (
    <section className="space-y-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-charcoal-900">Pre-Outlining</h1>
            <p className="text-xs sm:text-sm text-charcoal-600">Draft a concise map of your response before you begin speaking.</p>
          </div>

          <div className="flex items-center gap-1 bg-alabaster-100 p-1 rounded-xl border border-alabaster-200 self-start">
            {DURATIONS.map((seconds) => (
              <button
                key={seconds}
                type="button"
                onClick={() => chooseDuration(seconds)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                  duration === seconds ? "bg-white text-crimson-700 font-semibold shadow-2xs" : "text-charcoal-600"
                }`}
              >
                {seconds}s
              </button>
            ))}
          </div>
        </div>

        <div className="studio-card rounded-2xl p-6 sm:p-10 space-y-8 border-t-4 border-t-crimson-700">
          <div className="flex items-center justify-between text-xs font-mono text-charcoal-400">
            <span>Question Bank ({questions.length} available)</span>
            <button type="button" onClick={nextQuestion} className="text-crimson-700 hover:underline font-sans font-medium flex items-center gap-1">
              <Shuffle className="w-3.5 h-3.5" /> Next Question
            </button>
          </div>

          <div className="py-2">
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-charcoal-900 leading-snug">{question}</h2>
          </div>

          <div className="pt-4 border-t border-alabaster-200 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 flex items-center justify-center">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="34" fill="none" stroke="#F1F3F5" strokeWidth="5" />
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    fill="none"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={RING_CIRCUMFERENCE}
                    className="transition-all duration-300"
                    style={{
                      strokeDashoffset: RING_CIRCUMFERENCE * (1 - ratio),
                      stroke: remaining === 0 ? "#73121B" : "#9E8349",
                    }}
                  />
                </svg>
                <span className="absolute font-mono text-lg font-semibold text-charcoal-900">{remaining}s</span>
              </div>
              <div className="space-y-0.5">
                <div className="text-sm font-medium text-charcoal-900">{status}</div>
                <p className="text-xs text-charcoal-600">Apply your assigned structure (3PO, 2PO, or 1PO).</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={toggleTimer}
                className="px-5 py-2.5 rounded-xl bg-crimson-700 hover:bg-crimson-800 text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <Play className="w-3.5 h-3.5" /> <span>{running ? "Pause" : "Start Timer"}</span>
              </button>
              <button
                type="button"
                onClick={() => resetTimer()}
                className="px-4 py-2.5 rounded-xl bg-alabaster-50 hover:bg-alabaster-100 border border-alabaster-200 text-xs font-medium text-charcoal-800 transition-colors"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="po-scratchpad" className="text-[11px] font-mono uppercase text-charcoal-400">Quick Outline Scratchpad (Optional)</label>
            <textarea
              id="po-scratchpad"
              rows={3}
              value={scratchpad}
              onChange={(e) => setScratchpad(e.target.value)}
              placeholder="Jot key words or bullet anchors here..."
              className="w-full rounded-xl bg-alabaster-50 border border-alabaster-200 p-3.5 text-sm text-charcoal-900 placeholder:text-charcoal-400 focus:outline-none focus:border-crimson-700"
            />
          </div>

          <div className="pt-4 border-t border-alabaster-200 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <button type="button" onClick={toggleDrawer} className="text-xs font-medium text-crimson-700 hover:text-crimson-800 flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5" />
                <span>{drawerOpen ? "Hide Speak & Capture Aloud" : "Open Speak & Capture Aloud"}</span>
              </button>
              <span className="text-[11px] font-mono text-charcoal-400">Deliver your outlined response out loud</span>
            </div>

            {drawerOpen && (
              <div className="p-4 rounded-xl bg-alabaster-50 border border-alabaster-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <MicControl id="po" idleLabel="Start Speaking" text={transcript} onText={setTranscript} />
                  <button
                    type="button"
                    onClick={saveTranscriptToStoryLog}
                    className="px-3.5 py-2 rounded-xl bg-charcoal-800 hover:bg-charcoal-900 text-white text-xs font-medium"
                  >
                    Save to Story Log
                  </button>
                </div>

                <textarea
                  rows={3}
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="Your spoken delivery will transcribe here in real time (or you can type/edit directly)..."
                  className="w-full rounded-xl bg-white border border-alabaster-200 p-3 text-sm text-charcoal-900 placeholder:text-charcoal-400 focus:outline-none focus:border-crimson-700"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
