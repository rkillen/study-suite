import type { Flashcard } from "../types.ts";

// Shared flashcards are stored a couple of hundred to a document, not one document per card.
// That keeps the number of database reads low: loading every card costs a handful of reads
// instead of hundreds. This file is the only place that knows about that.
//
// Document "oxford_1" holds { category: "oxford", chunk: 1, cards: [ ... ] }, "oxford_2" the next
// batch, and so on. A document can hold about 1 MB, which is thousands of cards, so the limit
// below is just a comfortable size.
export const CARDS_PER_DOC = 200;

/** What one flashcards/<category>_<n> document holds. */
export interface ChunkData {
  category: string;
  chunk: number;
  cards: Flashcard[];
}

export const chunkDocId = (category: string, chunk: number): string => `${category}_${chunk}`;

// { oxford: [cards...], ... }  ->  [{ id, data }, ...] ready to be saved
export function splitIntoChunks(flashcards: Record<string, Flashcard[]>): { id: string; data: ChunkData }[] {
  const docs: { id: string; data: ChunkData }[] = [];
  Object.entries(flashcards).forEach(([category, cards]) => {
    for (let start = 0, chunk = 1; start < cards.length; start += CARDS_PER_DOC, chunk++) {
      docs.push({
        id: chunkDocId(category, chunk),
        data: { category, chunk, cards: cards.slice(start, start + CARDS_PER_DOC) },
      });
    }
  });
  return docs;
}

// [{ category, chunk, cards }, ...] in any order  ->  { oxford: [cards...], ... }
export function joinChunks(chunkData: ChunkData[]): Record<string, Flashcard[]> {
  const flashcards: Record<string, Flashcard[]> = {};
  [...chunkData]
    .sort((a, b) => a.chunk - b.chunk)
    .forEach(({ category, cards }) => {
      flashcards[category] = [...(flashcards[category] || []), ...(cards || [])];
    });
  return flashcards;
}
