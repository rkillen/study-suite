/// <reference types="vite/client" />

// The settings read from the ".env" file (see .env.example). They are all optional here because the
// app shows a setup message when they are missing.
interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET?: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
  readonly VITE_FIREBASE_APP_ID?: string;
  readonly VITE_USE_EMULATORS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
