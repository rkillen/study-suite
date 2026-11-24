import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut, type User } from "firebase/auth";
import { auth, isConfigured } from "../firebase/app.ts";
import { resolveAccess } from "../firebase/access.ts";
import type { UserProfile } from "../types.ts";

// status is one of:
//   "unconfigured"  the .env file is missing
//   "loading"       checking who is signed in
//   "signedOut"     show the sign-in screen
//   "denied"        signed in with Google, but not invited (or access ended)
//   "error"         could not check (for example, no internet)
//   "ready"         signed in and allowed: the app can open
type AuthState =
  | { status: "unconfigured" }
  | { status: "loading" }
  | { status: "signedOut" }
  | { status: "denied"; reason: "not-invited" | "revoked"; email: string }
  | { status: "error"; message: string }
  | { status: "ready"; user: User; profile: UserProfile };

interface AuthActions {
  /** A message for the sign-in screen when signing in did not work. */
  signInError: string;
  /** Looks again at whether this person may still use the app, for example after a permission error. */
  recheckAccess: () => Promise<void>;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

export type AuthValue = AuthState & { isAdmin: boolean } & AuthActions;

/** What screens inside the app get: someone is signed in and allowed. */
export interface SignedIn extends AuthActions {
  user: User;
  profile: UserProfile;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthValue | null>(null);

/** The raw situation: use this on the screens shown before the app opens. */
export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside <AuthProvider>");
  return value;
}

/** For everything inside the app. Throws if nobody is signed in, which cannot happen behind AuthGate. */
export function useSignedIn(): SignedIn {
  const auth = useAuth();
  if (auth.status !== "ready") throw new Error("useSignedIn was used before sign-in finished");
  return auth;
}

const QUIET_ERRORS = ["auth/popup-closed-by-user", "auth/cancelled-popup-request", "auth/user-cancelled"];

function describeSignInError(error: { code?: string }): string {
  switch (error.code) {
    case "auth/popup-blocked":
      return "Your browser blocked the sign-in window. Allow pop-ups for this site, then try again.";
    case "auth/network-request-failed":
      return "No connection. Check your internet and try again.";
    case "auth/unauthorized-domain":
      return "This web address is not approved for sign-in yet. The site owner needs to add it in the Firebase console.";
    case "auth/admin-restricted-operation":
      return "New sign-ins are switched off in Firebase. The site owner needs to turn on \"Enable create (sign-up)\" under Authentication > Settings > User actions (see docs/SETUP-FIREBASE.md).";
    case "auth/operation-not-allowed":
      return "Google sign-in is not switched on in Firebase. The site owner needs to enable the Google provider (see docs/SETUP-FIREBASE.md).";
    default:
      return `Sign-in did not work (${error.code || "unknown error"}). Please try again.`;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: isConfigured ? "loading" : "unconfigured" });
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
          setState({ status: "denied", reason: result.reason, email: user.email ?? "" });
          await firebaseSignOut(auth);
        }
      } catch (error) {
        if (check !== latestCheck.current) return;
        console.error("Could not check access:", error);
        setState({ status: "error", message: error instanceof Error ? error.message : String(error) });
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
      const code = (error as { code?: string }).code;
      if (code && QUIET_ERRORS.includes(code)) return;
      setSignInError(describeSignInError({ code }));
    }
  }, []);

  const signOut = useCallback(() => firebaseSignOut(auth), []);

  // If an admin switches someone off while they are using the app, their requests start to fail. This is
  // called then. It leaves the screen alone unless access really has ended, so it is safe to call often.
  const rechecking = useRef(false);
  const recheckAccess = useCallback(async () => {
    const user = auth.currentUser;
    if (!user || rechecking.current) return;
    rechecking.current = true;
    try {
      const result = await resolveAccess(user);
      if (!result.ok) {
        setState({ status: "denied", reason: result.reason, email: user.email ?? "" });
        await firebaseSignOut(auth);
      }
    } catch (error) {
      console.error("Could not re-check access:", error);
    } finally {
      rechecking.current = false;
    }
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      ...state,
      isAdmin: state.status === "ready" && state.profile.role === "admin",
      signInError,
      recheckAccess,
      signIn,
      signOut,
    }),
    [state, signInError, recheckAccess, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
