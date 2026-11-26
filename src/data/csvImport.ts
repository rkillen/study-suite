import type { Library } from "../types.ts";
import type { CsvChanges, CsvDeck } from "./appsheetCsv.ts";
import { fetchSharedLibrary } from "./firestoreSource.ts";
import { saveBeachcombing, saveFlashcardCategory, savePreOutliningQuestions } from "./firestoreWriters.ts";
import { normalizeLibrary } from "./normalize.ts";

// Saving the result of convertAppSheet (see appsheetCsv.ts). Only the lists in "changes" are replaced.
// Everything else (other decks, story prompts, every client) is left exactly as it is.

export async function loadCurrentLibrary(): Promise<Library> {
  return normalizeLibrary(await fetchSharedLibrary());
}

export async function applyCsvChanges(changes: CsvChanges, onProgress: (message: string) => void = () => {}): Promise<void> {
  const library = await loadCurrentLibrary();

  if (Object.keys(changes.beachcombing).length > 0) {
    onProgress("Saving the Beachcombing words…");
    await saveBeachcombing({ ...library.beachcombing, ...changes.beachcombing });
  }
  if (changes.questions) {
    onProgress("Saving the Pre-Outlining questions…");
    await savePreOutliningQuestions(changes.questions);
  }
  for (const [deck, cards] of Object.entries(changes.flashcards) as [CsvDeck, NonNullable<CsvChanges["flashcards"][CsvDeck]>][]) {
    onProgress(`Saving the ${deck} flashcards…`);
    await saveFlashcardCategory(deck, cards);
  }
}
