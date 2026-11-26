import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, Search } from "lucide-react";
import { listClients } from "../../data/firestoreSource.ts";
import { listAllPeople, type Person, type PersonStatus } from "../../data/people.ts";
import { errorMessage } from "../../lib/errors.ts";
import type { ClientSummary } from "../../types.ts";
import BulkInvite from "./BulkInvite.tsx";
import InviteAdmin from "./InviteAdmin.tsx";
import PersonRow from "./PersonRow.tsx";
import PersonWork from "./PersonWork.tsx";

type Filter = "all" | PersonStatus;
type Sort = "recent" | "quiet" | "email";
type Panel = null | "bulk" | "admin";

const inputClass =
  "rounded-xl bg-white border border-alabaster-200 px-3.5 py-2 text-sm text-charcoal-900 placeholder:text-charcoal-400 focus:outline-none focus:border-crimson-700";
const toggle = "px-3.5 py-2 rounded-xl text-xs font-medium transition-colors";

// Most recent activity first. People who have never been active go last.
const byRecent = (a: Person, b: Person) => (b.lastActiveAt?.getTime() ?? -1) - (a.lastActiveAt?.getTime() ?? -1);

// Everyone: who has signed in, how much they have done, and what you can do about them.
export default function AllPeople() {
  const [people, setPeople] = useState<Person[] | null>(null);
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("recent");
  const [panel, setPanel] = useState<Panel>(null);
  const [viewing, setViewing] = useState<Person | null>(null);

  const load = useCallback(async () => {
    try {
      const [everyone, allClients] = await Promise.all([listAllPeople(), listClients()]);
      setPeople(everyone);
      setClients(allClients);
      setError("");
    } catch (e) {
      console.error(e);
      setError(errorMessage(e));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const clientName = useCallback((id: string) => clients.find((c) => c.id === id)?.profileName ?? id, [clients]);

  const shown = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const matches = (people ?? []).filter(
      (p) =>
        (filter === "all" || p.status === filter) &&
        (!needle || `${p.email} ${p.name} ${clientName(p.clientId)} ${p.clientId}`.toLowerCase().includes(needle))
    );
    if (sort === "email") return matches.sort((a, b) => a.email.localeCompare(b.email));
    if (sort === "quiet") return matches.sort((a, b) => -byRecent(a, b));
    return matches.sort(byRecent);
  }, [people, search, filter, sort, clientName]);

  if (error) return <p className="text-sm text-crimson-700">Could not load the people: {error}</p>;
  if (!people) return <p className="text-sm font-mono text-charcoal-400">Loading people…</p>;

  if (viewing) {
    return <PersonWork person={viewing} onBack={() => setViewing(null)} />;
  }

  const count = (status: PersonStatus) => people.filter((p) => p.status === status).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-charcoal-600">
          <strong className="text-charcoal-900">{people.length}</strong> {people.length === 1 ? "person" : "people"}: {count("active")} signed in, {count("invited")} invited, {count("revoked")} switched
          off.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setPanel(panel === "bulk" ? null : "bulk")}
            className={`${toggle} ${panel === "bulk" ? "bg-crimson-700 text-white" : "bg-white hover:bg-alabaster-50 border border-alabaster-200 text-charcoal-800"}`}
          >
            Invite many people
          </button>
          <button
            type="button"
            onClick={() => setPanel(panel === "admin" ? null : "admin")}
            className={`${toggle} ${panel === "admin" ? "bg-crimson-700 text-white" : "bg-white hover:bg-alabaster-50 border border-alabaster-200 text-charcoal-800"}`}
          >
            Invite an admin
          </button>
          <button type="button" onClick={() => void load()} aria-label="Refresh the list" className={`${toggle} bg-white hover:bg-alabaster-50 border border-alabaster-200 text-charcoal-800 flex items-center gap-1.5`}>
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {panel === "bulk" && <BulkInvite clients={clients} onDone={() => void load()} />}
      {panel === "admin" && <InviteAdmin onDone={() => void load()} />}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email, name or client…"
            aria-label="Search people"
            className={`${inputClass} w-full pl-9`}
          />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value as Filter)} aria-label="Show" className={inputClass}>
          <option value="all">Everyone</option>
          <option value="active">Signed in</option>
          <option value="invited">Invited</option>
          <option value="revoked">Access switched off</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort by" className={inputClass}>
          <option value="recent">Most recently active first</option>
          <option value="quiet">Longest quiet first</option>
          <option value="email">Email A to Z</option>
        </select>
      </div>

      {shown.length === 0 ? (
        <p className="p-6 rounded-xl bg-alabaster-50 border border-alabaster-200 text-center text-xs text-charcoal-400">
          {people.length === 0 ? "No one has been invited yet. Add a client with an email, or use Invite many people." : "No one matches."}
        </p>
      ) : (
        <ul className="space-y-2.5" aria-label="All people">
          {shown.map((person) => (
            <PersonRow key={person.email} person={person} clients={clients} showClient onChanged={load} onViewWork={setViewing} />
          ))}
        </ul>
      )}
    </div>
  );
}
