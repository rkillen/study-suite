import { useStoredState } from "./useStoredState.js";

// Screen settings and "where was I" positions. These stay in this browser.
const DEFAULT_PREFS = {
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

export function usePrefs(clientId) {
  return useStoredState(`studysuite_prefs_${clientId}`, DEFAULT_PREFS);
}
