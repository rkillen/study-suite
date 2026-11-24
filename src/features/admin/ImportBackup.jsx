import { useRef, useState } from "react";
import { ArchiveRestore, DatabaseZap, FileDown } from "lucide-react";
import { useStudy } from "../../context/StudyContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { triggerDownload } from "../../lib/download.js";
import AdminCard, { primaryButton, secondaryButton } from "./AdminCard.jsx";
import CsvImport from "./CsvImport.jsx";

const errorText = (error) => (error instanceof Error ? error.message : String(error));

function StarterContent() {
  const { contentEmpty, reloadContent } = useStudy();
  const { showToast } = useToast();
  const [step, setStep] = useState("idle"); // idle, confirming, working, done, failed
  const [message, setMessage] = useState("");

  const runImport = async () => {
    setStep("working");
    setMessage("Starting…");
    try {
      // Loaded only now: the starter files are not part of what everyone downloads.
      const { importSeed } = await import("../../data/seedImport.js");
      const { cards, clients } = await importSeed(setMessage);
      reloadContent();
      setMessage(`Done. Saved ${cards} shared flashcards and ${clients} clients.`);
      setStep("done");
      showToast("Starter data imported.");
    } catch (error) {
      console.error("Import failed:", error);
      setMessage(`The import stopped: ${errorText(error)}`);
      setStep("failed");
    }
  };

  return (
    <AdminCard icon={DatabaseZap} title="Starter content">
      <p className="text-sm text-charcoal-600 leading-relaxed">
        Copies the starter files from the <code className="font-mono text-xs">seed/</code> folder (the shared library and every
        client profile in <code className="font-mono text-xs">seed/clients/</code>) into Firebase.
      </p>
      <p className="text-sm text-charcoal-600 leading-relaxed">
        {contentEmpty
          ? "Firebase has no content yet. Import the starter data to get going."
          : "Content is already in Firebase. Importing again replaces the shared library and those clients with the starter versions, so any edits made in the app to them are lost."}
      </p>

      {step === "confirming" ? (
        <div className="flex flex-wrap items-center gap-2.5 p-3.5 rounded-xl bg-crimson-50 border border-crimson-700/20">
          <span className="text-xs text-crimson-700 font-medium mr-auto">Replace the existing content with the starter data?</span>
          <button type="button" onClick={runImport} className={primaryButton}>
            Yes, replace it
          </button>
          <button type="button" onClick={() => setStep("idle")} className={secondaryButton}>
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => (contentEmpty ? runImport() : setStep("confirming"))}
          disabled={step === "working"}
          className={primaryButton}
        >
          {step === "working" ? "Importing…" : contentEmpty ? "Import starter data" : "Import again…"}
        </button>
      )}

      {message && (
        <p role="status" className={`text-xs ${step === "failed" ? "text-crimson-700" : "text-charcoal-600"}`}>
          {message}
        </p>
      )}
    </AdminCard>
  );
}

function Backup() {
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const download = async () => {
    setBusy(true);
    setMessage("Collecting everything…");
    try {
      const { createBackup } = await import("../../data/backup.js");
      const backup = await createBackup();
      const day = new Date().toISOString().slice(0, 10);
      triggerDownload(JSON.stringify(backup, null, 2), `study-suite-backup-${day}.json`, "application/json");
      const cards = Object.values(backup.sharedLibrary.flashcards).reduce((sum, list) => sum + list.length, 0);
      setMessage(`Downloaded: ${cards} shared flashcards and ${Object.keys(backup.clients).length} clients.`);
      showToast("Backup downloaded.");
    } catch (error) {
      console.error("Backup failed:", error);
      setMessage(`The backup stopped: ${errorText(error)}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminCard icon={FileDown} title="Download a backup">
      <p className="text-sm text-charcoal-600 leading-relaxed">
        Saves all the content (the shared library and every client) as one file on your computer. Keep a copy before big changes.
        It does not include people&apos;s stories and progress.
      </p>
      <button type="button" onClick={download} disabled={busy} className={secondaryButton}>
        {busy ? "Working…" : "Download backup"}
      </button>
      {message && (
        <p role="status" className="text-xs text-charcoal-600">
          {message}
        </p>
      )}
    </AdminCard>
  );
}

function Restore() {
  const { reloadContent } = useStudy();
  const { showToast } = useToast();
  const fileInput = useRef(null);
  const [step, setStep] = useState("idle"); // idle, preview, working, done, failed
  const [pending, setPending] = useState(null);
  const [message, setMessage] = useState("");

  const chooseFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const { readBackup } = await import("../../data/backup.js");
      setPending(readBackup(await file.text()));
      setMessage("");
      setStep("preview");
    } catch (error) {
      setPending(null);
      setMessage(errorText(error));
      setStep("failed");
    }
  };

  const restore = async () => {
    setStep("working");
    setMessage("Starting…");
    try {
      const { replaceContent } = await import("../../data/replaceContent.js");
      const { cards, clients } = await replaceContent(pending.content, setMessage);
      reloadContent();
      setMessage(`Done. Restored ${cards} shared flashcards and ${clients} clients.`);
      setPending(null);
      setStep("done");
      showToast("Backup restored.");
    } catch (error) {
      console.error("Restore failed:", error);
      setMessage(`The restore stopped: ${errorText(error)}`);
      setStep("failed");
    }
  };

  const summary = pending?.summary;

  return (
    <AdminCard icon={ArchiveRestore} title="Restore from a backup file">
      <p className="text-sm text-charcoal-600 leading-relaxed">
        Puts the content from a backup file back into Firebase. It <strong>replaces</strong> the shared library and each client in the
        file. Clients that are not in the file are left alone.
      </p>

      <input ref={fileInput} type="file" accept=".json,application/json" onChange={chooseFile} aria-label="Backup file" className="hidden" />

      {step === "preview" && summary ? (
        <div className="space-y-3 p-3.5 rounded-xl bg-crimson-50 border border-crimson-700/20">
          <p className="text-xs text-crimson-700 leading-relaxed">
            This backup was made {summary.exportedAt ? new Date(summary.exportedAt).toLocaleString() : "at an unknown time"} and holds{" "}
            {summary.cards} shared flashcards and {summary.clientIds.length} clients ({summary.clientIds.join(", ") || "none"}). Restore it and
            replace the current content?
          </p>
          <div className="flex gap-2.5">
            <button type="button" onClick={restore} className={primaryButton}>
              Yes, restore it
            </button>
            <button
              type="button"
              onClick={() => {
                setPending(null);
                setStep("idle");
              }}
              className={secondaryButton}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => fileInput.current.click()} disabled={step === "working"} className={secondaryButton}>
          {step === "working" ? "Restoring…" : "Choose a backup file…"}
        </button>
      )}

      {message && (
        <p role="status" className={`text-xs ${step === "failed" ? "text-crimson-700" : "text-charcoal-600"}`}>
          {message}
        </p>
      )}
    </AdminCard>
  );
}

export default function ImportBackup() {
  return (
    <div className="space-y-5">
      <StarterContent />
      <CsvImport />
      <Backup />
      <Restore />
    </div>
  );
}
