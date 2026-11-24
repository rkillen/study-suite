import { saveClientProfile, saveSharedLibrary } from "./firestoreWriters.js";

// Writes a whole set of content to Firebase, REPLACING what is stored for the shared library and for
// each client given. Clients that are not in the list are left alone.
// content: { library, clients } where library and each client are in the shape from normalize.js.
// Used by "Import starter data" and by "Restore from a backup file".
export async function replaceContent({ library, clients }, onProgress = () => {}) {
  onProgress("Saving the shared library…");
  await saveSharedLibrary(library);

  for (const [index, client] of clients.entries()) {
    onProgress(`Saving client ${index + 1} of ${clients.length}: ${client.clientId}…`);
    await saveClientProfile(client);
  }

  const cards = Object.values(library.flashcards).reduce((sum, list) => sum + list.length, 0);
  return { cards, clients: clients.length };
}
