import { fetchSharedLibrary } from "./firestoreSource.js";
import { saveBeachcombing, saveFlashcardCategory, savePreOutliningQuestions } from "./firestoreWriters.js";
import { normalizeLibrary } from "./normalize.js";

// Saving the result of convertAppSheet (see appsheetCsv.js). Only the lists in "changes" are replaced.
// Everything else (other decks, story prompts, every client) is left exactly as it is.

export async function loadCurrentLibrary() {
  return normalizeLibrary(await fetchSharedLibrary());
}

export async function applyCsvChanges(changes, onProgress = () => {}) {
  const library = await loadCurrentLibrary();

  if (Object.keys(changes.beachcombing).length > 0) {
    onProgress("Saving the Beachcombing words…");
    await saveBeachcombing({ ...library.beachcombing, ...changes.beachcombing });
  }
  if (changes.questions) {
    onProgress("Saving the Pre-Outlining questions…");
    await savePreOutliningQuestions(changes.questions);
  }
  for (const [deck, cards] of Object.entries(changes.flashcards)) {
    onProgress(`Saving the ${deck} flashcards…`);
    await saveFlashcardCategory(deck, cards);
  }
}
