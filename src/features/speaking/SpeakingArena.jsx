import { useState } from "react";
import { BookmarkPlus, Copy, CirclePlus, Volume2 } from "lucide-react";
import MicControl from "../../components/MicControl.jsx";
import { useStudy } from "../../context/StudyContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { speakText, stopCapture } from "../../lib/speech.js";
import { countWords } from "../../lib/text.js";

const FALLBACK_SCENARIO = {
  domain: "Custom Scenario",
  title: "No scenario loaded",
  context: "Use Custom Live Scenario to add one.",
  prompt: "",
};

const CHECKLIST = [
  ["Clear Opening Stance:", "Did I answer the prompt directly in my first sentence?"],
  ["Concrete Anchor:", "Did I include a specific example, scene, or metric?"],
  ["Deliberate Landing:", "Did I close cleanly without trailing off?"],
];

export default function SpeakingArena() {
  const { clientProfile, prefs, addStory } = useStudy();
  const { showToast } = useToast();

  const [liveScenarios, setLiveScenarios] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [customOpen, setCustomOpen] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const [customContext, setCustomContext] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [transcript, setTranscript] = useState("");

  const scenarios = [...liveScenarios, ...clientProfile.scenarios];
  const current = scenarios[activeIndex] || scenarios[0] || FALLBACK_SCENARIO;

  const applyCustomScenario = () => {
    const prompt = customPrompt.trim();
    if (!prompt) {
      showToast("Enter a spoken prompt to load into the Arena.");
      return;
    }
    setLiveScenarios((list) => [
      {
        id: `scn_custom_${Date.now()}`,
        domain: "Custom Live Scenario",
        title: customTitle.trim() || "Live Session Scenario",
        context: customContext.trim() || "Custom practice scenario created during live session.",
        prompt,
      },
      ...list,
    ]);
    setActiveIndex(0);
    setCustomTitle("");
    setCustomContext("");
    setCustomPrompt("");
    setCustomOpen(false);
    showToast("Loaded custom scenario into Speaking Arena.");
  };

  const clearTranscript = () => {
    stopCapture();
    setTranscript("");
  };

  const copyTranscript = async () => {
    if (!transcript.trim()) {
      showToast("Nothing to copy yet.");
      return;
    }
    try {
      await navigator.clipboard.writeText(transcript);
      showToast("Copied transcript to clipboard.");
    } catch (e) {
      showToast("Could not copy automatically—select the text and copy it manually.");
    }
  };

  const saveToStoryLog = () => {
    const spoken = transcript.trim();
    if (!spoken) {
      showToast("Record or type a response before saving.");
      return;
    }
    addStory({ title: `Arena: ${current.title}`, prompt: current.prompt, body: spoken });
    showToast("Saved Arena transcript to Personal Story Log.");
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-charcoal-900">Speaking Arena</h1>
          <p className="text-xs sm:text-sm text-charcoal-600">Rehearse executive scenarios aloud, capture live transcripts, and save responses for coaching review.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCustomOpen(!customOpen)}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-alabaster-50 border border-alabaster-200 text-xs font-medium text-charcoal-800 flex items-center gap-1.5 transition-colors"
          >
            <CirclePlus className="w-3.5 h-3.5 text-crimson-700" /> Custom Live Scenario
          </button>
        </div>
      </div>

      {customOpen && (
        <div className="studio-card rounded-2xl p-5 space-y-3 border-crimson-700/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-crimson-700">On-the-Spot Custom Scenario</span>
            <button type="button" onClick={() => setCustomOpen(false)} className="text-xs text-charcoal-400 hover:text-charcoal-900">Close</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="Scenario title (e.g., Board Q&A Pushback)"
              className="rounded-xl bg-alabaster-50 border border-alabaster-200 px-3.5 py-2 text-xs text-charcoal-900"
            />
            <input
              type="text"
              value={customContext}
              onChange={(e) => setCustomContext(e.target.value)}
              placeholder="Context / partner role..."
              className="rounded-xl bg-alabaster-50 border border-alabaster-200 px-3.5 py-2 text-xs text-charcoal-900"
            />
            <input
              type="text"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Spoken prompt to answer..."
              className="rounded-xl bg-alabaster-50 border border-alabaster-200 px-3.5 py-2 text-xs text-charcoal-900"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={applyCustomScenario}
              className="px-4 py-2 rounded-xl bg-crimson-700 hover:bg-crimson-800 text-white text-xs font-medium"
            >
              Load Scenario into Arena
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {scenarios.map((scenario, idx) => (
          <button
            key={scenario.id}
            type="button"
            onClick={() => setActiveIndex(idx)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              idx === activeIndex
                ? "bg-crimson-700 text-white"
                : "bg-white hover:bg-alabaster-50 border border-alabaster-200 text-charcoal-800"
            }`}
          >
            {scenario.title}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 studio-card rounded-2xl p-6 space-y-5 border-t-4 border-t-crimson-700">
          <div className="p-5 rounded-xl bg-alabaster-50 border border-alabaster-200 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-gold-600">{current.domain || "Custom Scenario"}</span>
              <button
                type="button"
                onClick={() => speakText(current.prompt, prefs.accent)}
                className="px-3 py-1.5 rounded-lg bg-white hover:bg-alabaster-100 border border-alabaster-200 text-xs font-medium text-charcoal-800 flex items-center gap-1.5 transition-colors"
              >
                <Volume2 className="w-3.5 h-3.5 text-crimson-700" /> Read Prompt Aloud
              </button>
            </div>
            <h2 className="font-serif text-xl font-semibold text-charcoal-900">{current.title}</h2>
            <p className="text-xs text-charcoal-600 leading-relaxed">{current.context}</p>
            <div className="pt-2 border-t border-alabaster-200">
              <div className="text-[11px] font-mono uppercase text-charcoal-400 mb-1">Partner Prompt</div>
              <p className="font-serif text-base sm:text-lg text-charcoal-900 leading-snug">{current.prompt}</p>
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <MicControl id="sp" idleLabel="Start Live Mic" text={transcript} onText={setTranscript} large />
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono text-charcoal-400">{countWords(transcript)} words</span>
                <button type="button" onClick={clearTranscript} className="text-xs text-charcoal-400 hover:text-charcoal-900">
                  Clear Transcript
                </button>
              </div>
            </div>

            <textarea
              rows={6}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Click 'Start Live Mic' and speak your response naturally—or type/edit your transcript directly here..."
              className="w-full rounded-xl bg-alabaster-50 border border-alabaster-200 p-4 text-sm text-charcoal-900 leading-relaxed placeholder:text-charcoal-400 focus:outline-none focus:border-crimson-700"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <button
              type="button"
              onClick={copyTranscript}
              className="px-4 py-2.5 rounded-xl bg-alabaster-50 hover:bg-alabaster-100 border border-alabaster-200 text-xs font-medium text-charcoal-800 flex items-center gap-1.5 transition-colors"
            >
              <Copy className="w-3.5 h-3.5 text-charcoal-600" /> Copy Transcript
            </button>

            <button
              type="button"
              onClick={saveToStoryLog}
              className="px-5 py-2.5 rounded-xl bg-charcoal-800 hover:bg-charcoal-900 text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <BookmarkPlus className="w-4 h-4 text-gold-300" /> Save Transcript to Story Log
            </button>
          </div>
        </div>

        <div className="lg:col-span-4 studio-card rounded-2xl p-6 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-alabaster-200 pb-3">
              <h2 className="font-serif text-lg font-semibold text-charcoal-900">Self-Review Checklist</h2>
              <span className="text-[11px] font-mono text-gold-600">Delivery</span>
            </div>

            <p className="text-xs text-charcoal-600 leading-relaxed">
              Review your captured transcript against your session focus points before saving it for live discussion:
            </p>

            <div className="space-y-2.5">
              {CHECKLIST.map(([heading, question]) => (
                <label key={heading} className="flex items-start gap-2.5 p-3 rounded-xl bg-alabaster-50 border border-alabaster-200 cursor-pointer">
                  <input type="checkbox" className="mt-0.5 accent-crimson-700 rounded" />
                  <span className="text-xs text-charcoal-800 leading-snug">
                    <strong>{heading}</strong> {question}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-gold-100/60 border border-gold-300/60 text-[11px] text-charcoal-600 leading-relaxed">
            Tip: Once hosted on HTTPS, your browser remembers microphone permission across all modules automatically.
          </div>
        </div>
      </div>
    </section>
  );
}
