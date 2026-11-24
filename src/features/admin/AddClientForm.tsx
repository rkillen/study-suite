import { useState, type FormEvent } from "react";
import { useSignedIn } from "../../context/AuthContext.tsx";
import { cloneClientContent, isValidClientId, suggestClientId } from "../../data/clientIds.ts";
import { fetchClientProfile } from "../../data/firestoreSource.ts";
import { createClient } from "../../data/firestoreWriters.ts";
import { normalizeClientProfile } from "../../data/normalize.ts";
import { checkCanInvite, inviteToClient } from "../../data/people.ts";
import type { ClientSummary } from "../../types.ts";

/** What happened to the invitation when a client was created with an email. */
export interface InviteResult {
  invitedEmail?: string;
  inviteError?: string;
}

const inputClass =
  "w-full rounded-xl bg-white border border-alabaster-200 px-3.5 py-2 text-sm text-charcoal-900 placeholder:text-charcoal-400 focus:outline-none focus:border-crimson-700";

// Makes a new client, optionally starting from a copy of an existing one.
// clients: [{ id, profileName }] that exist already.
// onCreated({ id, profileName }, { invitedEmail, inviteError }) is called when done.
export default function AddClientForm({ clients, onCreated, onCancel }: { clients: ClientSummary[]; onCreated: (client: ClientSummary, result: InviteResult) => void; onCancel: () => void }) {
  const { profile } = useSignedIn();
  const taken = clients.map((client) => client.id);
  const [name, setName] = useState("");
  const [id, setId] = useState("");
  const [idEdited, setIdEdited] = useState(false);
  const [email, setEmail] = useState("");
  const [copyFrom, setCopyFrom] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const changeName = (value: string) => {
    setName(value);
    if (!idEdited) setId(value.trim() ? suggestClientId(value, taken) : "");
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const profileName = name.trim();
    const clientId = id.trim();
    if (!profileName) return setError("Give the client a name.");
    if (!isValidClientId(clientId)) return setError("The id may only use letters, numbers, - and _ (up to 40 characters).");
    if (taken.includes(clientId)) return setError(`There is already a client with the id "${clientId}". Choose another id.`);

    setBusy(true);
    setError("");
    try {
      // Check the email first, so a mistake does not leave a half-made client behind.
      if (email.trim()) {
        const { problem } = await checkCanInvite(email, clientId);
        if (problem) {
          setError(problem);
          setBusy(false);
          return;
        }
      }
      const content = copyFrom
        ? cloneClientContent(normalizeClientProfile((await fetchClientProfile(copyFrom)) ?? {}, copyFrom))
        : undefined;
      await createClient({ clientId, profileName, content });

      let result: InviteResult = {};
      if (email.trim()) {
        try {
          result = { invitedEmail: await inviteToClient({ email, clientId, invitedBy: profile.email }) };
        } catch (inviteError) {
          result = { inviteError: inviteError instanceof Error ? inviteError.message : String(inviteError) };
        }
      }
      onCreated({ id: clientId, profileName }, result);
    } catch (e) {
      console.error(e);
      setError(`Could not create the client: ${e instanceof Error ? e.message : String(e)}`);
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="studio-card rounded-2xl p-5 sm:p-6 space-y-4 max-w-2xl">
      <h2 className="font-serif text-lg font-semibold text-charcoal-900">Add a client</h2>

      <div className="space-y-1">
        <label htmlFor="new-client-name" className="text-xs font-medium text-charcoal-800">
          Name <span className="text-crimson-700">*</span>
        </label>
        <input id="new-client-name" value={name} onChange={(e) => changeName(e.target.value)} autoFocus placeholder="For example: Ana, or Swiss CRO" className={inputClass} />
      </div>

      <div className="space-y-1">
        <label htmlFor="new-client-id" className="text-xs font-medium text-charcoal-800">
          Short id <span className="text-crimson-700">*</span>
        </label>
        <input
          id="new-client-id"
          value={id}
          onChange={(e) => {
            setId(e.target.value);
            setIdEdited(true);
          }}
          className={`${inputClass} font-mono`}
        />
        <p className="text-[11px] text-charcoal-400">Made from the name. It is used inside the database and cannot be changed later.</p>
      </div>

      <div className="space-y-1">
        <label htmlFor="new-client-copy" className="text-xs font-medium text-charcoal-800">
          Start from <span className="text-charcoal-400">(optional)</span>
        </label>
        <select id="new-client-copy" value={copyFrom} onChange={(e) => setCopyFrom(e.target.value)} className={inputClass}>
          <option value="">Nothing: an empty client (it shows the default client&apos;s watch-outs and scenarios)</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              A copy of {client.profileName} ({client.id})
            </option>
          ))}
        </select>
        <p className="text-[11px] text-charcoal-400">
          A copy includes the watch-outs, scenarios, personal cards and extra words. You can then change anything without touching the original.
        </p>
      </div>

      <div className="space-y-1">
        <label htmlFor="new-client-email" className="text-xs font-medium text-charcoal-800">
          Invite their person <span className="text-charcoal-400">(optional)</span>
        </label>
        <input id="new-client-email" type="text" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Their Google email address" className={inputClass} />
        <p className="text-[11px] text-charcoal-400">They can then sign in and will see this client. You can also do this later.</p>
      </div>

      {error && (
        <p role="status" className="text-xs text-crimson-700">
          {error}
        </p>
      )}

      <div className="flex items-center gap-2">
        <button type="submit" disabled={busy} className="px-4 py-2.5 rounded-xl bg-crimson-700 hover:bg-crimson-800 text-white text-xs font-medium disabled:opacity-60">
          {busy ? "Creating…" : "Create client"}
        </button>
        <button type="button" onClick={onCancel} disabled={busy} className="px-4 py-2.5 rounded-xl bg-white hover:bg-alabaster-50 border border-alabaster-200 text-xs font-medium text-charcoal-800">
          Cancel
        </button>
      </div>
    </form>
  );
}
