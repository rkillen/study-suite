import { newId } from "../lib/ids.js";

// A client's id is a short name used in the database and in links, such as "morocco".
// It cannot be changed later, so it is made carefully.
export const CLIENT_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;

export const isValidClientId = (id) => CLIENT_ID_PATTERN.test(id) && id.length <= 40;

// "Ana's Morocco trip!" -> "anas-morocco-trip"
export function slugify(name) {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30)
    .replace(/-+$/g, "");
}

// A suggested id that is not in "taken": "ana", then "ana-2", "ana-3"...
export function suggestClientId(name, taken) {
  const base = slugify(name) || "client";
  let id = base;
  for (let n = 2; taken.includes(id); n++) id = `${base}-${n}`;
  return id;
}

// A copy of a client's content for a new client. Every item gets a new id: flashcards are remembered
// by id in people's progress, so two clients must not share them.
export function cloneClientContent(profile) {
  return {
    beachcombing: {
      tier1: [...profile.beachcombing.tier1],
      tier2: [...profile.beachcombing.tier2],
      tier3: [...profile.beachcombing.tier3],
    },
    watchOuts: profile.watchOuts.map((item) => ({ ...item, id: newId("wo") })),
    scenarios: profile.scenarios.map((item) => ({ ...item, id: newId("scn") })),
    customCards: profile.customCards.map((item) => ({ ...item, id: newId("card") })),
  };
}
