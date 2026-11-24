// Reads the starter data in the /seed folder. Used while the app is being built;
// the Firebase version replaces this file.
const sharedFiles = import.meta.glob("../../seed/shared-library.json", { eager: true, import: "default" });
const clientFiles = import.meta.glob("../../seed/clients/*.json", { import: "default" });

export const sourceName = "Seed files";

export async function fetchSharedLibrary() {
  return Object.values(sharedFiles)[0] ?? {};
}

export async function fetchClientProfile(clientId) {
  const load = clientFiles[`../../seed/clients/${clientId}.json`];
  return load ? load() : null;
}
