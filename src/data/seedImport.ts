import type { ClientProfile } from "../types.ts";
import { normalizeClientProfile, normalizeLibrary } from "./normalize.ts";
import { replaceContent, type ReplaceResult } from "./replaceContent.ts";
import * as seed from "./seedSource.ts";

// Copies everything in the /seed folder into Firebase: the shared library and every client.
// Safe to run again, but it REPLACES what is stored for those, so edits made in the app are lost.
// Not copied: the "version", "generatedAt" and "specialtyPacks" entries of shared-library.json
// (the app never used them) and radiology's "scenarios-hidden" list. They stay in the files.
export async function importSeed(onProgress: (message: string) => void = () => {}): Promise<ReplaceResult> {
  const library = normalizeLibrary(await seed.fetchSharedLibrary());
  const clients: ClientProfile[] = [];
  for (const clientId of seed.clientIds) {
    clients.push(normalizeClientProfile((await seed.fetchClientProfile(clientId)) ?? {}, clientId));
  }
  return replaceContent({ library, clients }, onProgress);
}
