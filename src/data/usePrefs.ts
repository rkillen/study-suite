import type { DeckCategory } from "../types.ts";
import { useStoredState, type Updater } from "./useStoredState.ts";

export type Accent = "en-US" | "en-GB";

/** Beachcombing tier 1, 2 or 3. */
export type TierNumber = 1 | 2 | 3;

// Screen settings and "where was I" positions. These stay in this browser.
export interface Prefs {
  activeTab: string;
  accent: Accent;
  beachTier: TierNumber;
  beachIndex: number;
  outlineDuration: number;
  outlineQuestionIndex: number;
  storyPromptIndex: number;
  activeCardCat: DeckCategory;
  currentCardPos: number;
}

const DEFAULT_PREFS: Prefs = {
  activeTab: "overview",
  accent: "en-US",
  beachTier: 1,
  beachIndex: 0,
  outlineDuration: 30,
  outlineQuestionIndex: 0,
  storyPromptIndex: 0,
  activeCardCat: "oxford",
  currentCardPos: 0,
};

export type PrefsUpdater = Updater<Prefs>;

export function usePrefs(clientId: string) {
  return useStoredState(`studysuite_prefs_${clientId}`, DEFAULT_PREFS);
}
