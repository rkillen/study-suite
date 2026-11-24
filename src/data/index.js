import { normalizeClientProfile, normalizeLibrary } from "./normalize.js";
import { buildLibrary } from "./merge.js";
import * as source from "./seedSource.js";

// Everything the app needs to start up for one client.
// A client with no file of their own gets the "default" profile.
export async function loadStudyData(clientId) {
  const [rawLibrary, rawDefault, rawOwn] = await Promise.all([
    source.fetchSharedLibrary(),
    source.fetchClientProfile("default"),
    clientId === "default" ? null : source.fetchClientProfile(clientId),
  ]);

  const sharedLibrary = normalizeLibrary(rawLibrary);
  const base = normalizeClientProfile(rawDefault ?? {}, clientId);
  const own = rawOwn ? normalizeClientProfile(rawOwn, clientId) : null;

  const clientProfile = own
    ? {
        ...base,
        profileName: own.profileName,
        watchOuts: own.watchOuts.length ? own.watchOuts : base.watchOuts,
        scenarios: own.scenarios.length ? own.scenarios : base.scenarios,
        beachcombing: own.beachcombing,
        customCards: own.customCards,
      }
    : base;

  return {
    library: buildLibrary(sharedLibrary, clientProfile),
    clientProfile,
    sourceLabel: own ? `${source.sourceName}: shared + ${clientId}` : `${source.sourceName}: shared library`,
  };
}
