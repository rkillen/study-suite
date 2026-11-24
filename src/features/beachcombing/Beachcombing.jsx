import { useState } from "react";
import { CircleArrowRight, RefreshCw, Volume2 } from "lucide-react";
import { useStudy } from "../../context/StudyContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { pickAnotherIndex } from "../../lib/random.js";
import { speakText } from "../../lib/speech.js";
import { useStoryDraft } from "../storycraft/StoryDraftContext.jsx";

const TIER_LABELS = {
  1: "Tier 1 • Concrete & Sensory",
  2: "Tier 2 • Characters & Settings",
  3: "Tier 3 • Abstract & Philosophical",
};

const TIER_BUTTONS = [
  { tier: 1, label: "Tier 1: Concrete" },
  { tier: 2, label: "Tier 2: Scenes" },
  { tier: 3, label: "Tier 3: Abstract" },
];

export default function Beachcombing() {
  const { library, prefs, updatePrefs, addJot, goToTab } = useStudy();
  const { showToast } = useToast();
  const { patchDraft } = useStoryDraft();
  const [jotText, setJotText] = useState("");

  const tier = prefs.beachTier;
  const pool = library.beachcombing[`tier${tier}`] || library.beachcombing.tier1;
  const word = pool.length ? pool[prefs.beachIndex % pool.length] : "Lantern";

  const setTier = (next) => updatePrefs({ beachTier: next, beachIndex: 0 });

  const drawNextWord = () => {
    updatePrefs({ beachIndex: pickAnotherIndex(pool.length, prefs.beachIndex) });
  };

  const saveJotOnly = () => {
    const text = jotText.trim();
    if (!text) {
      drawNextWord();
      return;
    }
    addJot({ word, text });
    setJotText("");
    drawNextWord();
    showToast(`Saved memory jot for "${word}".`);
  };

  const sendJotToStorycraft = () => {
    const text = jotText.trim();
    if (text) addJot({ word, text });
    setJotText("");
    patchDraft({
      editingId: "",
      title: `Memory: ${word}`,
      body: text,
      promptOverride: `Beachcombing Trigger: ${word}`,
    });
    goToTab("storycraft");
    showToast(`Transferred "${word}" to Storycraft.`);
  };

  return (
    <section className="space-y-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-charcoal-900">Beachcombing</h1>
            <p className="text-xs sm:text-sm text-charcoal-600">Quiet the analytical mind. Let a single word surface an authentic memory before shaping it.</p>
          </div>

          <div className="flex items-center gap-1 bg-alabaster-100 p-1 rounded-xl border border-alabaster-200 self-start">
            {TIER_BUTTONS.map((btn) => (
              <button
                key={btn.tier}
                type="button"
                onClick={() => setTier(btn.tier)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  tier === btn.tier ? "bg-white text-crimson-700 shadow-2xs" : "text-charcoal-600"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        <div className="studio-card rounded-2xl p-8 sm:p-12 text-center space-y-6 border-t-4 border-t-gold-500">
          <div className="flex items-center justify-center gap-2 text-xs font-mono text-charcoal-400">
            <span>{TIER_LABELS[tier] || TIER_LABELS[1]}</span>
            <span>•</span>
            <span>{pool.length} prompts in bank</span>
          </div>

          <div className="py-6">
            <h2 className="font-serif text-4xl sm:text-6xl font-semibold text-charcoal-900 tracking-tight">{word}</h2>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={drawNextWord}
              className="px-5 py-2.5 rounded-xl bg-charcoal-800 hover:bg-charcoal-900 text-white text-xs font-medium flex items-center gap-2 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-gold-300" /> Draw Next Word
            </button>
            <button
              type="button"
              onClick={() => speakText(word, prefs.accent)}
              className="px-3.5 py-2.5 rounded-xl bg-alabaster-50 hover:bg-alabaster-100 border border-alabaster-200 text-xs text-charcoal-800 flex items-center gap-1.5 transition-colors"
            >
              <Volume2 className="w-3.5 h-3.5" /> Listen
            </button>
          </div>
        </div>

        <div className="studio-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <label htmlFor="bc-jot-input" className="text-xs font-semibold uppercase tracking-wider text-charcoal-800">Memory Jot</label>
            <span className="text-xs text-charcoal-400">Capture images, fragments, or a single sentence</span>
          </div>
          <textarea
            id="bc-jot-input"
            rows={3}
            value={jotText}
            onChange={(e) => setJotText(e.target.value)}
            placeholder="What scene, person, or moment comes to mind when you sit with this word?"
            className="w-full rounded-xl bg-alabaster-50 border border-alabaster-200 p-4 text-sm text-charcoal-900 placeholder:text-charcoal-400 focus:outline-none focus:border-crimson-700"
          />

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <button
              type="button"
              onClick={saveJotOnly}
              className="px-4 py-2.5 rounded-xl bg-alabaster-50 hover:bg-alabaster-100 border border-alabaster-200 text-xs font-medium text-charcoal-800 transition-colors"
            >
              Save Jot &amp; Draw Next Word
            </button>
            <button
              type="button"
              onClick={sendJotToStorycraft}
              className="px-5 py-2.5 rounded-xl bg-crimson-700 hover:bg-crimson-800 text-white text-xs font-medium flex items-center gap-2 transition-colors"
            >
              <CircleArrowRight className="w-4 h-4" /> Send Memory Jot to Storycraft
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
