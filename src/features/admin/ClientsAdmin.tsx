import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { listClients } from "../../data/firestoreSource.ts";
import type { ClientSummary } from "../../types.ts";
import AddClientForm, { type InviteResult } from "./AddClientForm.tsx";
import ClientEditor from "./ClientEditor.tsx";
import InviteMessage from "./InviteMessage.tsx";

// Pick a client to edit, or add a new one.
export default function ClientsAdmin() {
  const [clients, setClients] = useState<ClientSummary[] | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [adding, setAdding] = useState(false);
  const [notice, setNotice] = useState<({ text: string } & InviteResult) | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    listClients()
      .then((list) => {
        if (cancelled) return;
        setClients(list);
        setSelectedId((current) => current || list[0]?.id || "");
      })
      .catch((e: unknown) => !cancelled && setError(e instanceof Error ? e.message : String(e)));
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <p className="text-sm text-crimson-700">Could not load the clients: {error}</p>;
  if (!clients) return <p className="text-sm font-mono text-charcoal-400">Loading clients…</p>;

  const selected = clients.find((client) => client.id === selectedId);

  const handleCreated = (client: ClientSummary, result: InviteResult = {}) => {
    setClients([...clients, client].sort((a, b) => a.profileName.localeCompare(b.profileName)));
    setSelectedId(client.id);
    setAdding(false);
    setNotice({ text: `Created ${client.profileName}.`, ...result });
  };

  const handleRenamed = (id: string, profileName: string) => {
    setClients(clients.map((client) => (client.id === id ? { ...client, profileName } : client)).sort((a, b) => a.profileName.localeCompare(b.profileName)));
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="client-picker" className="text-xs font-medium text-charcoal-800">
          Client
        </label>
        <select
          id="client-picker"
          value={selectedId}
          onChange={(e) => {
            setSelectedId(e.target.value);
            setAdding(false);
            setNotice(null);
          }}
          disabled={clients.length === 0}
          className="min-w-[220px] rounded-xl bg-white border border-alabaster-200 px-3.5 py-2 text-sm text-charcoal-900 focus:outline-none focus:border-crimson-700"
        >
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.profileName} ({client.id})
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => {
            setAdding(true);
            setNotice(null);
          }}
          className="px-3.5 py-2 rounded-xl bg-crimson-700 hover:bg-crimson-800 text-white text-xs font-medium flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" /> Add client
        </button>
        <span className="text-xs text-charcoal-400 ml-auto">{clients.length} clients</span>
      </div>

      {notice && (
        <div className="space-y-3 max-w-2xl">
          <p role="status" className="text-xs text-charcoal-600">
            {notice.text}
          </p>
          {notice.inviteError && <p className="text-xs text-crimson-700">The client was created, but the invitation was not: {notice.inviteError}</p>}
          {notice.invitedEmail && <InviteMessage email={notice.invitedEmail} />}
        </div>
      )}

      {adding ? (
        <AddClientForm clients={clients} onCreated={handleCreated} onCancel={() => setAdding(false)} />
      ) : selected ? (
        <ClientEditor key={selected.id} client={selected} onRenamed={handleRenamed} />
      ) : (
        <p className="p-6 rounded-xl bg-alabaster-50 border border-alabaster-200 text-center text-xs text-charcoal-400">
          There are no clients yet. Use "Add client" to make the first one, or import the starter data under Import &amp; backup.
        </p>
      )}
    </div>
  );
}
