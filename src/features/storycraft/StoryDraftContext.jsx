import { createContext, useCallback, useContext, useMemo, useState } from "react";

// The story being written. It lives here (not inside the Storycraft screen)
// so other screens, like Beachcombing, can hand a memory over to it.
const EMPTY_DRAFT = { editingId: "", title: "", body: "", promptOverride: null };

const StoryDraftContext = createContext(null);

export const useStoryDraft = () => useContext(StoryDraftContext);

export function StoryDraftProvider({ children }) {
  const [draft, setDraft] = useState(EMPTY_DRAFT);

  const patchDraft = useCallback((patch) => setDraft((d) => ({ ...d, ...patch })), []);
  const clearDraft = useCallback(() => setDraft((d) => ({ ...EMPTY_DRAFT, promptOverride: d.promptOverride })), []);

  const value = useMemo(() => ({ draft, patchDraft, clearDraft }), [draft, patchDraft, clearDraft]);

  return <StoryDraftContext.Provider value={value}>{children}</StoryDraftContext.Provider>;
}
