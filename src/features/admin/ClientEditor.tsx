import { Fragment, useEffect, useState, type FormEvent } from "react";
import { Pencil } from "lucide-react";
import { useStudy } from "../../context/StudyContext.tsx";
import { fetchClientProfile } from "../../data/firestoreSource.ts";
import { deleteClient, saveClientBeachcombing, saveClientName, saveClientSection } from "../../data/firestoreWriters.ts";
import { normalizeClientProfile } from "../../data/normalize.ts";
import { errorMessage } from "../../lib/errors.ts";
import { newId } from "../../lib/ids.ts";
import type { BeachTier, ClientProfile, ClientSummary, CustomCard, Scenario, WatchOut } from "../../types.ts";
import type { Field } from "./ListEditor.tsx";
import { CARD_FIELDS, cardSearchText, defineList, renderCardSummary, textListItems, type ListDef, type TextItem } from "./listSpec.tsx";
import PeoplePanel from "./PeoplePanel.tsx";

const WORD: Field[] = [{ name: "text", label: "Word", required: true }];

const WATCH_OUT: Field[] = [
  { name: "tag", label: "Small label above the title (for example Articles, or Client Focus)", placeholder: "Client Focus" },
  { name: "title", label: "Title", required: true },
  { name: "detail", label: "Explanation", required: true, multiline: true },
];
const SCENARIO: Field[] = [
  { name: "title", label: "Title", required: true },
  { name: "domain", label: "Small label above the title (for example Culture & Travel)" },
  { name: "context", label: "Context for the person (who they are talking to, and why)", multiline: true },
  { name: "prompt", label: "What the other person says (read aloud in the Speaking Arena)", required: true, multiline: true },
];

const label = (text: string) => <div className="text-[11px] font-mono uppercase tracking-wider text-gold-600">{text}</div>;

const tier = (id: BeachTier, title: string) =>
  defineList<ClientProfile, TextItem, string>({
    id,
    label: `Own words · ${title}`,
    help: "Extra Beachcombing words just for this client. They are shown before the shared words.",
    noun: "word",
    fields: WORD,
    bulk: true,
    ...textListItems,
    read: (p) => p.beachcombing[id],
    apply: (p, items) => ({ ...p, beachcombing: { ...p.beachcombing, [id]: items } }),
    persist: (p) => saveClientBeachcombing(p.clientId, p.beachcombing),
  });

const LISTS: ListDef<ClientProfile>[] = [
  defineList<ClientProfile, WatchOut, WatchOut>({
    id: "watchOuts",
    label: "Watch-outs",
    help: "The \"Things to watch out for\" on the Overview. Three of them are shown at a time, picked at random.",
    noun: "watch-out",
    fields: WATCH_OUT,
    toItems: (items) => items,
    fromItems: (items) => items,
    makeItem: (values) => ({ id: newId("wo"), tag: values.tag || "Client Focus", title: values.title ?? "", detail: values.detail ?? "" }),
    searchText: (item) => `${item.tag} ${item.title} ${item.detail}`,
    renderSummary: (item) => (
      <div className="space-y-0.5">
        {label(item.tag)}
        <div className="font-serif text-base font-semibold text-charcoal-900">{item.title}</div>
        <div className="text-xs text-charcoal-600 leading-relaxed">{item.detail}</div>
      </div>
    ),
    read: (p) => p.watchOuts,
    apply: (p, items) => ({ ...p, watchOuts: items }),
    persist: (p) => saveClientSection(p.clientId, "watchOuts", p.watchOuts),
  }),
  defineList<ClientProfile, Scenario, Scenario>({
    id: "scenarios",
    label: "Scenarios",
    help: "The practice situations in the Speaking Arena, in the order shown. Use the arrows to reorder.",
    noun: "scenario",
    fields: SCENARIO,
    reorder: true,
    toItems: (items) => items,
    fromItems: (items) => items,
    makeItem: (values) => ({ id: newId("scn"), domain: values.domain ?? "", title: values.title ?? "", context: values.context ?? "", prompt: values.prompt ?? "" }),
    searchText: (item) => `${item.domain} ${item.title} ${item.prompt}`,
    renderSummary: (item) => (
      <div className="space-y-0.5">
        {item.domain && label(item.domain)}
        <div className="font-serif text-base font-semibold text-charcoal-900">{item.title}</div>
        <div className="text-xs text-charcoal-600 leading-relaxed">{item.prompt}</div>
      </div>
    ),
    read: (p) => p.scenarios,
    apply: (p, items) => ({ ...p, scenarios: items }),
    persist: (p) => saveClientSection(p.clientId, "scenarios", p.scenarios),
  }),
  defineList<ClientProfile, CustomCard, CustomCard>({
    id: "cards",
    label: "Personal cards",
    help: "This client's own flashcards (the \"Personal Focus\" deck). Use the arrows to set the order they start in.",
    noun: "card",
    fields: CARD_FIELDS,
    reorder: true,
    toItems: (items) => items,
    fromItems: (items) => items,
    makeItem: (values) => ({ id: newId("card"), category: "custom", term: values.term ?? "", definition: values.definition ?? "", example: values.example ?? "", note: values.note ?? "" }),
    searchText: cardSearchText,
    renderSummary: renderCardSummary,
    read: (p) => p.customCards,
    apply: (p, items) => ({ ...p, customCards: items }),
    persist: (p) => saveClientSection(p.clientId, "cards", p.customCards),
  }),
  tier("tier1", "Tier 1"),
  tier("tier2", "Tier 2"),
  tier("tier3", "Tier 3"),
];

// At the very bottom of a client: delete it. Refused while anyone is still in the client.
function DeleteClient({ client, onDeleted }: { client: ClientSummary; onDeleted: (id: string) => void }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");

  const remove = async () => {
    setBusy(true);
    setProblem("");
    try {
      await deleteClient(client.id);
      onDeleted(client.id);
    } catch (e) {
      // Refusing is normal here ("someone is still in this client"), and the message says why.
      setProblem(errorMessage(e));
      setConfirming(false);
      setBusy(false);
    }
  };

  return (
    <div className="p-5 rounded-2xl border border-crimson-700/20 bg-crimson-50/50 space-y-3">
      <div>
        <h3 className="font-serif text-lg font-semibold text-charcoal-900">Delete this client</h3>
        <p className="text-xs text-charcoal-600 mt-0.5 leading-relaxed">
          Removes the client and all its watch-outs, scenarios, personal cards and own words. It cannot be undone, so download a backup first if
          you might want them again. It is only allowed once no one is in the client: move or cancel people first.
        </p>
      </div>
      {confirming ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-crimson-700 font-medium mr-auto">Delete {client.profileName} for good?</span>
          <button type="button" disabled={busy} onClick={remove} className="px-4 py-2 rounded-xl bg-crimson-700 hover:bg-crimson-800 text-white text-xs font-medium disabled:opacity-60">
            {busy ? "Deleting…" : "Yes, delete it"}
          </button>
          <button type="button" onClick={() => setConfirming(false)} className="px-4 py-2 rounded-xl bg-white hover:bg-alabaster-50 border border-alabaster-200 text-xs font-medium text-charcoal-800">
            No
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => setConfirming(true)} className="px-4 py-2 rounded-xl bg-white hover:bg-alabaster-50 border border-crimson-700/30 text-xs font-medium text-crimson-700">
          Delete client…
        </button>
      )}
      {problem && (
        <p role="status" className="text-xs text-crimson-700">
          {problem}
        </p>
      )}
    </div>
  );
}

function NameForm({ client, profile, onSaved }: { client: ClientSummary; profile: ClientProfile; onSaved: (name: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile.profileName);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const save = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("A client needs a name.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await saveClientName(client.id, trimmed);
      onSaved(trimmed);
      setEditing(false);
    } catch (e) {
      console.error(e);
      setError(`Could not save: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  };

  if (!editing) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-serif text-xl font-semibold text-charcoal-900">{profile.profileName}</h2>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-gold-100 text-gold-600 border border-gold-300/60">id: {client.id}</span>
        <button
          type="button"
          onClick={() => {
            setName(profile.profileName);
            setEditing(true);
          }}
          className="px-2.5 py-1.5 rounded-lg bg-alabaster-50 hover:bg-alabaster-100 border border-alabaster-200 text-[11px] font-medium text-charcoal-800 flex items-center gap-1"
        >
          <Pencil className="w-3 h-3" /> Rename
        </button>
      </div>
    );
  }
  return (
    <form onSubmit={save} className="flex flex-wrap items-center gap-2">
      <label htmlFor="client-name" className="sr-only">
        Client name
      </label>
      <input
        id="client-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus
        className="rounded-xl bg-white border border-alabaster-200 px-3.5 py-2 text-sm text-charcoal-900 focus:outline-none focus:border-crimson-700"
      />
      <button type="submit" disabled={busy} className="px-4 py-2 rounded-xl bg-crimson-700 hover:bg-crimson-800 text-white text-xs font-medium disabled:opacity-60">
        {busy ? "Saving…" : "Save name"}
      </button>
      <button type="button" onClick={() => setEditing(false)} disabled={busy} className="px-4 py-2 rounded-xl bg-white hover:bg-alabaster-100 border border-alabaster-200 text-xs font-medium text-charcoal-800">
        Cancel
      </button>
      {error && <span role="status" className="text-xs text-crimson-700">{error}</span>}
    </form>
  );
}

// Everything about one client. "client" is { id, profileName }.
export default function ClientEditor({ client, clients, onRenamed, onDeleted }: { client: ClientSummary; clients: ClientSummary[]; onRenamed: (id: string, name: string) => void; onDeleted: (id: string) => void }) {
  const { reloadContent } = useStudy();
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [error, setError] = useState("");
  const [activeId, setActiveId] = useState(LISTS[0]!.id);

  useEffect(() => {
    let cancelled = false;
    fetchClientProfile(client.id)
      .then((raw) => !cancelled && setProfile(normalizeClientProfile(raw ?? {}, client.id)))
      .catch((e: unknown) => !cancelled && setError(e instanceof Error ? e.message : String(e)));
    return () => {
      cancelled = true;
    };
  }, [client.id]);

  if (error) return <p className="text-sm text-crimson-700">Could not load this client: {error}</p>;
  if (!profile) return <p className="text-sm font-mono text-charcoal-400">Loading client…</p>;

  const active = LISTS.find((list) => list.id === activeId)!;

  const usesDefaults = client.id !== "default" && (profile.watchOuts.length === 0 || profile.scenarios.length === 0);

  return (
    <div className="space-y-5">
      <NameForm
        client={client}
        profile={profile}
        onSaved={(name) => {
          setProfile({ ...profile, profileName: name });
          onRenamed(client.id, name);
          reloadContent();
        }}
      />

      <PeoplePanel clientId={client.id} clients={clients} />

      {usesDefaults && (
        <p className="text-xs text-charcoal-600 leading-relaxed p-3.5 rounded-xl bg-gold-100/60 border border-gold-300/60">
          This client has no {profile.watchOuts.length === 0 && profile.scenarios.length === 0 ? "watch-outs or scenarios" : profile.watchOuts.length === 0 ? "watch-outs" : "scenarios"} of their own yet, so
          they see the ones from the <strong>default</strong> client. Add some below to replace them.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {LISTS.map((list) => (
          <button
            key={list.id}
            type="button"
            onClick={() => setActiveId(list.id)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              list.id === activeId ? "bg-crimson-700 text-white" : "bg-white hover:bg-alabaster-50 border border-alabaster-200 text-charcoal-800"
            }`}
          >
            {list.label} <span className={list.id === activeId ? "text-white/70" : "text-charcoal-400"}>({list.count(profile)})</span>
          </button>
        ))}
      </div>

      <div className="studio-card rounded-2xl p-5 sm:p-6 space-y-4">
        <div>
          <h3 className="font-serif text-lg font-semibold text-charcoal-900">{active.label}</h3>
          <p className="text-xs text-charcoal-600 mt-0.5 leading-relaxed">{active.help}</p>
        </div>
        {/* The editor saves to Firebase first, and only then do we update what is on screen. */}
        <Fragment key={`${client.id}-${active.id}`}>
          {active.render(profile, (next) => {
            setProfile(next);
            reloadContent();
          })}
        </Fragment>
      </div>

      {client.id !== "default" && <DeleteClient client={client} onDeleted={onDeleted} />}
    </div>
  );
}
