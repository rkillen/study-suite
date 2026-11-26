import { useState, type FormEvent } from "react";
import { useSignedIn } from "../../context/AuthContext.tsx";
import { normalizeEmail } from "../../data/emails.ts";
import { checkCanInvite, inviteAdmin } from "../../data/people.ts";
import { errorMessage } from "../../lib/errors.ts";
import InviteMessage from "./InviteMessage.tsx";
import { primaryButton, secondaryButton } from "./AdminCard.tsx";

// Invite another admin. Admins are powerful, so there is an extra "are you sure" step.
export default function InviteAdmin({ onDone }: { onDone: () => void }) {
  const { profile } = useSignedIn();
  const [email, setEmail] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");
  const [invited, setInvited] = useState("");

  const ask = async (event: FormEvent) => {
    event.preventDefault();
    setProblem("");
    setInvited("");
    setBusy(true);
    try {
      const { problem: refused } = await checkCanInvite(email, "default");
      if (refused) setProblem(refused);
      else setConfirming(true);
    } catch (e) {
      setProblem(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    setBusy(true);
    try {
      setInvited(await inviteAdmin({ email, invitedBy: profile.email }));
      setEmail("");
      setConfirming(false);
      onDone();
    } catch (e) {
      setProblem(errorMessage(e));
      setConfirming(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="studio-card rounded-2xl p-5 sm:p-6 space-y-4">
      <div>
        <h3 className="font-serif text-lg font-semibold text-charcoal-900">Invite an admin</h3>
        <p className="text-xs text-charcoal-600 mt-0.5 leading-relaxed">
          Admins can read every person&apos;s stories and progress, change all content, and invite or switch off anyone. Only invite people you trust
          with that.
        </p>
      </div>

      <form onSubmit={ask} className="flex flex-wrap items-center gap-2">
        <label htmlFor="admin-email" className="sr-only">
          Email address of the new admin
        </label>
        <input
          id="admin-email"
          type="text"
          inputMode="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setConfirming(false);
            setProblem("");
          }}
          placeholder="Email address of the new admin"
          className="flex-1 min-w-[220px] rounded-xl bg-white border border-alabaster-200 px-3.5 py-2 text-sm text-charcoal-900 placeholder:text-charcoal-400 focus:outline-none focus:border-crimson-700"
        />
        <button type="submit" disabled={busy || !email.trim()} className={secondaryButton}>
          Invite as admin…
        </button>
      </form>

      {confirming && (
        <div className="flex flex-wrap items-center gap-2.5 p-3.5 rounded-xl bg-crimson-50 border border-crimson-700/20">
          <span className="text-xs text-crimson-700 font-medium mr-auto">Make {normalizeEmail(email)} an admin?</span>
          <button type="button" onClick={confirm} disabled={busy} className={primaryButton}>
            Yes, invite as admin
          </button>
          <button type="button" onClick={() => setConfirming(false)} className={secondaryButton}>
            No
          </button>
        </div>
      )}
      {problem && (
        <p role="status" className="text-xs text-crimson-700">
          {problem}
        </p>
      )}
      {invited && <InviteMessage email={invited} />}
    </div>
  );
}
