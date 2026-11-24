import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut } from "firebase/auth";
import { auth, isConfigured } from "../firebase/app.js";
import { resolveAccess } from "../firebase/access.js";

// status is one of:
//   "unconfigured"  the .env file is missing
//   "loading"       checking who is signed in
//   "signedOut"     show the sign-in screen
//   "denied"        signed in with Google, but not invited (or access ended)
//   "error"         could not check (for example, no internet)
//   "ready"         signed in and allowed: the app can open
const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

const QUIET_ERRORS = ["auth/popup-closed-by-user", "auth/cancelled-popup-request", "auth/user-cancelled"];

function describeSignInError(error) {
  switch (error.code) {
    case "auth/popup-blocked":
      return "Your browser blocked the sign-in window. Allow pop-ups for this site, then try again.";
    case "auth/network-request-failed":
      return "No connection. Check your internet and try again.";
    case "auth/unauthorized-domain":
      return "This web address is not approved for sign-in yet. The site owner needs to add it in the Firebase console.";
    default:
      return `Sign-in did not work (${error.code || "unknown error"}). Please try again.`;
  }
}

export function AuthProvider({ children }) {
  const [state, setState] = useState({ status: isConfigured ? "loading" : "unconfigured" });
  const [signInError, setSignInError] = useState("");
  const latestCheck = useRef(0);

  useEffect(() => {
    if (!isConfigured) return undefined;

    return onAuthStateChanged(auth, async (user) => {
      const check = ++latestCheck.current;

      if (!user) {
        // keep the "not invited" message on screen after we sign that person out
        setState((s) => (s.status === "denied" ? s : { status: "signedOut" }));
        return;
      }

      setState({ status: "loading" });
      try {
        const result = await resolveAccess(user);
        if (check !== latestCheck.current) return;

        if (result.ok) {
          setState({ status: "ready", user, profile: result.profile });
        } else {
          setState({ status: "denied", reason: result.reason, email: user.email });
          await firebaseSignOut(auth);
        }
      } catch (error) {
        if (check !== latestCheck.current) return;
        console.error("Could not check access:", error);
        setState({ status: "error", message: error.message || String(error) });
      }
    });
  }, []);

  const signIn = useCallback(async () => {
    setSignInError("");
    setState((s) => (s.status === "denied" ? { status: "signedOut" } : s));
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(auth, provider);
    } catch (error) {
      if (QUIET_ERRORS.includes(error.code)) return;
      setSignInError(describeSignInError(error));
    }
  }, []);

  const signOut = useCallback(() => firebaseSignOut(auth), []);

  const value = useMemo(
    () => ({
      ...state,
      isAdmin: state.status === "ready" && state.profile.role === "admin",
      signInError,
      signIn,
      signOut,
    }),
    [state, signInError, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
