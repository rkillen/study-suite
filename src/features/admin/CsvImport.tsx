import { useState } from "react";
import { FileUp } from "lucide-react";
import { useStudy } from "../../context/StudyContext.tsx";
import { useToast } from "../../context/ToastContext.tsx";
import type { CsvChanges, CsvReport, PreviewRow } from "../../data/appsheetCsv.ts";
import { errorMessage as errorText } from "../../lib/errors.ts";
import AdminCard, { primaryButton, secondaryButton } from "./AdminCard.tsx";

const plural = (n: number, one: string, many: string): string => `${n} ${n === 1 ? one : many}`;

const fileClass =
  "block w-full text-xs text-charcoal-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-alabaster-200 file:text-charcoal-900 hover:file:bg-alabaster-300";

/** What the preview shows before anything is saved. */
interface Preview {
  changes: CsvChanges;
  lists: PreviewRow[];
  report: CsvReport;
}

// Import the AppSheet CSV exports. The rules (which category goes where) are in data/appsheetCsv.js.
export default function CsvImport() {
  const { reloadContent } = useStudy();
  const { showToast } = useToast();
  const [promptsFile, setPromptsFile] = useState<File | null>(null);
  const [categoriesFile, setCategoriesFile] = useState<File | null>(null);
  const [step, setStep] = useState("idle"); // idle, checking, preview, working, done, failed
  const [preview, setPreview] = useState<Preview | null>(null);
  const [message, setMessage] = useState("");

  const reset = () => {
    setPreview(null);
    setStep("idle");
  };

  const check = async () => {
    if (!promptsFile) return;
    setStep("checking");
    setMessage("");
    setPreview(null);
    try {
      const csv = await import("../../data/appsheetCsv.ts");
      const { loadCurrentLibrary } = await import("../../data/csvImport.ts");

      const promptRows = csv.readPromptsCsv(await promptsFile.text());
      const categoryRows = categoriesFile ? csv.readCategoriesCsv(await categoriesFile.text()) : [];
      const library = await loadCurrentLibrary();
      const converted = csv.convertAppSheet(promptRows, categoryRows);
      const changes = csv.avoidIdClashes(converted.changes, library);
      const lists = csv.describeChanges(changes, library);

      if (lists.length === 0) {
        setMessage(`Nothing in this file belongs to a category the app imports, so nothing would change. (${converted.report.rows} rows, ${converted.report.unused} in other categories.)`);
        setStep("failed");
        return;
      }
      setPreview({ changes, lists, report: converted.report });
      setStep("preview");
    } catch (error) {
      setMessage(errorText(error));
      setStep("failed");
    }
  };

  const apply = async () => {
    if (!preview) return;
    setStep("working");
    setMessage("Starting…");
    try {
      const { applyCsvChanges } = await import("../../data/csvImport.ts");
      await applyCsvChanges(preview.changes, setMessage);
      reloadContent();
      setMessage(`Done. Replaced ${preview.lists.length} ${preview.lists.length === 1 ? "list" : "lists"}.`);
      setPreview(null);
      setStep("done");
      showToast("CSV imported.");
    } catch (error) {
      console.error("CSV import failed:", error);
      setMessage(`The import stopped: ${errorText(error)}`);
      setStep("failed");
    }
  };

  return (
    <AdminCard icon={FileUp} title="Import AppSheet CSVs">
      <p className="text-sm text-charcoal-600 leading-relaxed">
        Choose the Prompts CSV exported from AppSheet (and, if you have it, the Categories CSV). You will see what would change before
        anything is saved. Only the lists that the file has something for are replaced; everything else stays as it is.
      </p>

      <details className="text-xs text-charcoal-600">
        <summary className="cursor-pointer font-medium text-charcoal-800">Which AppSheet categories go where?</summary>
        <ul className="mt-2 space-y-1 leading-relaxed list-disc pl-5">
          <li>C20: Beachcombing words (the first 150 become tier 1, the rest tier 3)</li>
          <li>C32 and C33: Beachcombing tier 2</li>
          <li>C22: Pre-Outlining questions</li>
          <li>C35: Oxford B2 flashcards</li>
          <li>C28 and C29: phrasal verb flashcards</li>
          <li>C1 to C16, C21, C27 and C37: idiom and metaphor flashcards</li>
          <li>Any other category is skipped. The interview flashcards and story prompts are never changed by this import.</li>
        </ul>
        <p className="mt-2 text-charcoal-400">This list lives at the top of src/data/appsheetCsv.js if it ever needs changing.</p>
      </details>

      <div className="grid gap-3 sm:grid-cols-2 pt-1">
        <div className="p-3.5 rounded-xl bg-alabaster-50 border border-dashed border-alabaster-300 space-y-1.5">
          <label htmlFor="csv-prompts" className="block text-xs font-semibold text-charcoal-800">
            Prompts CSV <span className="text-crimson-700">*</span>
          </label>
          <input id="csv-prompts" type="file" accept=".csv,text/csv" className={fileClass} onChange={(e) => { setPromptsFile(e.target.files?.[0] ?? null); reset(); }} />
        </div>
        <div className="p-3.5 rounded-xl bg-alabaster-50 border border-dashed border-alabaster-300 space-y-1.5">
          <label htmlFor="csv-categories" className="block text-xs font-semibold text-charcoal-800">
            Categories CSV <span className="text-charcoal-400">(optional: gives the cards their tags)</span>
          </label>
          <input id="csv-categories" type="file" accept=".csv,text/csv" className={fileClass} onChange={(e) => { setCategoriesFile(e.target.files?.[0] ?? null); reset(); }} />
        </div>
      </div>

      {step === "preview" && preview ? (
        <div className="space-y-3 p-4 rounded-xl bg-crimson-50 border border-crimson-700/20">
          <p className="text-xs font-semibold text-crimson-700">This would replace these lists:</p>
          <table className="w-full text-xs text-charcoal-800">
            <thead>
              <tr className="text-left text-charcoal-400 font-mono text-[11px]">
                <th className="font-normal pb-1">List</th>
                <th className="font-normal pb-1 text-right">Now</th>
                <th className="font-normal pb-1 text-right">After</th>
              </tr>
            </thead>
            <tbody>
              {preview.lists.map((list) => (
                <tr key={list.label} className="border-t border-crimson-700/10">
                  <td className="py-1">{list.label}</td>
                  <td className="py-1 text-right font-mono">{list.before}</td>
                  <td className="py-1 text-right font-mono font-semibold">{list.after}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <ul className="text-[11px] text-charcoal-600 leading-relaxed space-y-0.5">
            <li>
              {plural(preview.report.rows, "row", "rows")} read. {preview.report.unused} {preview.report.unused === 1 ? "was" : "were"} in other categories and {preview.report.unused === 1 ? "is" : "are"} skipped
              {preview.report.unusedCategories.length > 0 && ` (${preview.report.unusedCategories.slice(0, 6).map((c) => `${c.id}: ${c.count}`).join(", ")}${preview.report.unusedCategories.length > 6 ? ", …" : ""})`}.
            </li>
            {preview.report.blank > 0 && (
              <li>
                {plural(preview.report.blank, "row", "rows")} with no prompt {preview.report.blank === 1 ? "was" : "were"} ignored.
              </li>
            )}
            {preview.report.repeatsRemoved > 0 && (
              <li>
                {preview.report.repeatsRemoved} repeated {preview.report.repeatsRemoved === 1 ? "word or question was" : "words or questions were"} left out.
              </li>
            )}
            <li>Every other list, and every client, stays as it is. Tip: download a backup first, so you can undo this.</li>
          </ul>
          <div className="flex gap-2.5">
            <button type="button" onClick={apply} className={primaryButton}>
              Yes, replace these lists
            </button>
            <button type="button" onClick={reset} className={secondaryButton}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={check} disabled={!promptsFile || step === "checking" || step === "working"} className={secondaryButton}>
          {step === "checking" ? "Reading…" : step === "working" ? "Importing…" : "Preview the import"}
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
