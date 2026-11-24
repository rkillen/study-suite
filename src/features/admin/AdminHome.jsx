import { useState } from "react";
import { DatabaseZap } from "lucide-react";
import { useStudy } from "../../context/StudyContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";

// idle -> (confirming ->) working -> done | failed
export default function AdminHome() {
  const { contentEmpty, reloadContent } = useStudy();
  const { showToast } = useToast();
  const [step, setStep] = useState("idle");
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
      setMessage(`The import stopped: ${error.message || error}`);
      setStep("failed");
    }
  };

  const startImport = () => (contentEmpty ? runImport() : setStep("confirming"));

  return (
    <section className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-charcoal-900">Admin</h1>
        <p className="text-xs sm:text-sm text-charcoal-600">Manage the content everyone practises with.</p>
      </div>

      <div className="studio-card rounded-2xl p-6 space-y-4 max-w-3xl">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-gold-100 text-gold-600 flex items-center justify-center shrink-0">
            <DatabaseZap className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <h2 className="font-serif text-lg font-semibold text-charcoal-900">Starter content</h2>
            <p className="text-sm text-charcoal-600 leading-relaxed">
              Copies the starter files from the <code className="font-mono text-xs">seed/</code> folder (the shared library
              and every client profile in <code className="font-mono text-xs">seed/clients/</code>) into Firebase.
            </p>
            <p className="text-sm text-charcoal-600 leading-relaxed">
              {contentEmpty
                ? "Firebase has no content yet. Import the starter data to get going."
                : "Content is already in Firebase. Importing again replaces the shared library and those clients with the starter versions, so any edits made in the app to them are lost."}
            </p>
          </div>
        </div>

        {step === "confirming" ? (
          <div className="flex flex-wrap items-center gap-2.5 p-3.5 rounded-xl bg-crimson-50 border border-crimson-700/20">
            <span className="text-xs text-crimson-700 font-medium mr-auto">Replace the existing content with the starter data?</span>
            <button
              type="button"
              onClick={runImport}
              className="px-4 py-2 rounded-xl bg-crimson-700 hover:bg-crimson-800 text-white text-xs font-medium transition-colors"
            >
              Yes, replace it
            </button>
            <button
              type="button"
              onClick={() => setStep("idle")}
              className="px-4 py-2 rounded-xl bg-white hover:bg-alabaster-50 border border-alabaster-200 text-xs font-medium text-charcoal-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={startImport}
            disabled={step === "working"}
            className="px-4 py-2.5 rounded-xl bg-crimson-700 hover:bg-crimson-800 text-white text-xs font-medium transition-colors disabled:opacity-60"
          >
            {step === "working" ? "Importing…" : contentEmpty ? "Import starter data" : "Import again…"}
          </button>
        )}

        {message && (
          <p role="status" className={`text-xs ${step === "failed" ? "text-crimson-700" : "text-charcoal-600"}`}>
            {message}
          </p>
        )}
      </div>
    </section>
  );
}
