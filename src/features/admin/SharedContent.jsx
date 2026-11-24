import { useEffect, useState } from "react";
import { useStudy } from "../../context/StudyContext.jsx";
import { fetchSharedLibrary } from "../../data/firestoreSource.js";
import {
  saveBeachcombing,
  saveFlashcardCategory,
  savePreOutliningQuestions,
  saveStoryPrompts,
} from "../../data/firestoreWriters.js";
import { normalizeLibrary } from "../../data/normalize.js";
import { newId } from "../../lib/ids.js";
import ListEditor from "./ListEditor.jsx";

// Lists of plain text (words, questions, prompts) are edited as { text } items and saved back as text.
const WORD = [{ name: "text", label: "Word", required: true }];
const QUESTION = [{ name: "text", label: "Question", required: true, multiline: true }];
const PROMPT = [{ name: "text", label: "Prompt", required: true, multiline: true }];
const CARD = [
  { name: "term", label: "Front of the card (the term)", required: true },
  { name: "definition", label: "Back of the card (definition)", required: true, multiline: true },
  { name: "example", label: "Example sentence", multiline: true },
  { name: "note", label: "Small note or tag" },
];

const textList = {
  toItems: (strings) => strings.map((text) => ({ text })),
  fromItems: (items) => items.map((item) => item.text),
  makeItem: (values) => ({ text: values.text }),
  searchText: (item) => item.text,
  renderSummary: (item) => <span className="leading-snug">{item.text}</span>,
};

const cardList = (category) => ({
  toItems: (cards) => cards,
  fromItems: (items) => items,
  makeItem: (values) => ({ id: newId(category), ...values }),
  searchText: (card) => `${card.term} ${card.definition}`,
  renderSummary: (card) => (
    <div className="space-y-0.5">
      <div className="font-serif text-base font-semibold text-charcoal-900">{card.term}</div>
      <div className="text-xs text-charcoal-600 leading-relaxed">{card.definition}</div>
      {card.example && <div className="text-xs text-charcoal-400 italic leading-relaxed">{card.example}</div>}
    </div>
  ),
});

const tier = (id, label) => ({
  id,
  group: "Beachcombing words",
  label,
  noun: "word",
  fields: WORD,
  bulk: true,
  help: "Trigger words in Beachcombing. Each client can also have their own extra words (see Clients); those are shown first.",
  ...textList,
  read: (lib) => lib.beachcombing[id],
  apply: (lib, items) => ({ ...lib, beachcombing: { ...lib.beachcombing, [id]: items } }),
  persist: (lib) => saveBeachcombing(lib.beachcombing),
});

const deck = (id, label) => ({
  id,
  group: "Flashcards",
  label,
  noun: "card",
  fields: CARD,
  bulk: false,
  help: "Shared by every client. Editing a card keeps people's progress on it; deleting a card takes it out of their decks.",
  ...cardList(id),
  read: (lib) => lib.flashcards[id],
  apply: (lib, items) => ({ ...lib, flashcards: { ...lib.flashcards, [id]: items } }),
  persist: (lib) => saveFlashcardCategory(id, lib.flashcards[id]),
});

const LISTS = [
  tier("tier1", "Tier 1 · Concrete"),
  tier("tier2", "Tier 2 · Scenes"),
  tier("tier3", "Tier 3 · Abstract"),
  {
    id: "questions",
    group: "Pre-Outlining",
    label: "Questions",
    noun: "question",
    fields: QUESTION,
    bulk: true,
    help: "The questions people outline an answer to in Pre-Outlining.",
    ...textList,
    read: (lib) => lib.preOutliningQuestions,
    apply: (lib, items) => ({ ...lib, preOutliningQuestions: items }),
    persist: (lib) => savePreOutliningQuestions(lib.preOutliningQuestions),
  },
  {
    id: "prompts",
    group: "Storycraft",
    label: "Story prompts",
    noun: "prompt",
    fields: PROMPT,
    bulk: true,
    help: "The prompts people can draw in Storycraft.",
    ...textList,
    read: (lib) => lib.storyPrompts,
    apply: (lib, items) => ({ ...lib, storyPrompts: items }),
    persist: (lib) => saveStoryPrompts(lib.storyPrompts),
  },
  deck("oxford", "Oxford B2"),
  deck("phrasal", "Phrasal verbs"),
  deck("idioms", "Idioms & metaphors"),
  deck("interview", "Interview questions"),
];

export default function SharedContent() {
  const { reloadContent } = useStudy();
  const [library, setLibrary] = useState(null);
  const [error, setError] = useState("");
  const [activeId, setActiveId] = useState(LISTS[0].id);

  useEffect(() => {
    let cancelled = false;
    fetchSharedLibrary()
      .then((raw) => !cancelled && setLibrary(normalizeLibrary(raw)))
      .catch((e) => !cancelled && setError(e.message || String(e)));
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <p className="text-sm text-crimson-700">Could not load the shared content: {error}</p>;
  if (!library) return <p className="text-sm font-mono text-charcoal-400">Loading shared content…</p>;

  const active = LISTS.find((list) => list.id === activeId);

  // Saves to Firebase first, and only then updates what is on screen.
  const handleChange = async (items) => {
    const next = active.apply(library, active.fromItems(items));
    await active.persist(next);
    setLibrary(next);
    reloadContent();
  };

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
                {list.label} <span className={list.id === activeId ? "text-white/70" : "text-charcoal-400"}>({list.read(library).length})</span>
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
        <ListEditor
          key={active.id}
          items={active.toItems(active.read(library))}
          fields={active.fields}
          noun={active.noun}
          bulk={active.bulk}
          makeItem={active.makeItem}
          searchText={active.searchText}
          renderSummary={active.renderSummary}
          onChange={handleChange}
        />
      </div>
    </div>
  );
}
