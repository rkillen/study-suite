import { useState } from "react";
import { useSignedIn } from "../../context/AuthContext.tsx";
import { parseBulkInvites, type BulkRow } from "../../data/bulkInvite.ts";
import { checkCanInvite, inviteMany, listAllPeople } from "../../data/people.ts";
import { errorMessage } from "../../lib/errors.ts";
import type { ClientSummary } from "../../types.ts";
import InviteMessage from "./InviteMessage.tsx";
import { primaryButton, secondaryButton } from "./AdminCard.tsx";

/** A line of the pasted list, after checking it against the database. */
interface CheckedRow extends BulkRow {
  /** Not a reason to refuse, but worth a look. */
  warning?: string;
}

const inputClass =
  "w-full rounded-xl bg-white border border-alabaster-200 px-3.5 py-2 text-sm text-charcoal-900 placeholder:text-charcoal-400 focus:outline-none focus:border-crimson-700";

// Checks lines against the database a few at a time, so a long list does not fire everything at once.
async function checkAgainstDatabase(rows: BulkRow[], clients: ClientSummary[]): Promise<CheckedRow[]> {
  const everyone = await listAllPeople();
  const peopleIn = new Map<string, number>();
  everyone.filter((p) => p.status !== "revoked").forEach((p) => peopleIn.set(p.clientId, (peopleIn.get(p.clientId) ?? 0) + 1));

  const checked: CheckedRow[] = rows.map((row) => ({ ...row }));
  const pending = checked.filter((row) => !row.problem);
  for (let start = 0; start < pending.length; start += 8) {
    await Promise.all(
      pending.slice(start, start + 8).map(async (row) => {
        const { problem } = await checkCanInvite(row.email, row.clientId);
        if (problem) row.problem = problem;
      })
    );
  }

  // Normally a client has one person: say so if this would make two.
  const listedFor = new Map<string, number>();
  checked.filter((row) => !row.problem).forEach((row) => listedFor.set(row.clientId, (listedFor.get(row.clientId) ?? 0) + 1));
  const nameOf = (id: string) => clients.find((c) => c.id === id)?.profileName ?? id;
  checked.forEach((row) => {
    if (row.problem) return;
    if ((peopleIn.get(row.clientId) ?? 0) > 0) row.warning = `${nameOf(row.clientId)} already has someone.`;
    else if ((listedFor.get(row.clientId) ?? 0) > 1) row.warning = `Another line also goes to ${nameOf(row.clientId)}.`;
  });
  return checked;
}

// Paste a list of emails (and clients), look it over, and invite them all.
export default function BulkInvite({ clients, onDone }: { clients: ClientSummary[]; onDone: () => void }) {
  const { profile } = useSignedIn();
  const [text, setText] = useState("");
  const [fallback, setFallback] = useState("");
  const [step, setStep] = useState<"idle" | "checking" | "preview" | "working" | "done">("idle");
  const [rows, setRows] = useState<CheckedRow[]>([]);
  const [message, setMessage] = useState("");
  const nameOf = (id: string) => clients.find((c) => c.id === id)?.profileName ?? id;

  const preview = async () => {
    setMessage("");
    setStep("checking");
    try {
      const parsed = parseBulkInvites(text, clients, fallback);
      if (parsed.length === 0) {
        setMessage("Paste at least one line first.");
        setStep("idle");
        return;
      }
      setRows(await checkAgainstDatabase(parsed, clients));
      setStep("preview");
    } catch (e) {
      setMessage(errorMessage(e));
      setStep("idle");
    }
  };

  const ready = rows.filter((row) => !row.problem);

  const send = async () => {
    setStep("working");
    try {
      await inviteMany(ready, profile.email);
      setMessage(`Invited ${ready.length} ${ready.length === 1 ? "person" : "people"}.`);
      setStep("done");
      setText("");
      onDone();
    } catch (e) {
      console.error(e);
      setMessage(`The invitations stopped part-way: ${errorMessage(e)}. Check the People list to see who was invited.`);
      setStep("idle");
      onDone();
    }
  };

  return (
    <div className="studio-card rounded-2xl p-5 sm:p-6 space-y-4">
      <div>
        <h3 className="font-serif text-lg font-semibold text-charcoal-900">Invite many people</h3>
        <p className="text-xs text-charcoal-600 mt-0.5 leading-relaxed">
          One person per line: an email address, then a comma, then their client (its short id or its exact name). You will see a preview
          before anything is saved.
        </p>
      </div>

      <div className="space-y-1">
        <label htmlFor="bulk-list" className="text-xs font-medium text-charcoal-800">
          The list
        </label>
        <textarea
          id="bulk-list"
          rows={6}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (step !== "idle") setStep("idle");
          }}
          placeholder={"ana@example.com, morocco\nben@example.com, Swiss CRO"}
          className={`${inputClass} font-mono`}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="bulk-fallback" className="text-xs font-medium text-charcoal-800">
          For lines with no client
        </label>
        <select
          id="bulk-fallback"
          value={fallback}
          onChange={(e) => {
            setFallback(e.target.value);
            if (step !== "idle") setStep("idle");
          }}
          className={inputClass}
        >
          <option value="">Do not guess: show those lines as a problem</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.profileName} ({client.id})
            </option>
          ))}
        </select>
      </div>

      <button type="button" onClick={preview} disabled={step === "checking" || step === "working" || !text.trim()} className={secondaryButton}>
        {step === "checking" ? "Checking…" : "Preview the invitations"}
      </button>

      {step === "preview" && (
        <div className="space-y-3 p-4 rounded-xl bg-crimson-50 border border-crimson-700/20">
          <p className="text-xs font-semibold text-crimson-700">
            {ready.length} of {rows.length} {rows.length === 1 ? "line" : "lines"} can be invited:
          </p>
          <ul className="space-y-1.5" aria-label="Invitation preview">
            {rows.map((row) => (
              <li key={row.line} className="text-xs text-charcoal-800 leading-relaxed">
                <span className="font-mono text-charcoal-400">{row.line}.</span> <strong className="font-medium break-all">{row.email}</strong>
                {row.clientId && <> → {nameOf(row.clientId)}</>}
                {row.problem ? (
                  <span className="block pl-5 text-crimson-700">Not invited: {row.problem}</span>
                ) : (
                  <span className="block pl-5 text-charcoal-600">Will be invited{row.warning ? `. Note: ${row.warning}` : "."}</span>
                )}
              </li>
            ))}
          </ul>
          <div className="flex gap-2.5">
            <button type="button" onClick={send} disabled={ready.length === 0} className={primaryButton}>
              Invite {ready.length} {ready.length === 1 ? "person" : "people"}
            </button>
            <button type="button" onClick={() => setStep("idle")} className={secondaryButton}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {step === "working" && <p className="text-xs text-charcoal-600">Inviting…</p>}
      {message && (
        <p role="status" className={`text-xs ${step === "done" ? "text-charcoal-600" : "text-crimson-700"}`}>
          {message}
        </p>
      )}
      {step === "done" && <InviteMessage />}
    </div>
  );
}
