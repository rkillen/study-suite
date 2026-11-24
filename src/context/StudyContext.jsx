import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { loadStudyData } from "../data/index.js";
import { usePrefs } from "../data/usePrefs.js";
import { useProgress } from "../data/useProgress.js";

const StudyContext = createContext(null);

export const useStudy = () => useContext(StudyContext);

function getRequestedClientId() {
  const raw = new URLSearchParams(window.location.search).get("client") || "default";
  return raw.replace(/[^a-zA-Z0-9_-]/g, "") || "default";
}

export function StudyProvider({ children }) {
  const clientId = useMemo(getRequestedClientId, []);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadStudyData(clientId).then(setData).catch(setError);
  }, [clientId]);

  if (error) {
    return <div className="p-10 text-sm text-crimson-700">Could not load Study Suite: {String(error.message || error)}</div>;
  }
  if (!data) {
    return <div className="p-10 text-sm font-mono text-charcoal-400">Loading Study Suite…</div>;
  }
  return (
    <StudyReady clientId={clientId} data={data}>
      {children}
    </StudyReady>
  );
}

function StudyReady({ clientId, data, children }) {
  const { library, clientProfile, sourceLabel } = data;
  const [prefs, updatePrefs] = usePrefs(clientId);
  const { progress, actions } = useProgress(clientId);

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
      prefs,
      updatePrefs,
      goToTab,
      progress,
      ...actions,
    }),
    [clientId, library, clientProfile, sourceLabel, prefs, updatePrefs, goToTab, progress, actions]
  );

  return <StudyContext.Provider value={value}>{children}</StudyContext.Provider>;
}
