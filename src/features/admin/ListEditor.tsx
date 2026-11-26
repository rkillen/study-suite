import { useId, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ListPlus, Pencil, Plus, Search, Trash2 } from "lucide-react";

// A list of things an admin can add to, edit, delete and (optionally) reorder.
// Every list in the Admin area (words, questions, flashcards, watch-outs...) is one of these.
const PAGE_SIZE = 25;

/** One box in the add/edit form. */
export interface Field {
  /** The name of the item's property this box edits. */
  name: string;
  label: string;
  multiline?: boolean;
  required?: boolean;
  placeholder?: string;
}

type Values = Record<string, string>;

/** null = nothing open; "new" and "bulk" = those forms; { edit: n } = editing the item at position n. */
type Mode = null | "new" | "bulk" | { edit: number };

export interface ListEditorProps<T extends object> {
  /** The list, as an array of objects. */
  items: T[];
  /** The boxes in the add/edit form. */
  fields: Field[];
  /** What to show for each row. */
  renderSummary: (item: T) => ReactNode;
  /** The text the search box looks in. */
  searchText: (item: T) => string;
  /** Builds a new item from the form. This is where a new id is made. */
  makeItem: (values: Values) => T;
  /** Saves the new list. It must throw if saving fails. */
  onChange: (items: T[]) => Promise<void>;
  /** What one item is called, for button labels ("word", "card"...). */
  noun?: string;
  /** Allow pasting many items at once, one per line (uses the first field). */
  bulk?: boolean;
  /** Show move up / move down buttons. */
  reorder?: boolean;
}

/** What the editor needs to show a message under the buttons. */
interface Notice {
  ok: boolean;
  text: string;
}

const inputClass =
  "w-full rounded-xl bg-alabaster-50 border border-alabaster-200 px-3.5 py-2 text-sm text-charcoal-900 placeholder:text-charcoal-400 focus:outline-none focus:border-crimson-700";
const smallButton =
  "px-2.5 py-1.5 rounded-lg text-[11px] font-medium flex items-center gap-1 transition-colors disabled:opacity-50";

interface EntryFormProps {
  fields: Field[];
  values: Values;
  setValues: (values: Values) => void;
  busy: boolean;
  submitLabel: string;
  onCancel: () => void;
  onSubmit: (event: FormEvent) => void;
}

function EntryForm({ fields, values, setValues, busy, submitLabel, onCancel, onSubmit }: EntryFormProps) {
  const baseId = useId();
  return (
    <form onSubmit={onSubmit} className="p-4 rounded-xl bg-alabaster-50 border border-alabaster-200 space-y-3">
      {fields.map((field, index) => {
        const id = `${baseId}-${field.name}`;
        const common = {
          id,
          value: values[field.name] ?? "",
          placeholder: field.placeholder,
          autoFocus: index === 0,
          onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setValues({ ...values, [field.name]: e.target.value }),
          className: `${inputClass} bg-white`,
        };
        return (
          <div key={field.name} className="space-y-1">
            <label htmlFor={id} className="text-xs font-medium text-charcoal-800">
              {field.label}
              {field.required ? <span className="text-crimson-700"> *</span> : <span className="text-charcoal-400"> (optional)</span>}
            </label>
            {field.multiline ? <textarea rows={3} {...common} /> : <input type="text" {...common} />}
          </div>
        );
      })}
      <div className="flex items-center gap-2 pt-1">
        <button type="submit" disabled={busy} className={`${smallButton} px-4 py-2 text-xs bg-crimson-700 hover:bg-crimson-800 text-white`}>
          {busy ? "Saving…" : submitLabel}
        </button>
        <button type="button" onClick={onCancel} disabled={busy} className={`${smallButton} px-4 py-2 text-xs bg-white hover:bg-alabaster-100 border border-alabaster-200 text-charcoal-800`}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function ListEditor<T extends object>({ items, fields, renderSummary, searchText, makeItem, onChange, noun = "item", bulk = false, reorder = false }: ListEditorProps<T>) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [mode, setMode] = useState<Mode>(null);
  const [values, setValues] = useState<Values>({});
  const [bulkText, setBulkText] = useState("");
  const [deleting, setDeleting] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const needle = query.trim().toLowerCase();
  const rows = items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => !needle || searchText(item).toLowerCase().includes(needle));
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const shown = rows.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  const commit = async (next: T[], successText: string): Promise<boolean> => {
    setBusy(true);
    setNotice(null);
    try {
      await onChange(next);
      setNotice({ ok: true, text: successText });
      return true;
    } catch (error) {
      console.error(error);
      setNotice({ ok: false, text: `Could not save: ${error instanceof Error ? error.message : String(error)}` });
      return false;
    } finally {
      setBusy(false);
    }
  };

  const openForm = (nextMode: Mode, nextValues: Values = {}) => {
    setMode(nextMode);
    setValues(nextValues);
    setDeleting(null);
    setNotice(null);
  };

  const submitForm = async (event: FormEvent) => {
    event.preventDefault();
    const missing = fields.find((f) => f.required && !String(values[f.name] ?? "").trim());
    if (missing) {
      setNotice({ ok: false, text: `${missing.label} is required.` });
      return;
    }
    const cleaned = Object.fromEntries(fields.map((f) => [f.name, String(values[f.name] ?? "").trim()]));

    if (mode === "new") {
      if (await commit([...items, makeItem(cleaned)], `Added the ${noun}.`)) {
        setMode(null);
        setQuery("");
        setPage(Math.floor(items.length / PAGE_SIZE));
      }
    } else if (mode && typeof mode === "object" && (await commit(items.map((item, i) => (i === mode.edit ? ({ ...item, ...cleaned } as T) : item)), `Saved the ${noun}.`))) {
      setMode(null);
    }
  };

  const submitBulk = async (event: FormEvent) => {
    event.preventDefault();
    const field = fields[0]!.name;
    const known = new Set(items.map((item) => searchText(item).trim().toLowerCase()));
    const fresh: T[] = [];
    let skipped = 0;
    bulkText.split("\n").map((line) => line.trim()).filter(Boolean).forEach((line) => {
      const key = line.toLowerCase();
      if (known.has(key)) {
        skipped += 1;
      } else {
        known.add(key);
        fresh.push(makeItem({ [field]: line }));
      }
    });
    if (!fresh.length) {
      setNotice({ ok: false, text: skipped ? "Everything you pasted is already in the list." : "Paste at least one line." });
      return;
    }
    const note = skipped ? ` (${skipped} already in the list, skipped)` : "";
    if (await commit([...items, ...fresh], `Added ${fresh.length} ${noun}${fresh.length === 1 ? "" : "s"}${note}.`)) {
      setMode(null);
      setBulkText("");
      setQuery("");
      setPage(Math.floor((items.length + fresh.length - 1) / PAGE_SIZE));
    }
  };

  const remove = async (index: number) => {
    setDeleting(null);
    await commit(items.filter((_, i) => i !== index), `Deleted the ${noun}.`);
  };

  const move = async (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target] as T, next[index] as T];
    await commit(next, `Moved the ${noun}.`);
  };

  const editing = mode && typeof mode === "object" ? mode.edit : null;
  const formValuesOf = (item: T): Values =>
    Object.fromEntries(fields.map((f) => [f.name, String((item as Record<string, unknown>)[f.name] ?? "")]));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {items.length > 8 && (
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-3.5 h-3.5 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(0);
              }}
              placeholder={`Search ${items.length} ${noun}s…`}
              aria-label={`Search ${noun}s`}
              className={`${inputClass} pl-9`}
            />
          </div>
        )}
        <div className="flex items-center gap-2 ml-auto">
          {bulk && (
            <button type="button" onClick={() => openForm("bulk")} disabled={busy} className={`${smallButton} px-3.5 py-2 text-xs bg-white hover:bg-alabaster-50 border border-alabaster-200 text-charcoal-800`}>
              <ListPlus className="w-3.5 h-3.5 text-gold-600" /> Add several
            </button>
          )}
          <button type="button" onClick={() => openForm("new")} disabled={busy} className={`${smallButton} px-3.5 py-2 text-xs bg-crimson-700 hover:bg-crimson-800 text-white`}>
            <Plus className="w-3.5 h-3.5" /> Add {noun}
          </button>
        </div>
      </div>

      {notice && (
        <p role="status" className={`text-xs ${notice.ok ? "text-charcoal-600" : "text-crimson-700"}`}>
          {notice.text}
        </p>
      )}

      {mode === "new" && (
        <EntryForm fields={fields} values={values} setValues={setValues} busy={busy} submitLabel={`Add ${noun}`} onCancel={() => setMode(null)} onSubmit={submitForm} />
      )}

      {mode === "bulk" && (
        <form onSubmit={submitBulk} className="p-4 rounded-xl bg-alabaster-50 border border-alabaster-200 space-y-3">
          <label htmlFor="bulk-text" className="text-xs font-medium text-charcoal-800">
            One {noun} per line. Ones already in the list are skipped.
          </label>
          <textarea id="bulk-text" rows={6} value={bulkText} onChange={(e) => setBulkText(e.target.value)} autoFocus className={`${inputClass} bg-white font-mono`} />
          <div className="flex items-center gap-2">
            <button type="submit" disabled={busy} className={`${smallButton} px-4 py-2 text-xs bg-crimson-700 hover:bg-crimson-800 text-white`}>
              {busy ? "Saving…" : `Add these ${noun}s`}
            </button>
            <button type="button" onClick={() => setMode(null)} disabled={busy} className={`${smallButton} px-4 py-2 text-xs bg-white hover:bg-alabaster-100 border border-alabaster-200 text-charcoal-800`}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {items.length === 0 && mode !== "new" && mode !== "bulk" && (
        <p className="p-6 rounded-xl bg-alabaster-50 border border-alabaster-200 text-center text-xs text-charcoal-400">
          Nothing here yet. Use "Add {noun}" to start the list.
        </p>
      )}
      {items.length > 0 && rows.length === 0 && (
        <p className="p-6 rounded-xl bg-alabaster-50 border border-alabaster-200 text-center text-xs text-charcoal-400">No {noun}s match your search.</p>
      )}

      <ul className="space-y-2">
        {shown.map(({ item, index }) => (
          <li key={index}>
            {editing === index ? (
              <EntryForm fields={fields} values={values} setValues={setValues} busy={busy} submitLabel="Save changes" onCancel={() => setMode(null)} onSubmit={submitForm} />
            ) : (
              <div className="flex items-start justify-between gap-3 p-3.5 rounded-xl bg-white border border-alabaster-200">
                <div className="min-w-0 flex-1 text-sm text-charcoal-900">{renderSummary(item)}</div>
                {deleting === index ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] text-crimson-700 font-medium">Delete?</span>
                    <button type="button" onClick={() => remove(index)} disabled={busy} className={`${smallButton} bg-crimson-700 hover:bg-crimson-800 text-white`}>
                      Yes, delete
                    </button>
                    <button type="button" onClick={() => setDeleting(null)} className={`${smallButton} bg-alabaster-100 hover:bg-alabaster-200/70 text-charcoal-800`}>
                      No
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 shrink-0">
                    {reorder && !needle && (
                      <>
                        <button type="button" onClick={() => move(index, -1)} disabled={busy || index === 0} aria-label={`Move ${noun} up`} className={`${smallButton} bg-alabaster-50 hover:bg-alabaster-100 border border-alabaster-200 text-charcoal-800`}>
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button type="button" onClick={() => move(index, 1)} disabled={busy || index === items.length - 1} aria-label={`Move ${noun} down`} className={`${smallButton} bg-alabaster-50 hover:bg-alabaster-100 border border-alabaster-200 text-charcoal-800`}>
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </>
                    )}
                    <button type="button" onClick={() => openForm({ edit: index }, formValuesOf(item))} disabled={busy} className={`${smallButton} bg-alabaster-50 hover:bg-alabaster-100 border border-alabaster-200 text-charcoal-800`}>
                      <Pencil className="w-3 h-3" /> Edit
                    </button>
                    <button type="button" onClick={() => setDeleting(index)} disabled={busy} className={`${smallButton} bg-alabaster-50 hover:bg-alabaster-100 border border-alabaster-200 text-charcoal-800`}>
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>

      {pageCount > 1 && (
        <div className="flex items-center justify-between text-xs text-charcoal-600">
          <button type="button" onClick={() => setPage(currentPage - 1)} disabled={currentPage === 0} className={`${smallButton} bg-white border border-alabaster-200 text-charcoal-800`}>
            <ChevronLeft className="w-3 h-3" /> Previous
          </button>
          <span className="font-mono">
            Page {currentPage + 1} of {pageCount} · {rows.length} {noun}s
          </span>
          <button type="button" onClick={() => setPage(currentPage + 1)} disabled={currentPage >= pageCount - 1} className={`${smallButton} bg-white border border-alabaster-200 text-charcoal-800`}>
            Next <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}
