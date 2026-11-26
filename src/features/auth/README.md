# Sign-in screens (`src/features/auth/`)

Everything a person sees before the app opens.

| File | What it is |
|---|---|
| `AuthGate.tsx` | Wraps the whole app and shows the right screen for the current situation. |
| `SignInScreen.tsx` | "Sign in with Google", plus the consent line. |
| `NoAccessScreen.tsx` | "This account has not been invited" or "Access has ended". |
| `MessageScreen.tsx` | A plain card used for "Firebase is not set up yet" and "Could not check your access". |
| `AuthLayout.tsx` | The logo and centred card around all of the above. |
| `consent.ts` | The sentence "Your facilitator can read your stories and progress." It is shown on the sign-in screen and at the bottom of every page. Change it in this one place. |

The logic (who is signed in, whether they are allowed) lives in `src/context/AuthContext.tsx` and
`src/firebase/access.ts`, not here. These files only draw screens.

If you ever change who can read what in `firestore.rules`, update the sentence in `consent.ts` so it
stays true.
