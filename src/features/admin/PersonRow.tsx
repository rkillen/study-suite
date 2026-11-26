import { useState } from "react";
import { BookOpen, MoveRight, RotateCcw, UserX } from "lucide-react";
import { useSignedIn } from "../../context/AuthContext.tsx";
import { useToast } from "../../context/ToastContext.tsx";
import { normalizeEmail } from "../../data/emails.ts";
import { cancelInvite, moveToClient, restoreAccess, revokeAccess, type Person, type PersonStatus } from "../../data/people.ts";
import { errorMessage } from "../../lib/errors.ts";
import type { ClientSummary } from "../../types.ts";

const STATUS: Record<PersonStatus, { label: string; style: string }> = {
  invited: { label: "Invited, has not signed in yet", style: "bg-gold-100 text-gold-600 border-gold-300/60" },
  active: { label: "Signed in", style: "bg-alabaster-100 text-charcoal-600 border-alabaster-200" },
  revoked: { label: "Access switched off", style: "bg-crimson-50 text-crimson-700 border-crimson-700/20" },
};

const button = "px-2.5 py-1.5 rounded-lg text-[11px] font-medium flex items-center gap-1 transition-colors disabled:opacity-50";
const quiet = `${button} bg-alabaster-50 hover:bg-alabaster-100 border border-alabaster-200 text-charcoal-800`;
const danger = `${button} bg-crimson-700 hover:bg-crimson-800 text-white`;

type Pending = null | "revoke" | "cancel" | "move";

interface PersonRowProps {
  person: Person;
  /** Every client, to move the person into one. */
  clients: ClientSummary[];
  /** Show which client the person is in. (Not needed inside one client's own panel.) */
  showClient?: boolean;
  /** Called after any change, so the list can reload. */
  onChanged: () => void | Promise<void>;
  /** If given, a "View work" button opens that person's stories and progress. */
  onViewWork?: (person: Person) => void;
}

// One person, with what an admin can do about them: read their work, move them, switch their access
// off or back on, or cancel an invitation that has not been used.
export default function PersonRow({ person, clients, showClient = false, onChanged, onViewWork }: PersonRowProps) {
  const { profile } = useSignedIn();
  const { showToast } = useToast();
  const [pending, setPending] = useState<Pending>(null);
  const [moveTo, setMoveTo] = useState("");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");

  const isMe = normalizeEmail(person.email) === normalizeEmail(profile.email);
  const clientName = clients.find((c) => c.id === person.clientId)?.profileName ?? person.clientId;

  // Runs one action, then reloads the list. Any problem is shown under the person.
  const run = async (action: () => Promise<void>, done: string) => {
    setBusy(true);
    setProblem("");
    try {
      await action();
      setPending(null);
      showToast(done);
      await onChanged();
    } catch (e) {
      // Often a plain refusal ("this is the only admin"), and the message says why.
      setProblem(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const otherClients = clients.filter((c) => c.id !== person.clientId);

  return (
    <li className="p-3.5 rounded-xl bg-white border border-alabaster-200 space-y-2.5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-medium text-charcoal-900 break-all">
            {person.email} {isMe && <span className="text-[11px] font-normal text-charcoal-400">(you)</span>}
          </div>
          {person.name && <div className="text-xs text-charcoal-600">{person.name}</div>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {person.role === "admin" && <span className="text-[11px] font-mono px-2 py-0.5 rounded border bg-crimson-50 text-crimson-700 border-crimson-700/20">admin</span>}
          <span className={`text-[11px] font-mono px-2 py-0.5 rounded border ${STATUS[person.status].style}`}>{STATUS[person.status].label}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-charcoal-600">
        {showClient && (
          <span>
            Client: <strong className="font-medium text-charcoal-800">{clientName}</strong>
          </span>
        )}
        {person.uid && (
          <>
            <span>{person.lastActiveAt ? `Last active ${person.lastActiveAt.toLocaleDateString()}` : "Not active yet"}</span>
            <span>
              {person.storyCount} {person.storyCount === 1 ? "story" : "stories"} · {person.jotCount} {person.jotCount === 1 ? "jot" : "jots"} · {person.masteredCount} mastered
            </span>
          </>
        )}
      </div>

      {pending === null && (
        <div className="flex flex-wrap items-center gap-1.5">
          {person.uid && onViewWork && (
            <button type="button" onClick={() => onViewWork(person)} className={quiet}>
              <BookOpen className="w-3 h-3" /> View work
            </button>
          )}
          {/* Admins are not tied to a client, so moving one would mean nothing. */}
          {otherClients.length > 0 && person.role !== "admin" && (
            <button
              type="button"
              onClick={() => {
                setMoveTo(otherClients[0]!.id);
                setPending("move");
                setProblem("");
              }}
              className={quiet}
            >
              <MoveRight className="w-3 h-3" /> Move to another client
            </button>
          )}
          {person.status === "invited" && (
            <button type="button" onClick={() => setPending("cancel")} className={quiet}>
              Cancel invitation
            </button>
          )}
          {person.status === "active" && !isMe && (
            <button type="button" onClick={() => setPending("revoke")} className={quiet}>
              <UserX className="w-3 h-3" /> Switch off access
            </button>
          )}
          {person.status === "revoked" && (
            <button type="button" onClick={() => run(() => restoreAccess(person), `Access restored for ${person.email}.`)} disabled={busy} className={quiet}>
              <RotateCcw className="w-3 h-3" /> Restore access
            </button>
          )}
        </div>
      )}

      {pending === "move" && (
        <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-alabaster-50 border border-alabaster-200">
          <label htmlFor={`move-${person.email}`} className="text-xs text-charcoal-800">
            Move to
          </label>
          <select
            id={`move-${person.email}`}
            value={moveTo}
            onChange={(e) => setMoveTo(e.target.value)}
            className="rounded-lg bg-white border border-alabaster-200 px-2.5 py-1.5 text-xs text-charcoal-900"
          >
            {otherClients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.profileName} ({c.id})
              </option>
            ))}
          </select>
          <button type="button" disabled={busy} onClick={() => run(() => moveToClient(person, moveTo), `Moved ${person.email}.`)} className={danger}>
            {busy ? "Moving…" : "Move"}
          </button>
          <button type="button" onClick={() => setPending(null)} className={quiet}>
            Cancel
          </button>
        </div>
      )}

      {pending === "revoke" && (
        <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-crimson-50 border border-crimson-700/20">
          <span className="text-xs text-crimson-700 font-medium mr-auto">
            Switch off access for {person.email}? They will see &quot;Access has ended&quot;. Their stories are kept, and you can restore access later.
          </span>
          <button type="button" disabled={busy} onClick={() => run(() => revokeAccess(person, profile.email), `Access switched off for ${person.email}.`)} className={danger}>
            {busy ? "Working…" : "Yes, switch it off"}
          </button>
          <button type="button" onClick={() => setPending(null)} className={quiet}>
            No
          </button>
        </div>
      )}

      {pending === "cancel" && (
        <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-crimson-50 border border-crimson-700/20">
          <span className="text-xs text-crimson-700 font-medium mr-auto">Cancel the invitation for {person.email}?</span>
          <button type="button" disabled={busy} onClick={() => run(() => cancelInvite(person.email), `Invitation for ${person.email} cancelled.`)} className={danger}>
            Yes, cancel it
          </button>
          <button type="button" onClick={() => setPending(null)} className={quiet}>
            No
          </button>
        </div>
      )}

      {problem && (
        <p role="status" className="text-xs text-crimson-700">
          {problem}
        </p>
      )}
    </li>
  );
}
