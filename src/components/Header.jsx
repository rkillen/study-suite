import { LogOut, ShieldCheck, UserCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useStudy } from "../context/StudyContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import TabNav from "./TabNav.jsx";

export default function Header({ activeTab }) {
  const { clientId, sourceLabel, prefs, updatePrefs } = useStudy();
  const { user, isAdmin, signOut } = useAuth();
  const { showToast } = useToast();

  const toggleAccent = () => {
    const accent = prefs.accent === "en-US" ? "en-GB" : "en-US";
    updatePrefs({ accent });
    showToast(`Pronunciation voice set to ${accent}`);
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-alabaster-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-charcoal-800 text-gold-300 flex items-center justify-center shrink-0 border border-gold-500/30">
            <svg className="w-5 h-5" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M20 6 C26 12, 26 22, 20 28 C14 22, 14 12, 20 6 Z" />
              <path d="M9 28 C12 20, 21 16, 29 19 C26 27, 17 31, 9 28 Z" />
              <path d="M31 28 C23 31, 14 27, 11 19 C19 16, 28 20, 31 28 Z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-serif text-xl font-semibold tracking-tight text-charcoal-900 leading-none">Study Suite</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-gold-100 text-gold-600 border border-gold-300/60">v2</span>
            </div>
            <p className="text-[11px] text-charcoal-400 mt-0.5 hidden sm:block">Executive Communication, Associative Recall &amp; Storycraft</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gold-100/70 border border-gold-300/70 text-[11px] font-mono text-gold-600">
            <UserCheck className="w-3 h-3" />
            <span>client: {clientId}</span>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-crimson-50 border border-crimson-700/20 text-[11px] font-mono text-crimson-700">
              <ShieldCheck className="w-3 h-3" />
              <span>admin</span>
            </div>
          )}

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-alabaster-50 border border-alabaster-200 text-[11px] font-mono text-charcoal-600">
            <span className="w-2 h-2 rounded-full bg-crimson-700"></span>
            <span>{sourceLabel}</span>
          </div>

          <button
            type="button"
            onClick={toggleAccent}
            title="Toggle Pronunciation Voice"
            className="px-2.5 py-1.5 rounded-lg bg-alabaster-50 hover:bg-alabaster-100 border border-alabaster-200 text-charcoal-800 text-[11px] font-mono whitespace-nowrap transition-colors"
          >
            {prefs.accent}
          </button>

          <button
            type="button"
            onClick={signOut}
            title={user?.email ? `Signed in as ${user.email}` : "Sign out"}
            className="px-2.5 py-1.5 rounded-lg bg-alabaster-50 hover:bg-alabaster-100 border border-alabaster-200 text-charcoal-800 text-[11px] font-medium whitespace-nowrap transition-colors flex items-center gap-1.5"
          >
            <LogOut className="w-3 h-3" /> Sign out
          </button>
        </div>
      </div>

      <TabNav activeTab={activeTab} />
    </header>
  );
}
