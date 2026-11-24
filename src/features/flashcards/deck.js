export const DECK_SIZE = 20;

// Works out which cards are in the rolling deck: keep the saved ones that are
// still valid (exist and aren't mastered), then top up from the pool in order.
export function syncDeck(pool, savedIds = [], masteredIds = []) {
  const inPool = new Set(pool.map((card) => card.id));
  const mastered = new Set(masteredIds);

  const deck = savedIds.filter((id) => inPool.has(id) && !mastered.has(id));
  const inDeck = new Set(deck);

  for (const card of pool) {
    if (deck.length >= DECK_SIZE) break;
    if (!mastered.has(card.id) && !inDeck.has(card.id)) {
      deck.push(card.id);
      inDeck.add(card.id);
    }
  }
  return deck;
}
