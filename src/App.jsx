import { useEffect } from "react";
import Header from "./components/Header.jsx";
import { CONSENT_LINE } from "./features/auth/consent.js";
import { useStudy } from "./context/StudyContext.jsx";
import { stopCapture } from "./lib/speech.js";
import { TABS } from "./tabs.js";

export default function App() {
  const { prefs } = useStudy();
  const activeTab = TABS.some((tab) => tab.id === prefs.activeTab) ? prefs.activeTab : TABS[0].id;

  useEffect(() => {
    stopCapture();
  }, [activeTab]);

  return (
    <div className="min-h-screen flex flex-col selection:bg-crimson-700/15 selection:text-crimson-800">
      <Header activeTab={activeTab} />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-7 sm:py-9">
        {/* Every tab stays loaded and is only hidden, so drafts and timers survive tab switches. */}
        {TABS.map(({ id, Component }) => (
          <div key={id} className={id === activeTab ? "" : "hidden"}>
            <Component />
          </div>
        ))}
      </main>
      <footer className="border-t border-alabaster-200 py-4 text-center text-[11px] text-charcoal-400">{CONSENT_LINE}</footer>
    </div>
  );
}
