// Reads the starter files in the /seed folder. Only the admin "Import starter data" button uses
// this (through seedImport.js); the app itself reads everything from Firebase.
// The files are loaded on demand, so regular users never download them.
const sharedFiles = import.meta.glob("../../seed/shared-library.json", { import: "default" });
const clientFiles = import.meta.glob("../../seed/clients/*.json", { import: "default" });

// The file name is the client's id: "morocco.json" is the client "morocco".
export const clientIds = Object.keys(clientFiles).map((path) => path.split("/").pop().replace(".json", ""));

export async function fetchSharedLibrary() {
  const load = Object.values(sharedFiles)[0];
  return load ? load() : {};
}

export async function fetchClientProfile(clientId) {
  const load = clientFiles[`../../seed/clients/${clientId}.json`];
  return load ? load() : null;
}
