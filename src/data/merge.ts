import type { BeachWords, ClientProfile, Library } from "../types.ts";
import { BEACH_TIERS } from "./normalize.ts";

// A client's own Beachcombing words come first, followed by the shared words
// they don't already have.
export function buildLibrary(sharedLibrary: Library, clientProfile: ClientProfile): Library {
  const beachcombing = { ...sharedLibrary.beachcombing } as BeachWords;
  BEACH_TIERS.forEach((tier) => {
    const own = clientProfile.beachcombing[tier];
    const shared = sharedLibrary.beachcombing[tier];
    const ownSet = new Set(own);
    beachcombing[tier] = own.length ? [...own, ...shared.filter((word) => !ownSet.has(word))] : shared;
  });
  return { ...sharedLibrary, beachcombing };
}
