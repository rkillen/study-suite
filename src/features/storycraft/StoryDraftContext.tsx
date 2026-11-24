import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

/** The story being written. */
export interface StoryDraft {
  /** The id of the saved story being edited, or "" for a new one. */
  editingId: string;
  title: string;
  body: string;
  /** A prompt chosen elsewhere (for example from Beachcombing), instead of the random one. null = none. */
  promptOverride: string | null;
}

interface StoryDraftValue {
  draft: StoryDraft;
  patchDraft: (patch: Partial<StoryDraft>) => void;
  clearDraft: () => void;
}

// The story being written. It lives here (not inside the Storycraft screen)
// so other screens, like Beachcombing, can hand a memory over to it.
const EMPTY_DRAFT: StoryDraft = { editingId: "", title: "", body: "", promptOverride: null };

const StoryDraftContext = createContext<StoryDraftValue | null>(null);

export function useStoryDraft(): StoryDraftValue {
  const value = useContext(StoryDraftContext);
  if (!value) throw new Error("useStoryDraft must be used inside <StoryDraftProvider>");
  return value;
}

export function StoryDraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<StoryDraft>(EMPTY_DRAFT);

  const patchDraft = useCallback((patch: Partial<StoryDraft>) => setDraft((d) => ({ ...d, ...patch })), []);
  const clearDraft = useCallback(() => setDraft((d) => ({ ...EMPTY_DRAFT, promptOverride: d.promptOverride })), []);

  const value = useMemo(() => ({ draft, patchDraft, clearDraft }), [draft, patchDraft, clearDraft]);

  return <StoryDraftContext.Provider value={value}>{children}</StoryDraftContext.Provider>;
}
