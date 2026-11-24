import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { loadStudyData } from "../data/index.js";
import { useAuth } from "./AuthContext.jsx";
import { useToast } from "./ToastContext.jsx";
import { usePrefs } from "../data/usePrefs.js";
import { useProgress } from "../data/useProgress.js";

const StudyContext = createContext(null);

export const useStudy = () => useContext(StudyContext);

const cleanId = (raw) => (raw || "").replace(/[^a-zA-Z0-9_-]/g, "");

// A person sees the client their account was invited for. Admins can look at any
// client by adding "?client=<id>" to the address (a preview; the real switcher comes later).
function resolveClientId(profile, isAdmin) {
  const requested = isAdmin ? cleanId(new URLSearchParams(window.location.search).get("client")) : "";
  return requested || cleanId(profile.clientId) || "default";
}

export function StudyProvider({ children }) {
  const { profile, isAdmin } = useAuth();
  const clientId = useMemo(() => resolveClientId(profile, isAdmin), [profile, isAdmin]);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [version, setVersion] = useState(0);

  // Loads the content for this client. Bumping "version" (see reloadContent) loads it again,
  // keeping the old content on screen until the new content arrives.
  useEffect(() => {
    let cancelled = false;
    loadStudyData(clientId)
      .then((loaded) => !cancelled && setData(loaded))
      .catch((e) => !cancelled && setError(e));
    return () => {
      cancelled = true;
    };
  }, [clientId, version]);

  const reloadContent = useCallback(() => setVersion((v) => v + 1), []);

  if (error) {
    return <div className="p-10 text-sm text-crimson-700">Could not load Study Suite: {String(error.message || error)}</div>;
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

function StudyReady({ clientId, data, reloadContent, children }) {
  const { library, clientProfile, sourceLabel, contentEmpty } = data;
  const { user } = useAuth();
  const { showToast } = useToast();
  const [prefs, updatePrefs] = usePrefs(clientId);

  const handleError = useCallback(
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

  const goToTab = useCallback((tabId) => updatePrefs({ activeTab: tabId }), [updatePrefs]);

  const value = useMemo(
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
