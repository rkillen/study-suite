import { Suspense, useEffect } from "react";
import Header from "./components/Header.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import { CONSENT_LINE } from "./features/auth/consent.js";
import { useStudy } from "./context/StudyContext.jsx";
import { stopCapture } from "./lib/speech.js";
import { visibleTabs } from "./tabs.js";

export default function App() {
  const { prefs, contentEmpty, goToTab } = useStudy();
  const { isAdmin } = useAuth();
  const tabs = visibleTabs(isAdmin);
  const activeTab = tabs.some((tab) => tab.id === prefs.activeTab) ? prefs.activeTab : tabs[0].id;

  useEffect(() => {
    stopCapture();
  }, [activeTab]);

  return (
    <div className="min-h-screen flex flex-col selection:bg-crimson-700/15 selection:text-crimson-800">
      <Header activeTab={activeTab} />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-7 sm:py-9">
        {contentEmpty && !isAdmin ? (
          <div className="studio-card rounded-2xl p-8 max-w-xl mx-auto text-center space-y-2">
            <h1 className="font-serif text-xl font-semibold text-charcoal-900">Nothing to practise yet</h1>
            <p className="text-sm text-charcoal-600 leading-relaxed">
              Your facilitator is still setting up the content. Please check back soon.
            </p>
          </div>
        ) : (
          <>
            {contentEmpty && (
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-crimson-50 border border-crimson-700/20">
                <p className="text-sm text-crimson-700">There is no content in Firebase yet, so people see an empty app.</p>
                <button
                  type="button"
                  onClick={() => goToTab("admin")}
                  className="px-4 py-2 rounded-xl bg-crimson-700 hover:bg-crimson-800 text-white text-xs font-medium transition-colors"
                >
                  Open Admin to import the starter data
                </button>
              </div>
            )}
            {/* Every tab stays loaded and is only hidden, so drafts and timers survive tab switches. */}
            {tabs.map(({ id, Component }) => (
              <div key={id} className={id === activeTab ? "" : "hidden"}>
                <Suspense fallback={<p className="text-sm font-mono text-charcoal-400">Loading…</p>}>
                  <Component />
                </Suspense>
              </div>
            ))}
          </>
        )}
      </main>
      <footer className="border-t border-alabaster-200 py-4 text-center text-[11px] text-charcoal-400">{CONSENT_LINE}</footer>
    </div>
  );
}
