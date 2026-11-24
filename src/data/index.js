import { normalizeClientProfile, normalizeLibrary } from "./normalize.js";
import { buildLibrary } from "./merge.js";
import * as source from "./firestoreSource.js";

const hasContent = (library) =>
  library.preOutliningQuestions.length > 0 ||
  library.storyPrompts.length > 0 ||
  library.beachcombing.tier1.length > 0 ||
  Object.values(library.flashcards).some((cards) => cards.length > 0);

// Everything the app needs to start up for one client.
// A client missing watch-outs or scenarios of their own gets the "default" profile's.
export async function loadStudyData(clientId) {
  const [rawLibrary, rawOwn] = await Promise.all([
    source.fetchSharedLibrary(),
    clientId === "default" ? null : source.fetchClientProfile(clientId),
  ]);

  const own = rawOwn ? normalizeClientProfile(rawOwn, clientId) : null;
  const needsDefault = !own || own.watchOuts.length === 0 || own.scenarios.length === 0;
  const rawDefault = needsDefault ? await source.fetchClientProfile("default") : null;

  const sharedLibrary = normalizeLibrary(rawLibrary);
  const base = normalizeClientProfile(rawDefault ?? {}, clientId);

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
    contentEmpty: !hasContent(sharedLibrary),
    sourceLabel: own ? `${source.sourceName}: shared + ${clientId}` : `${source.sourceName}: shared library`,
  };
}
