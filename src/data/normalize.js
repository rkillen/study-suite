export const BEACH_TIERS = ["tier1", "tier2", "tier3"];
export const FLASHCARD_CATEGORIES = ["oxford", "phrasal", "idioms", "interview"];

const list = (value) => (Array.isArray(value) ? value : []);

export function normalizeLibrary(raw = {}) {
  const beachcombing = {};
  BEACH_TIERS.forEach((tier) => {
    beachcombing[tier] = list(raw.beachcombing?.[tier]);
  });

  const flashcards = {};
  FLASHCARD_CATEGORIES.forEach((category) => {
    flashcards[category] = list(raw.flashcards?.[category]);
  });

  return {
    beachcombing,
    preOutliningQuestions: list(raw.preOutliningQuestions),
    storyPrompts: list(raw.storyPrompts),
    flashcards,
  };
}

// Client files written by hand are not always complete. This fills the gaps:
// scenarios saved with "category" are shown as "domain", and every item gets an id.
export function normalizeClientProfile(raw = {}, clientId) {
  return {
    clientId,
    profileName: raw.profileName || clientId,
    watchOuts: list(raw.watchOuts).map((item, i) => ({
      id: item.id || `wo_${i + 1}`,
      tag: item.tag || "Client Focus",
      title: item.title || "",
      detail: item.detail || "",
    })),
    scenarios: list(raw.scenarios).map((item, i) => ({
      id: item.id || `scn_${i + 1}`,
      domain: item.domain || item.category || "",
      title: item.title || "",
      context: item.context || "",
      prompt: item.prompt || "",
    })),
    beachcombing: {
      tier1: list(raw.beachcombing?.tier1),
      tier2: list(raw.beachcombing?.tier2),
      tier3: list(raw.beachcombing?.tier3),
    },
    customCards: list(raw.customCards).map((card, i) => ({
      id: card.id || `card_${i + 1}`,
      category: card.category || "custom",
      term: card.term || "",
      definition: card.definition || "",
      example: card.example || "",
      note: card.note || "",
    })),
  };
}
