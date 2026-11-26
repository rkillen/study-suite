import { useCallback, useEffect, useState, type ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import type { QueryDocumentSnapshot } from "firebase/firestore";
import type { Person } from "../../data/people.ts";
import { fetchJotsPage, fetchStoriesPage, type WorkPage } from "../../data/peopleWork.ts";
import { errorMessage } from "../../lib/errors.ts";
import type { Jot, Story } from "../../types.ts";

const longDate = (iso: string): string => new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

// A list that loads a page at a time. fetchPage(after) returns the next page; "after" is null for the first.
function PagedList<T extends { id: string }>({
  uid,
  fetchPage,
  renderItem,
  emptyText,
}: {
  uid: string;
  fetchPage: (uid: string, after: QueryDocumentSnapshot | null) => Promise<WorkPage<T>>;
  renderItem: (item: T) => ReactNode;
  emptyText: string;
}) {
  const [items, setItems] = useState<T[]>([]);
  const [next, setNext] = useState<QueryDocumentSnapshot | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(
    async (after: QueryDocumentSnapshot | null) => {
      setBusy(true);
      setError("");
      try {
        const page = await fetchPage(uid, after);
        setItems((previous) => (after ? [...previous, ...page.items] : page.items));
        setNext(page.next);
        setLoaded(true);
      } catch (e) {
        console.error(e);
        setError(errorMessage(e));
      } finally {
        setBusy(false);
      }
    },
    [uid, fetchPage]
  );

  useEffect(() => {
    void load(null);
  }, [load]);

  return (
    <div className="space-y-2.5">
      {error && <p className="text-xs text-crimson-700">Could not load: {error}</p>}
      {!loaded && !error && <p className="text-xs font-mono text-charcoal-400">Loading…</p>}
      {loaded && items.length === 0 && (
        <p className="p-6 rounded-xl bg-alabaster-50 border border-alabaster-200 text-center text-xs text-charcoal-400">{emptyText}</p>
      )}
      <ul className="space-y-2.5">
        {items.map((item) => (
          <li key={item.id}>{renderItem(item)}</li>
        ))}
      </ul>
      {next && (
        <button
          type="button"
          disabled={busy}
          onClick={() => void load(next)}
          className="px-4 py-2 rounded-xl bg-white hover:bg-alabaster-50 border border-alabaster-200 text-xs font-medium text-charcoal-800 disabled:opacity-60"
        >
          {busy ? "Loading…" : "Load 25 more"}
        </button>
      )}
    </div>
  );
}

function StoryCard({ story }: { story: Story }) {
  return (
    <details className="group p-4 rounded-xl bg-white border border-alabaster-200">
      <summary className="cursor-pointer list-none flex flex-wrap items-start justify-between gap-2">
        <span className="font-serif text-base font-semibold text-charcoal-900">{story.title}</span>
        <span className="text-[11px] font-mono text-charcoal-400">{longDate(story.createdAt)}</span>
      </summary>
      <div className="mt-3 space-y-2">
        {story.prompt && <p className="text-xs text-charcoal-600 italic leading-relaxed">Prompt: {story.prompt}</p>}
        <p className="text-sm text-charcoal-900 leading-relaxed whitespace-pre-wrap">{story.body}</p>
        {story.updatedAt && <p className="text-[11px] font-mono text-charcoal-400">Edited {longDate(story.updatedAt)}</p>}
      </div>
    </details>
  );
}

function JotCard({ jot }: { jot: Jot }) {
  return (
    <div className="p-4 rounded-xl bg-white border border-alabaster-200 space-y-1">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <span className="font-serif text-base font-semibold text-charcoal-900">{jot.word}</span>
        <span className="text-[11px] font-mono text-charcoal-400">{longDate(jot.date)}</span>
      </div>
      <p className="text-sm text-charcoal-800 leading-relaxed whitespace-pre-wrap">{jot.text}</p>
    </div>
  );
}

// One person's stories and jots, for an admin to read. Nothing here can change them.
export default function PersonWork({ person, onBack }: { person: Person; onBack: () => void }) {
  const [tab, setTab] = useState<"stories" | "jots">("stories");
  const uid = person.uid;
  if (!uid) return null;

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={onBack}
        className="px-3.5 py-2 rounded-xl bg-white hover:bg-alabaster-50 border border-alabaster-200 text-xs font-medium text-charcoal-800 flex items-center gap-1.5"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to everyone
      </button>

      <div className="studio-card rounded-2xl p-5 sm:p-6 space-y-3">
        <div>
          <h2 className="font-serif text-xl font-semibold text-charcoal-900 break-all">{person.name || person.email}</h2>
          {person.name && <p className="text-xs text-charcoal-600 break-all">{person.email}</p>}
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-charcoal-600">
          <span>
            <strong className="text-charcoal-900">{person.storyCount}</strong> {person.storyCount === 1 ? "story" : "stories"}
          </span>
          <span>
            <strong className="text-charcoal-900">{person.jotCount}</strong> {person.jotCount === 1 ? "jot" : "jots"}
          </span>
          <span>
            <strong className="text-charcoal-900">{person.masteredCount}</strong> cards mastered
          </span>
          <span>{person.lastActiveAt ? `Last active ${person.lastActiveAt.toLocaleDateString()}` : "Not active yet"}</span>
        </div>
        <p className="text-[11px] text-charcoal-400 leading-relaxed">
          You are reading this person&apos;s work. It is read-only, and they can see in the footer of every page that their facilitator can read
          their stories and progress.
        </p>
      </div>

      <div className="flex items-center gap-1 bg-alabaster-100 p-1 rounded-xl border border-alabaster-200 self-start w-fit">
        {(["stories", "jots"] as const).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${tab === id ? "bg-white text-crimson-700 shadow-2xs" : "text-charcoal-600"}`}
          >
            {id === "stories" ? "Stories" : "Beachcombing jots"}
          </button>
        ))}
      </div>

      {tab === "stories" ? (
        <PagedList<Story> key="stories" uid={uid} fetchPage={fetchStoriesPage} renderItem={(story) => <StoryCard story={story} />} emptyText="No stories saved yet." />
      ) : (
        <PagedList<Jot> key="jots" uid={uid} fetchPage={fetchJotsPage} renderItem={(jot) => <JotCard jot={jot} />} emptyText="No jots saved yet." />
      )}
    </div>
  );
}
