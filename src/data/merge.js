import { BEACH_TIERS } from "./normalize.js";

// A client's own Beachcombing words come first, followed by the shared words
// they don't already have.
export function buildLibrary(sharedLibrary, clientProfile) {
  const beachcombing = {};
  BEACH_TIERS.forEach((tier) => {
    const own = clientProfile.beachcombing[tier];
    const shared = sharedLibrary.beachcombing[tier];
    const ownSet = new Set(own);
    beachcombing[tier] = own.length ? [...own, ...shared.filter((word) => !ownSet.has(word))] : shared;
  });
  return { ...sharedLibrary, beachcombing };
}
