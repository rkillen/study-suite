import { useCallback, useEffect, useState, type FormEvent } from "react";
import { UserPlus } from "lucide-react";
import { useSignedIn } from "../../context/AuthContext.tsx";
import { normalizeEmail } from "../../data/emails.ts";
import { cancelInvite, checkCanInvite, inviteToClient, listClientPeople, type Person, type PersonStatus } from "../../data/people.ts";
import { errorMessage } from "../../lib/errors.ts";
import InviteMessage from "./InviteMessage.tsx";

const STATUS: Record<PersonStatus, { label: string; style: string }> = {
  invited: { label: "Invited, has not signed in yet", style: "bg-gold-100 text-gold-600 border-gold-300/60" },
  active: { label: "Signed in", style: "bg-alabaster-100 text-charcoal-600 border-alabaster-200" },
  revoked: { label: "Access switched off", style: "bg-crimson-50 text-crimson-700 border-crimson-700/20" },
};

const inputClass =
  "flex-1 min-w-[220px] rounded-xl bg-white border border-alabaster-200 px-3.5 py-2 text-sm text-charcoal-900 placeholder:text-charcoal-400 focus:outline-none focus:border-crimson-700";

// Who is attached to one client, and a form to invite someone. clientId is the client's short id.
export default function PeoplePanel({ clientId }: { clientId: string }) {
  const { profile } = useSignedIn();
  const [people, setPeople] = useState<Person[] | null>(null);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");
  const [warning, setWarning] = useState(false);
  const [invited, setInvited] = useState("");
  const [cancelling, setCancelling] = useState("");

  const load = useCallback(async () => {
    try {
      setPeople(await listClientPeople(clientId));
    } catch (e) {
      console.error(e);
      setError(errorMessage(e));
    }
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!people) return;
    setProblem("");
    setInvited("");
    setBusy(true);
    try {
      const check = await checkCanInvite(email, clientId);
      if (check.problem) {
        setProblem(check.problem);
        setWarning(false);
        return;
      }
      // Normally one person per client. Ask before adding a second.
      if (people.length > 0 && !warning) {
        setWarning(true);
        return;
      }
      const saved = await inviteToClient({ email, clientId, invitedBy: profile.email });
      setInvited(saved);
      setEmail("");
      setWarning(false);
      await load();
    } catch (e) {
      console.error(e);
      setProblem(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const cancel = async (address: string) => {
    setCancelling("");
    setInvited("");
    try {
      await cancelInvite(address);
      await load();
    } catch (e) {
      console.error(e);
      setProblem(`Could not cancel the invitation: ${errorMessage(e)}`);
    }
  };

  return (
    <div className="studio-card rounded-2xl p-5 sm:p-6 space-y-4">
      <div>
        <h3 className="font-serif text-lg font-semibold text-charcoal-900">People</h3>
        <p className="text-xs text-charcoal-600 mt-0.5 leading-relaxed">
          Who can sign in and see this client. Normally one person per client. Invited people sign in with the Google account
          of the email address you enter.
        </p>
      </div>

      {error && <p className="text-xs text-crimson-700">Could not load the people: {error}</p>}
      {!people && !error && <p className="text-xs font-mono text-charcoal-400">Loading…</p>}
      {people && people.length === 0 && <p className="text-xs text-charcoal-400">No one has been invited to this client yet.</p>}

      {people && people.length > 0 && (
        <ul className="space-y-2" aria-label="People">
          {people.map((person) => (
            <li key={person.email} className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-white border border-alabaster-200">
              <div className="min-w-0">
                <div className="text-sm font-medium text-charcoal-900 truncate">{person.email}</div>
                {person.name && <div className="text-xs text-charcoal-600">{person.name}</div>}
                {person.status === "active" && person.lastActiveAt && (
                  <div className="text-[11px] text-charcoal-400">Last active {person.lastActiveAt.toLocaleDateString()}</div>
                )}
              </div>
              <div className="flex items-center gap-2.5">
                {person.role === "admin" && <span className="text-[11px] font-mono px-2 py-0.5 rounded border bg-crimson-50 text-crimson-700 border-crimson-700/20">admin</span>}
                <span className={`text-[11px] font-mono px-2 py-0.5 rounded border ${STATUS[person.status].style}`}>{STATUS[person.status].label}</span>
                {person.status === "invited" &&
                  (cancelling === person.email ? (
                    <>
                      <button type="button" onClick={() => cancel(person.email)} className="px-2.5 py-1.5 rounded-lg bg-crimson-700 hover:bg-crimson-800 text-white text-[11px] font-medium">
                        Yes, cancel it
                      </button>
                      <button type="button" onClick={() => setCancelling("")} className="px-2.5 py-1.5 rounded-lg bg-alabaster-100 hover:bg-alabaster-200/70 text-charcoal-800 text-[11px] font-medium">
                        No
                      </button>
                    </>
                  ) : (
                    <button type="button" onClick={() => setCancelling(person.email)} className="px-2.5 py-1.5 rounded-lg bg-alabaster-50 hover:bg-alabaster-100 border border-alabaster-200 text-charcoal-800 text-[11px] font-medium">
                      Cancel invitation
                    </button>
                  ))}
              </div>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={submit} className="space-y-3 pt-1">
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="invite-email" className="sr-only">
            Email address to invite
          </label>
          <input
            id="invite-email"
            type="text"
            inputMode="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setWarning(false);
              setProblem("");
            }}
            placeholder="Email address to invite"
            className={inputClass}
          />
          <button type="submit" disabled={busy} className="px-4 py-2.5 rounded-xl bg-crimson-700 hover:bg-crimson-800 text-white text-xs font-medium flex items-center gap-1.5 disabled:opacity-60">
            <UserPlus className="w-3.5 h-3.5" /> {busy ? "Checking…" : warning ? "Invite anyway" : "Invite"}
          </button>
        </div>

        {warning && people && people.length > 0 && (
          <p role="status" className="text-xs text-charcoal-800 leading-relaxed p-3 rounded-xl bg-gold-100/60 border border-gold-300/60">
            This client already has {people.length === 1 ? "a person" : `${people.length} people`} ({people.map((p) => p.email).join(", ")}). Clients normally have one
            person. Press <strong>Invite anyway</strong> to add {normalizeEmail(email)} as well.
          </p>
        )}
        {problem && (
          <p role="status" className="text-xs text-crimson-700">
            {problem}
          </p>
        )}
      </form>

      {invited && <InviteMessage email={invited} />}
    </div>
  );
}
