import { useCallback, useMemo } from "react";
import { useStoredState } from "./useStoredState.js";

// The person's own work: jots, stories, mastered cards and their active decks.
// Components only use the actions below, so where this is stored can change
// (browser now, Firebase later) without touching any screen.
const DEFAULT_PROGRESS = {
  jots: [],
  stories: [],
  masteredIds: [],
  activeDecks: {},
};

export function useProgress(clientId) {
  const [progress, update] = useStoredState(`studysuite_progress_${clientId}`, DEFAULT_PROGRESS);

  const addJot = useCallback(
    ({ word, text }) =>
      update((p) => ({
        jots: [{ id: `jot_${Date.now()}`, word, text, date: new Date().toISOString() }, ...p.jots],
      })),
    [update]
  );

  const addStory = useCallback(
    ({ title, prompt, body }) =>
      update((p) => ({
        stories: [{ id: `story_${Date.now()}`, title, prompt, body, createdAt: new Date().toISOString() }, ...p.stories],
      })),
    [update]
  );

  const updateStory = useCallback(
    (id, { title, prompt, body }) =>
      update((p) => ({
        stories: p.stories.map((s) =>
          s.id === id ? { ...s, title, prompt, body, updatedAt: new Date().toISOString() } : s
        ),
      })),
    [update]
  );

  const removeStory = useCallback(
    (id) => update((p) => ({ stories: p.stories.filter((s) => s.id !== id) })),
    [update]
  );

  const setActiveDeck = useCallback(
    (category, ids) => update((p) => ({ activeDecks: { ...p.activeDecks, [category]: ids } })),
    [update]
  );

  const masterCard = useCallback(
    (category, cardId, deckIds) =>
      update((p) => ({
        masteredIds: p.masteredIds.includes(cardId) ? p.masteredIds : [...p.masteredIds, cardId],
        activeDecks: { ...p.activeDecks, [category]: deckIds },
      })),
    [update]
  );

  const actions = useMemo(
    () => ({ addJot, addStory, updateStory, removeStory, setActiveDeck, masterCard }),
    [addJot, addStory, updateStory, removeStory, setActiveDeck, masterCard]
  );

  return { progress, actions };
}
