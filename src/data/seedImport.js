import { saveClientProfile, saveSharedLibrary } from "./firestoreWriters.js";
import { normalizeClientProfile, normalizeLibrary } from "./normalize.js";
import * as seed from "./seedSource.js";

// Copies everything in the /seed folder into Firebase: the shared library and every client.
// Safe to run again, but it REPLACES what is stored for those, so edits made in the app are lost.
// Not copied: the "version", "generatedAt" and "specialtyPacks" entries of shared-library.json
// (the app never used them) and radiology's "scenarios-hidden" list. They stay in the files.
export async function importSeed(onProgress = () => {}) {
  onProgress("Saving the shared library…");
  const library = normalizeLibrary(await seed.fetchSharedLibrary());
  await saveSharedLibrary(library);

  const total = seed.clientIds.length;
  for (const [index, clientId] of seed.clientIds.entries()) {
    onProgress(`Saving client ${index + 1} of ${total}: ${clientId}…`);
    const raw = await seed.fetchClientProfile(clientId);
    await saveClientProfile(normalizeClientProfile(raw, clientId));
  }

  const cards = Object.values(library.flashcards).reduce((sum, list) => sum + list.length, 0);
  return { cards, clients: total };
}
