import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore, type Firestore } from "firebase/firestore";

const env = import.meta.env;

const config = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

// False when the ".env" file is missing, so the app can show a setup message instead of crashing.
export const isConfigured = Boolean(config.apiKey && config.projectId && config.appId);

// True with "npm run dev:emulator": talk to a fake Firebase on this computer, never the real one.
export const usingEmulators = env.VITE_USE_EMULATORS === "true";

const app = isConfigured ? initializeApp(config) : null;

// These are only null when the app is not configured, and then nothing that uses them ever runs:
// AuthGate shows the setup message instead of the app. So the rest of the code can treat them as always there.
export const auth = (app ? getAuth(app) : null) as Auth;
export const db = (app ? getFirestore(app) : null) as Firestore;

if (app && usingEmulators) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099");
  connectFirestoreEmulator(db, "127.0.0.1", 8181);
}
