import type { ReactNode } from "react";

// The frame around every pre-login screen: logo, name, and a centred card.
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 selection:bg-crimson-700/15 selection:text-crimson-800">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-2xl bg-charcoal-800 text-gold-300 flex items-center justify-center border border-gold-500/30">
            <svg className="w-6 h-6" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M20 6 C26 12, 26 22, 20 28 C14 22, 14 12, 20 6 Z" />
              <path d="M9 28 C12 20, 21 16, 29 19 C26 27, 17 31, 9 28 Z" />
              <path d="M31 28 C23 31, 14 27, 11 19 C19 16, 28 20, 31 28 Z" />
            </svg>
          </div>
          <div>
            <div className="font-serif text-3xl font-semibold tracking-tight text-charcoal-900">Study Suite</div>
            <p className="text-xs text-charcoal-400 mt-1">Executive Communication, Associative Recall &amp; Storycraft</p>
          </div>
        </div>

        <div className="studio-card rounded-2xl p-7 space-y-5 border-t-4 border-t-crimson-700">{children}</div>
      </div>
    </div>
  );
}
