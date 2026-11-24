import { listClientIds, fetchClientProfile, fetchSharedLibrary } from "./firestoreSource.js";
import { normalizeClientProfile, normalizeLibrary } from "./normalize.js";

// A backup is one JSON file with the shared library and every client, in the same shapes as the
// files in /seed. It holds the CONTENT only, not people's stories and progress.
//
//   { app, kind: "backup", version, exportedAt, sharedLibrary: {...}, clients: { morocco: {...}, ... } }
const FORMAT_VERSION = 1;

export async function createBackup() {
  const sharedLibrary = normalizeLibrary(await fetchSharedLibrary());
  const clients = {};
  for (const clientId of await listClientIds()) {
    const profile = await fetchClientProfile(clientId);
    if (profile) clients[clientId] = normalizeClientProfile(profile, clientId);
  }
  return { app: "study-suite", kind: "backup", version: FORMAT_VERSION, exportedAt: new Date().toISOString(), sharedLibrary, clients };
}

// Reads the text of a backup file. Throws an Error with a plain message if it is not a usable backup.
// Returns { content: { library, clients }, summary } ready for replaceContent().
export function readBackup(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("This file is not a backup (it could not be read as JSON).");
  }
  if (data?.app !== "study-suite" || data?.kind !== "backup" || !data.sharedLibrary || typeof data.clients !== "object" || !data.clients) {
    throw new Error("This file does not look like a Study Suite backup.");
  }
  if (data.version > FORMAT_VERSION) {
    throw new Error("This backup was made by a newer version of Study Suite and cannot be restored here.");
  }

  const badId = Object.keys(data.clients).find((id) => !/^[a-zA-Z0-9_-]+$/.test(id));
  if (badId !== undefined) {
    throw new Error(`The backup has a client with an unusable id ("${badId}"). Ids may only use letters, numbers, - and _.`);
  }

  const library = normalizeLibrary(data.sharedLibrary);
  const clients = Object.entries(data.clients).map(([clientId, raw]) => normalizeClientProfile(raw, clientId));
  const cards = Object.values(library.flashcards).reduce((sum, list) => sum + list.length, 0);

  return {
    content: { library, clients },
    summary: { exportedAt: data.exportedAt, cards, clientIds: clients.map((c) => c.clientId) },
  };
}
