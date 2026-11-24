// Shared flashcards are stored a couple of hundred to a document, not one document per card.
// That keeps the number of database reads low: loading every card costs a handful of reads
// instead of hundreds. This file is the only place that knows about that.
//
// Document "oxford_1" holds { category: "oxford", chunk: 1, cards: [ ... ] }, "oxford_2" the next
// batch, and so on. A document can hold about 1 MB, which is thousands of cards, so the limit
// below is just a comfortable size.
export const CARDS_PER_DOC = 200;

export const chunkDocId = (category, chunk) => `${category}_${chunk}`;

// { oxford: [cards...], ... }  ->  [{ id, data }, ...] ready to be saved
export function splitIntoChunks(flashcards) {
  const docs = [];
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
export function joinChunks(chunkData) {
  const flashcards = {};
  [...chunkData]
    .sort((a, b) => a.chunk - b.chunk)
    .forEach(({ category, cards }) => {
      flashcards[category] = [...(flashcards[category] || []), ...(cards || [])];
    });
  return flashcards;
}
