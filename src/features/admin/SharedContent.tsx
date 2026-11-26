import { useEffect, useState } from "react";
import { useStudy } from "../../context/StudyContext.tsx";
import { fetchSharedLibrary } from "../../data/firestoreSource.ts";
import {
  saveBeachcombing,
  saveFlashcardCategory,
  savePreOutliningQuestions,
  saveStoryPrompts,
} from "../../data/firestoreWriters.ts";
import { normalizeLibrary } from "../../data/normalize.ts";
import { newId } from "../../lib/ids.ts";
import type { BeachTier, Flashcard, FlashcardCategory, Library } from "../../types.ts";
import type { Field } from "./ListEditor.tsx";
import { CARD_FIELDS, cardSearchText, defineList, renderCardSummary, textListItems, type ListDef, type TextItem } from "./listSpec.tsx";

const WORD: Field[] = [{ name: "text", label: "Word", required: true }];
const QUESTION: Field[] = [{ name: "text", label: "Question", required: true, multiline: true }];
const PROMPT: Field[] = [{ name: "text", label: "Prompt", required: true, multiline: true }];

const tier = (id: BeachTier, label: string) =>
  defineList<Library, TextItem, string>({
    id,
    group: "Beachcombing words",
    label,
    noun: "word",
    fields: WORD,
    bulk: true,
    help: "Trigger words in Beachcombing. Each client can also have their own extra words (see Clients); those are shown first.",
    ...textListItems,
    read: (lib) => lib.beachcombing[id],
    apply: (lib, items) => ({ ...lib, beachcombing: { ...lib.beachcombing, [id]: items } }),
    persist: (lib) => saveBeachcombing(lib.beachcombing),
  });

const deck = (id: FlashcardCategory, label: string) =>
  defineList<Library, Flashcard, Flashcard>({
    id,
    group: "Flashcards",
    label,
    noun: "card",
    fields: CARD_FIELDS,
    help: "Shared by every client. Editing a card keeps people's progress on it; deleting a card takes it out of their decks.",
    toItems: (cards) => cards,
    fromItems: (items) => items,
    makeItem: (values) => ({ id: newId(id), term: values.term ?? "", definition: values.definition ?? "", example: values.example ?? "", note: values.note ?? "" }),
    searchText: cardSearchText,
    renderSummary: renderCardSummary,
    read: (lib) => lib.flashcards[id],
    apply: (lib, items) => ({ ...lib, flashcards: { ...lib.flashcards, [id]: items } }),
    persist: (lib) => saveFlashcardCategory(id, lib.flashcards[id]),
  });

const LISTS: ListDef<Library>[] = [
  tier("tier1", "Tier 1 · Concrete"),
  tier("tier2", "Tier 2 · Scenes"),
  tier("tier3", "Tier 3 · Abstract"),
  defineList<Library, TextItem, string>({
    id: "questions",
    group: "Pre-Outlining",
    label: "Questions",
    noun: "question",
    fields: QUESTION,
    bulk: true,
    help: "The questions people outline an answer to in Pre-Outlining.",
    ...textListItems,
    read: (lib) => lib.preOutliningQuestions,
    apply: (lib, items) => ({ ...lib, preOutliningQuestions: items }),
    persist: (lib) => savePreOutliningQuestions(lib.preOutliningQuestions),
  }),
  defineList<Library, TextItem, string>({
    id: "prompts",
    group: "Storycraft",
    label: "Story prompts",
    noun: "prompt",
    fields: PROMPT,
    bulk: true,
    help: "The prompts people can draw in Storycraft.",
    ...textListItems,
    read: (lib) => lib.storyPrompts,
    apply: (lib, items) => ({ ...lib, storyPrompts: items }),
    persist: (lib) => saveStoryPrompts(lib.storyPrompts),
  }),
  deck("oxford", "Oxford B2"),
  deck("phrasal", "Phrasal verbs"),
  deck("idioms", "Idioms & metaphors"),
  deck("interview", "Interview questions"),
];

export default function SharedContent() {
  const { reloadContent } = useStudy();
  const [library, setLibrary] = useState<Library | null>(null);
  const [error, setError] = useState("");
  const [activeId, setActiveId] = useState(LISTS[0]!.id);

  useEffect(() => {
    let cancelled = false;
    fetchSharedLibrary()
      .then((raw) => !cancelled && setLibrary(normalizeLibrary(raw)))
      .catch((e: unknown) => !cancelled && setError(e instanceof Error ? e.message : String(e)));
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <p className="text-sm text-crimson-700">Could not load the shared content: {error}</p>;
  if (!library) return <p className="text-sm font-mono text-charcoal-400">Loading shared content…</p>;

  const active = LISTS.find((list) => list.id === activeId)!;

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        {[...new Set(LISTS.map((list) => list.group))].map((group) => (
          <div key={group} className="flex flex-wrap items-center gap-2">
            <span className="w-full sm:w-40 shrink-0 text-[11px] font-mono uppercase tracking-wider text-gold-600">{group}</span>
            {LISTS.filter((list) => list.group === group).map((list) => (
              <button
                key={list.id}
                type="button"
                onClick={() => setActiveId(list.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  list.id === activeId ? "bg-crimson-700 text-white" : "bg-white hover:bg-alabaster-50 border border-alabaster-200 text-charcoal-800"
                }`}
              >
                {list.label} <span className={list.id === activeId ? "text-white/70" : "text-charcoal-400"}>({list.count(library)})</span>
              </button>
            ))}
          </div>
        ))}
      </div>

      <div className="studio-card rounded-2xl p-5 sm:p-6 space-y-4">
        <div>
          <h2 className="font-serif text-lg font-semibold text-charcoal-900">
            {active.group} · {active.label}
          </h2>
          <p className="text-xs text-charcoal-600 mt-0.5 leading-relaxed">{active.help}</p>
        </div>
        {/* The editor saves to Firebase first, and only then do we update what is on screen. */}
        {active.render(library, (next) => {
          setLibrary(next);
          reloadContent();
        })}
      </div>
    </div>
  );
}
