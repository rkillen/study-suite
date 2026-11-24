import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { loadStudyData, type StudyData } from "../data/index.ts";
import { usePrefs, type Prefs, type PrefsUpdater } from "../data/usePrefs.ts";
import { useProgress, type ProgressActions, type ProgressErrorHandler } from "../data/useProgress.ts";
import type { ClientProfile, Library, Progress } from "../types.ts";
import { useSignedIn } from "./AuthContext.tsx";
import { useToast } from "./ToastContext.tsx";

/** Everything the screens know about the person, their client, the content and their work. */
export interface StudyValue extends ProgressActions {
  clientId: string;
  library: Library;
  clientProfile: ClientProfile;
  sourceLabel: string;
  /** True when Firebase has no shared content at all yet. */
  contentEmpty: boolean;
  /** Loads the content again (after an admin changed it). */
  reloadContent: () => void;
  prefs: Prefs;
  updatePrefs: PrefsUpdater;
  goToTab: (tabId: string) => void;
  progress: Progress;
}

const StudyContext = createContext<StudyValue | null>(null);

export function useStudy(): StudyValue {
  const value = useContext(StudyContext);
  if (!value) throw new Error("useStudy must be used inside <StudyProvider>");
  return value;
}

const cleanId = (raw: string | null): string => (raw || "").replace(/[^a-zA-Z0-9_-]/g, "");

// A person sees the client their account was invited for. Admins can look at any
// client by adding "?client=<id>" to the address (a preview; the real switcher comes later).
function resolveClientId(clientIdOfPerson: string, isAdmin: boolean): string {
  const requested = isAdmin ? cleanId(new URLSearchParams(window.location.search).get("client")) : "";
  return requested || cleanId(clientIdOfPerson) || "default";
}

export function StudyProvider({ children }: { children: ReactNode }) {
  const { profile, isAdmin } = useSignedIn();
  const clientId = useMemo(() => resolveClientId(profile.clientId, isAdmin), [profile.clientId, isAdmin]);
  const [data, setData] = useState<StudyData | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [version, setVersion] = useState(0);

  // Loads the content for this client. Bumping "version" (see reloadContent) loads it again,
  // keeping the old content on screen until the new content arrives.
  useEffect(() => {
    let cancelled = false;
    loadStudyData(clientId)
      .then((loaded) => !cancelled && setData(loaded))
      .catch((e: unknown) => !cancelled && setError(e));
    return () => {
      cancelled = true;
    };
  }, [clientId, version]);

  // Called after content is changed (for example by an admin). Waits a moment first, so a burst of
  // edits causes one reload instead of one per click.
  const reloadTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const reloadContent = useCallback(() => {
    clearTimeout(reloadTimer.current);
    reloadTimer.current = setTimeout(() => setVersion((v) => v + 1), 1000);
  }, []);
  useEffect(() => () => clearTimeout(reloadTimer.current), []);

  if (error) {
    return <div className="p-10 text-sm text-crimson-700">Could not load Study Suite: {error instanceof Error ? error.message : String(error)}</div>;
  }
  if (!data) {
    return <div className="p-10 text-sm font-mono text-charcoal-400">Loading Study Suite…</div>;
  }
  return (
    <StudyReady clientId={clientId} data={data} reloadContent={reloadContent}>
      {children}
    </StudyReady>
  );
}

function StudyReady({ clientId, data, reloadContent, children }: { clientId: string; data: StudyData; reloadContent: () => void; children: ReactNode }) {
  const { library, clientProfile, sourceLabel, contentEmpty } = data;
  const { user } = useSignedIn();
  const { showToast } = useToast();
  const [prefs, updatePrefs] = usePrefs(clientId);

  const handleError = useCallback<ProgressErrorHandler>(
    (error, kind) => {
      console.error(`Could not ${kind}:`, error);
      showToast(
        kind === "save"
          ? "Could not save your last change. Check your connection and try again."
          : "Could not load your progress. Please reload the page."
      );
    },
    [showToast]
  );
  const { progress, ready, actions } = useProgress(user.uid, handleError);

  // Clients who have personal cards always start on that deck (runs once, on open).
  const hasCustomCards = clientProfile.customCards.length > 0;
  useEffect(() => {
    updatePrefs((p) => ({ activeCardCat: hasCustomCards ? "custom" : p.activeCardCat, currentCardPos: 0 }));
  }, [hasCustomCards, updatePrefs]);

  const goToTab = useCallback((tabId: string) => updatePrefs({ activeTab: tabId }), [updatePrefs]);

  const value = useMemo<StudyValue>(
    () => ({
      clientId,
      library,
      clientProfile,
      sourceLabel,
      contentEmpty,
      reloadContent,
      prefs,
      updatePrefs,
      goToTab,
      progress,
      ...actions,
    }),
    [clientId, library, clientProfile, sourceLabel, contentEmpty, reloadContent, prefs, updatePrefs, goToTab, progress, actions]
  );

  if (!ready) {
    return <div className="p-10 text-sm font-mono text-charcoal-400">Loading your progress…</div>;
  }
  return <StudyContext.Provider value={value}>{children}</StudyContext.Provider>;
}
