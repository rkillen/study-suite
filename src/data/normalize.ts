import type { BeachTier, ClientProfile, FlashcardCategory, Library, RawClientProfile, RawLibrary } from "../types.ts";

export const BEACH_TIERS: BeachTier[] = ["tier1", "tier2", "tier3"];
export const FLASHCARD_CATEGORIES: FlashcardCategory[] = ["oxford", "phrasal", "idioms", "interview"];

const list = <T>(value: T[] | undefined | null): T[] => (Array.isArray(value) ? value : []);

// Content from the starter files or the database can be incomplete. This fills the gaps with empty lists.
export function normalizeLibrary(raw: RawLibrary = {}): Library {
  return {
    beachcombing: {
      tier1: list(raw.beachcombing?.tier1),
      tier2: list(raw.beachcombing?.tier2),
      tier3: list(raw.beachcombing?.tier3),
    },
    preOutliningQuestions: list(raw.preOutliningQuestions),
    storyPrompts: list(raw.storyPrompts),
    flashcards: {
      oxford: list(raw.flashcards?.oxford),
      phrasal: list(raw.flashcards?.phrasal),
      idioms: list(raw.flashcards?.idioms),
      interview: list(raw.flashcards?.interview),
    },
  };
}

// Client files written by hand are not always complete. This fills the gaps:
// scenarios saved with "category" are shown as "domain", and every item gets an id.
export function normalizeClientProfile(raw: RawClientProfile = {}, clientId: string): ClientProfile {
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
