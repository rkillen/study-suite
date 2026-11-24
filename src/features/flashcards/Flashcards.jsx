import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, CircleCheck, Shuffle, Volume2 } from "lucide-react";
import { useStudy } from "../../context/StudyContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { shuffled } from "../../lib/random.js";
import { speakText } from "../../lib/speech.js";
import { syncDeck } from "./deck.js";

const CATEGORY_LABELS = {
  custom: "Personal Focus",
  oxford: "Oxford 3000 B2",
  phrasal: "Phrasal Verbs",
  idioms: "Idioms & Metaphors",
  interview: "Classic Interview Questions",
};

const NO_CARDS = [];

export default function Flashcards() {
  const { library, clientProfile, prefs, updatePrefs, progress, setActiveDeck, masterCard } = useStudy();
  const { showToast } = useToast();
  const [flipped, setFlipped] = useState(false);

  const hasCustom = clientProfile.customCards.length > 0;
  const category = prefs.activeCardCat === "custom" && !hasCustom ? "oxford" : prefs.activeCardCat;
  const pool = category === "custom" ? clientProfile.customCards : library.flashcards[category] || NO_CARDS;

  const deckIds = useMemo(
    () => syncDeck(pool, progress.activeDecks[category], progress.masteredIds),
    [pool, progress.activeDecks, progress.masteredIds, category]
  );
  const cardsById = useMemo(() => new Map(pool.map((card) => [card.id, card])), [pool]);

  const deckSize = deckIds.length;
  const position = deckSize ? prefs.currentCardPos % deckSize : 0;
  const card = deckSize ? cardsById.get(deckIds[position]) : null;

  const masteredSet = new Set(progress.masteredIds);
  const masteredCount = pool.filter((c) => masteredSet.has(c.id)).length;
  const queuedCount = Math.max(0, pool.length - masteredCount - deckSize);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (prefs.activeTab !== "flashcards" || e.code !== "Space") return;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) return;
      e.preventDefault();
      setFlipped((f) => !f);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [prefs.activeTab]);

  const chooseCategory = (next) => {
    updatePrefs({ activeCardCat: next, currentCardPos: 0 });
    setFlipped(false);
  };

  const goTo = (index) => {
    updatePrefs({ currentCardPos: index });
    setFlipped(false);
  };

  const next = () => deckSize && goTo((position + 1) % deckSize);
  const prev = () => deckSize && goTo((position - 1 + deckSize) % deckSize);

  const shuffleDeck = () => {
    setActiveDeck(category, shuffled(deckIds));
    goTo(0);
    showToast("Shuffled active 20-card deck.");
  };

  const masterAndReplace = () => {
    if (!card) return;
    const remaining = deckIds.filter((_, i) => i !== position);
    const newDeck = syncDeck(pool, remaining, [...progress.masteredIds, card.id]);
    masterCard(category, card.id, newDeck);
    setFlipped(false);
    showToast("Card mastered and replaced from queue.");
  };

  const categories = [...(hasCustom ? ["custom"] : []), "oxford", "phrasal", "idioms", "interview"];

  const example = card?.example?.trim();
  const note = card?.note?.trim();

  return (
    <section className="space-y-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-charcoal-900">Active 20-Card Deck</h1>
              <p className="text-xs sm:text-sm text-charcoal-600">Mark cards mastered to retire them and draw the next queued card automatically.</p>
            </div>

            <button
              type="button"
              onClick={shuffleDeck}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-alabaster-50 border border-alabaster-200 text-xs font-medium text-charcoal-800 flex items-center gap-1.5 self-start transition-colors"
            >
              <Shuffle className="w-3.5 h-3.5 text-crimson-700" /> Shuffle Active 20
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => chooseCategory(cat)}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-colors ${
                  cat === category
                    ? "bg-crimson-700 text-white"
                    : "bg-white border border-alabaster-200 text-charcoal-800"
                }`}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>

          <div className="studio-card rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-charcoal-600">
            <span>Active Deck: {deckSize} | Mastered: {masteredCount} | Queued: {queuedCount}</span>
            <span className="text-crimson-700 font-semibold">{card ? `Card ${position + 1} of ${deckSize}` : "Deck Complete"}</span>
          </div>
        </div>

        <div className="perspective-1000">
          <div
            onClick={() => setFlipped(!flipped)}
            className={`relative w-full min-h-[310px] sm:min-h-[340px] transform-style-3d cursor-pointer ${flipped ? "rotate-y-180" : ""}`}
          >
            <div className="backface-hidden studio-card rounded-2xl p-7 sm:p-10 min-h-[310px] sm:min-h-[340px] flex flex-col justify-between border-t-4 border-t-crimson-700">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-md bg-gold-100 text-gold-600 border border-gold-300/60">
                  {CATEGORY_LABELS[category]}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (card) speakText(card.term, prefs.accent);
                  }}
                  title="Pronounce Term"
                  className="p-2 rounded-lg bg-alabaster-50 hover:bg-alabaster-100 border border-alabaster-200 text-charcoal-800 transition-colors"
                >
                  <Volume2 className="w-4 h-4 text-crimson-700" />
                </button>
              </div>

              <div className="py-6 text-center">
                <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-charcoal-900 leading-snug">
                  {card ? card.term : "All cards in this category mastered."}
                </h2>
              </div>

              <div className="text-center text-xs text-charcoal-400 font-mono">Click card or press Space to reveal definition</div>
            </div>

            <div className="backface-hidden rotate-y-180 absolute inset-0 studio-card rounded-2xl p-7 sm:p-10 min-h-[310px] sm:min-h-[340px] flex flex-col justify-between border-t-4 border-t-gold-500 bg-white">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-gold-600">Definition &amp; Framing</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (card) speakText(example || card.definition, prefs.accent);
                  }}
                  title="Listen to Example"
                  className="p-2 rounded-lg bg-alabaster-50 hover:bg-alabaster-100 border border-alabaster-200 text-charcoal-800 transition-colors"
                >
                  <Volume2 className="w-4 h-4 text-gold-600" />
                </button>
              </div>

              <div className="space-y-4 my-auto py-3">
                <p className="font-serif text-xl sm:text-2xl text-charcoal-900 leading-relaxed">
                  {card ? card.definition : "Add new cards in the admin area or switch categories."}
                </p>

                {example && (
                  <div className="p-3.5 rounded-xl bg-alabaster-50 border border-alabaster-200">
                    <div className="text-[10px] font-mono uppercase text-charcoal-400 mb-1">Context Example</div>
                    <p className="text-xs sm:text-sm text-charcoal-800 italic leading-relaxed">{example}</p>
                  </div>
                )}

                {note && (
                  <div>
                    <span className="inline-block text-[11px] font-mono px-2.5 py-1 rounded bg-gold-100 text-gold-600">{note}</span>
                  </div>
                )}
              </div>

              <div className="text-center text-xs text-charcoal-400 font-mono">Click card to flip back</div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={prev}
              className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-alabaster-50 border border-alabaster-200 text-xs font-medium text-charcoal-800 flex items-center gap-1 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            <button
              type="button"
              onClick={next}
              className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-alabaster-50 border border-alabaster-200 text-xs font-medium text-charcoal-800 flex items-center gap-1 transition-colors"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={next}
              className="px-4 py-2.5 rounded-xl bg-alabaster-100 hover:bg-alabaster-200/70 border border-alabaster-200 text-xs font-medium text-charcoal-800 transition-colors"
            >
              Keep in Rotation
            </button>
            <button
              type="button"
              onClick={masterAndReplace}
              className="px-5 py-2.5 rounded-xl bg-crimson-700 hover:bg-crimson-800 text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <CircleCheck className="w-4 h-4" /> Mark Mastered (Draw Next)
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
