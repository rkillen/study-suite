// The shapes of the data in Study Suite. This file is the quickest way to see what the app stores;
// docs/DATA-MODEL.md explains where each of these lives in the database.

// ---------------------------------------------------------------- shared content

export type BeachTier = "tier1" | "tier2" | "tier3";
export type BeachWords = Record<BeachTier, string[]>;

/** The four shared flashcard decks. */
export type FlashcardCategory = "oxford" | "phrasal" | "idioms" | "interview";

/** A deck as people see it: the four shared ones, plus "custom" (their own "Personal Focus" cards). */
export type DeckCategory = FlashcardCategory | "custom";

export interface Flashcard {
  /** Cards are remembered by id in people's progress, so an id must never change or be reused. */
  id: string;
  term: string;
  definition: string;
  example?: string;
  note?: string;
}

/** A client's personal card. Same as a Flashcard, with every field filled in. */
export interface CustomCard extends Flashcard {
  category: string;
  example: string;
  note: string;
}

/** What every client shares. */
export interface Library {
  beachcombing: BeachWords;
  preOutliningQuestions: string[];
  storyPrompts: string[];
  flashcards: Record<FlashcardCategory, Flashcard[]>;
}

// ---------------------------------------------------------------- clients

export interface WatchOut {
  id: string;
  tag: string;
  title: string;
  detail: string;
}

export interface Scenario {
  id: string;
  /** The small label above the title (in the old files this was called "category"). */
  domain: string;
  title: string;
  context: string;
  prompt: string;
}

/** One coaching client's content, tidied and complete (see normalize.ts). */
export interface ClientProfile {
  clientId: string;
  profileName: string;
  watchOuts: WatchOut[];
  scenarios: Scenario[];
  /** The client's own extra Beachcombing words, shown before the shared ones. */
  beachcombing: BeachWords;
  customCards: CustomCard[];
}

/** A client in a list: just enough to show and pick one. */
export interface ClientSummary {
  id: string;
  profileName: string;
}

// ---------------------------------------------------------------- content as it arrives
// The starter files and the database can be incomplete or older-style. normalize.ts turns these
// into the complete shapes above.

export interface RawLibrary {
  beachcombing?: Partial<BeachWords>;
  preOutliningQuestions?: string[];
  storyPrompts?: string[];
  flashcards?: Partial<Record<FlashcardCategory, Flashcard[]>>;
}

export interface RawClientProfile {
  clientId?: string;
  profileName?: string;
  watchOuts?: Partial<WatchOut>[];
  scenarios?: (Partial<Scenario> & { category?: string })[];
  beachcombing?: Partial<BeachWords>;
  customCards?: Partial<CustomCard>[];
}

// ---------------------------------------------------------------- people and their work

/** "revoked" means access was switched off. */
export type Role = "user" | "admin" | "revoked";

/** The signed-in person, as the app needs to know them. */
export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  role: Role;
  clientId: string;
}

export interface Story {
  id: string;
  title: string;
  prompt: string;
  body: string;
  /** Dates are stored as text such as 2026-11-24T10:41:46.256Z. */
  createdAt: string;
  updatedAt?: string;
}

export interface Jot {
  id: string;
  word: string;
  text: string;
  date: string;
}

/** A person's own work, as the screens use it. */
export interface Progress {
  jotCount: number;
  stories: Story[];
  masteredIds: string[];
  /** For each deck, the ordered ids of the cards in the current 20-card deck. */
  activeDecks: Partial<Record<DeckCategory, string[]>>;
}

/** What is stored in users/<uid>. See docs/DATA-MODEL.md. */
export interface UserDoc {
  email: string;
  displayName: string;
  role: Role;
  clientId: string;
  /** Firebase timestamps. They are only ever read as dates (toDate) by the admin screens. */
  createdAt?: unknown;
  lastActiveAt?: unknown;
  storyCount?: number;
  jotCount?: number;
  masteredCount?: number;
}

/** What is stored in invites/<email>. */
export interface InviteDoc {
  role: Role;
  clientId: string;
  invitedBy?: string;
  createdAt?: unknown;
}
