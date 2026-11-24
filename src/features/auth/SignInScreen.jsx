import { useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import AuthLayout from "./AuthLayout.jsx";
import { CONSENT_LINE } from "./consent.js";

function GoogleLogo() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.5 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 7l7.2 5.6c4.3-4 6.8-9.9 6.8-17.1z" />
      <path fill="#FBBC05" d="M10.5 28.7c-.5-1.4-.8-2.9-.8-4.7s.3-3.3.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.2-5.6c-2 1.4-4.6 2.3-8.7 2.3-6.3 0-11.6-4-13.5-9.7l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
    </svg>
  );
}

export default function SignInScreen() {
  const { signIn, signInError } = useAuth();
  const [busy, setBusy] = useState(false);

  const handleSignIn = async () => {
    setBusy(true);
    await signIn();
    setBusy(false);
  };

  return (
    <AuthLayout>
      <div className="space-y-1.5">
        <h1 className="font-serif text-xl font-semibold text-charcoal-900">Sign in</h1>
        <p className="text-sm text-charcoal-600 leading-relaxed">
          Access is by invitation. Use the Google account your facilitator invited.
        </p>
      </div>

      <button
        type="button"
        onClick={handleSignIn}
        disabled={busy}
        className="w-full px-4 py-3 rounded-xl bg-white hover:bg-alabaster-50 border border-alabaster-300 text-sm font-medium text-charcoal-900 flex items-center justify-center gap-2.5 transition-colors disabled:opacity-60"
      >
        <GoogleLogo /> {busy ? "Waiting for Google…" : "Sign in with Google"}
      </button>

      {signInError && <p className="text-xs text-crimson-700 leading-relaxed">{signInError}</p>}

      <p className="pt-4 border-t border-alabaster-200 text-[11px] text-charcoal-400 leading-relaxed">{CONSENT_LINE}</p>
    </AuthLayout>
  );
}
