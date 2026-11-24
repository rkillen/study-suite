import { useState } from "react";
import { Feather, Layers, Mic, Shuffle, Timer, Waves } from "lucide-react";
import { useStudy } from "../../context/StudyContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { shuffled } from "../../lib/random.js";

const pickThree = (items) => shuffled(items).slice(0, 3);

const MODULES = [
  { tab: "beachcombing", icon: Waves, title: "Beachcombing", text: "Surface unconscious memories from tiered trigger words.", tone: "gold" },
  { tab: "preoutlining", icon: Timer, title: "Pre-Outlining", text: "Map your response structure under a 15s–60s countdown.", tone: "crimson" },
  { tab: "storycraft", icon: Feather, title: "Storycraft Log", text: "Draw story prompts and build your personal story archive.", tone: "gold" },
  { tab: "speaking", icon: Mic, title: "Speaking Arena", text: "Rehearse scenarios aloud and capture transcripts for review.", tone: "crimson" },
  { tab: "flashcards", icon: Layers, title: "20-Card Deck", text: "Oxford B2, Phrasal Verbs, Idioms, and Interview Questions.", tone: "gold" },
];

export default function Overview() {
  const { clientId, clientProfile, library, progress, goToTab } = useStudy();
  const { showToast } = useToast();
  const [watchOuts, setWatchOuts] = useState(() => pickThree(clientProfile.watchOuts));

  const shuffleWatchOuts = () => {
    setWatchOuts(pickThree(clientProfile.watchOuts));
    showToast("Rotated 3 client focus points.");
  };

  const totalCards = Object.values(library.flashcards).reduce((sum, cards) => sum + cards.length, 0);
  const totalPrompts =
    library.beachcombing.tier1.length +
    library.beachcombing.tier2.length +
    library.beachcombing.tier3.length +
    library.preOutliningQuestions.length +
    library.storyPrompts.length;

  const stats = [
    { label: "Beachcombing Jots", value: progress.jotCount, note: "Memories captured" },
    { label: "Personal Story Log", value: progress.stories.length, note: "Saved stories & transcripts" },
    { label: "Cards Mastered", value: progress.masteredIds.length, note: "Rolling 20-card queue", accent: true },
    { label: "Active Library", value: (totalCards + totalPrompts).toLocaleString(), note: "Prompts & cards loaded" },
  ];

  return (
    <section className="space-y-8">
      <div className="studio-card rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border-l-4 border-l-crimson-700">
        <div className="space-y-2 max-w-2xl">
          <div className="text-xs font-mono uppercase tracking-wider text-gold-600">Executive Practice Workspace</div>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-charcoal-900 leading-tight">
            Quiet the mind, structure the thought, and own your narrative.
          </h1>
          <p className="text-sm text-charcoal-600 leading-relaxed">
            Move freely between modules in any order. Capture associative memories in Beachcombing, practice rapid framing in Pre-Outlining, archive stories in Storycraft, rehearse aloud in the Speaking Arena, and sharpen precision with your rolling 20-card deck.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => goToTab("flashcards")}
            className="px-4 py-2.5 rounded-xl bg-crimson-700 hover:bg-crimson-800 text-white text-xs font-medium transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Layers className="w-3.5 h-3.5" /> Open 20-Card Deck
          </button>
          <button
            type="button"
            onClick={() => goToTab("beachcombing")}
            className="px-4 py-2.5 rounded-xl bg-alabaster-50 hover:bg-alabaster-100 border border-alabaster-200 text-charcoal-900 text-xs font-medium transition-colors flex items-center gap-1.5"
          >
            <Waves className="w-3.5 h-3.5 text-gold-600" /> Beachcombing
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="studio-card rounded-2xl p-5 space-y-1">
            <div className="text-[11px] font-mono uppercase text-charcoal-400">{stat.label}</div>
            <div className={`font-serif text-2xl sm:text-3xl font-semibold ${stat.accent ? "text-crimson-700" : "text-charcoal-900"}`}>
              {stat.value}
            </div>
            <div className="text-xs text-charcoal-400">{stat.note}</div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-xl font-semibold text-charcoal-900">Things to Watch Out For</h2>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-gold-100 text-gold-600 border border-gold-300/60">
                Client: {clientId}
              </span>
            </div>
            <p className="text-xs text-charcoal-600 mt-0.5">Custom focus points tailored to your profile—rotated automatically each session.</p>
          </div>
          <button
            type="button"
            onClick={shuffleWatchOuts}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-alabaster-50 border border-alabaster-200 text-xs font-medium text-charcoal-800 flex items-center gap-1.5 transition-colors"
          >
            <Shuffle className="w-3.5 h-3.5 text-crimson-700" /> Shuffle Focus Items
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {watchOuts.map((item) => (
            <div key={item.id} className="studio-card rounded-2xl p-5 space-y-2 border-t-2 border-t-gold-500">
              <div className="text-[11px] font-mono uppercase tracking-wider text-gold-600">{item.tag}</div>
              <h3 className="font-serif text-lg font-semibold text-charcoal-900 leading-snug">{item.title}</h3>
              <p className="text-xs text-charcoal-600 leading-relaxed">{item.detail}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-1">
        {MODULES.map(({ tab, icon: Icon, title, text, tone }) => (
          <button
            key={tab}
            type="button"
            onClick={() => goToTab(tab)}
            className="studio-card hover:border-crimson-700/40 rounded-2xl p-5 text-left transition-all space-y-2 group"
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                tone === "gold" ? "bg-gold-100 text-gold-600" : "bg-crimson-50 text-crimson-700"
              }`}
            >
              <Icon className="w-4 h-4" />
            </div>
            <div className="font-serif text-lg font-semibold text-charcoal-900 group-hover:text-crimson-700 transition-colors">{title}</div>
            <p className="text-xs text-charcoal-600 leading-relaxed">{text}</p>
          </button>
        ))}
      </div>
    </section>
  );
}
