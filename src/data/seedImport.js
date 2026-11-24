import { replaceContent } from "./replaceContent.js";
import { normalizeClientProfile, normalizeLibrary } from "./normalize.js";
import * as seed from "./seedSource.js";

// Copies everything in the /seed folder into Firebase: the shared library and every client.
// Safe to run again, but it REPLACES what is stored for those, so edits made in the app are lost.
// Not copied: the "version", "generatedAt" and "specialtyPacks" entries of shared-library.json
// (the app never used them) and radiology's "scenarios-hidden" list. They stay in the files.
export async function importSeed(onProgress = () => {}) {
  const library = normalizeLibrary(await seed.fetchSharedLibrary());
  const clients = [];
  for (const clientId of seed.clientIds) {
    clients.push(normalizeClientProfile(await seed.fetchClientProfile(clientId), clientId));
  }
  return replaceContent({ library, clients }, onProgress);
}
