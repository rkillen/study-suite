import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";

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

export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;

if (app && usingEmulators) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099");
  connectFirestoreEmulator(db, "127.0.0.1", 8181);
}
