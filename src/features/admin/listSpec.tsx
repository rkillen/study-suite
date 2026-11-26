import type { ReactNode } from "react";
import type { Flashcard } from "../../types.ts";
import ListEditor, { type Field } from "./ListEditor.tsx";

// Each editable list in the Admin area (Beachcombing words, questions, flashcards, watch-outs...) is
// described by a "list spec": which boxes the form has, how a row looks, how to read the list out of
// the data it belongs to, and how to save it. defineList() turns a spec into something the screen can
// show. SharedContent.tsx and ClientEditor.tsx are mostly lists of specs.

/**
 * Describes one editable list inside a bigger piece of data.
 *   Source  the data the list belongs to (the shared library, or one client)
 *   Item    what the editor shows and edits (an object)
 *   Stored  what the list holds in Source (for text lists, plain strings)
 */
export interface ListSpec<Source, Item extends object, Stored> {
  id: string;
  label: string;
  /** Lists with the same group are shown side by side under a heading. */
  group?: string;
  help: string;
  fields: Field[];
  /** What one item is called, for button labels ("word", "card"...). */
  noun: string;
  bulk?: boolean;
  reorder?: boolean;
  /** Reads this list out of the source. */
  read: (source: Source) => Stored[];
  toItems: (stored: Stored[]) => Item[];
  fromItems: (items: Item[]) => Stored[];
  /** The source with this list replaced. */
  apply: (source: Source, stored: Stored[]) => Source;
  /** Saves the changed source to Firebase. */
  persist: (source: Source) => Promise<void>;
  makeItem: (values: Record<string, string>) => Item;
  searchText: (item: Item) => string;
  renderSummary: (item: Item) => ReactNode;
}

/** A list spec, ready to show. The list's item type is hidden inside, so lists of different kinds can share one array. */
export interface ListDef<Source> {
  id: string;
  label: string;
  group?: string;
  help: string;
  /** How many items are in the list now. */
  count: (source: Source) => number;
  /** The editor. onSaved receives the source with the change in it, after it has been saved. */
  render: (source: Source, onSaved: (next: Source) => void) => ReactNode;
}

export function defineList<Source, Item extends object, Stored>(spec: ListSpec<Source, Item, Stored>): ListDef<Source> {
  return {
    id: spec.id,
    label: spec.label,
    group: spec.group,
    help: spec.help,
    count: (source) => spec.read(source).length,
    render: (source, onSaved) => (
      <ListEditor<Item>
        key={spec.id}
        items={spec.toItems(spec.read(source))}
        fields={spec.fields}
        noun={spec.noun}
        bulk={spec.bulk}
        reorder={spec.reorder}
        makeItem={spec.makeItem}
        searchText={spec.searchText}
        renderSummary={spec.renderSummary}
        onChange={async (items) => {
          const next = spec.apply(source, spec.fromItems(items));
          await spec.persist(next);
          onSaved(next);
        }}
      />
    ),
  };
}

// ---------------------------------------------------------------------------------------------
// Pieces several lists share.
// ---------------------------------------------------------------------------------------------

/** A list of plain text (words, questions, prompts) is edited as { text } items. */
export interface TextItem {
  text: string;
}

export const textListItems = {
  toItems: (strings: string[]): TextItem[] => strings.map((text) => ({ text })),
  fromItems: (items: TextItem[]): string[] => items.map((item) => item.text),
  makeItem: (values: Record<string, string>): TextItem => ({ text: values.text ?? "" }),
  searchText: (item: TextItem): string => item.text,
  renderSummary: (item: TextItem): ReactNode => <span className="leading-snug">{item.text}</span>,
};

/** The form for a flashcard: shared cards and a client's personal cards look the same. */
export const CARD_FIELDS: Field[] = [
  { name: "term", label: "Front of the card (the term)", required: true },
  { name: "definition", label: "Back of the card (definition)", required: true, multiline: true },
  { name: "example", label: "Example sentence", multiline: true },
  { name: "note", label: "Small note or tag" },
];

export const cardSearchText = (card: Flashcard): string => `${card.term} ${card.definition}`;

export const renderCardSummary = (card: Flashcard): ReactNode => (
  <div className="space-y-0.5">
    <div className="font-serif text-base font-semibold text-charcoal-900">{card.term}</div>
    <div className="text-xs text-charcoal-600 leading-relaxed">{card.definition}</div>
    {card.example && <div className="text-xs text-charcoal-400 italic leading-relaxed">{card.example}</div>}
  </div>
);
