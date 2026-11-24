# Firebase connection (`src/firebase/`)

| File | Job |
|---|---|
| `app.js` | Connects to Firebase using the settings in `.env`. Exports `auth` (sign-in) and `db` (the database). Also decides whether to use the pretend Firebase on your computer (the "emulators"). |
| `access.js` | `resolveAccess(user)`: after someone signs in with Google, decides whether they may use the app. |

## How access works

1. The person signs in with Google (`context/AuthContext.jsx`).
2. `resolveAccess` looks for their profile, the document `users/<their id>`.
   - **Found:** they are in, unless their role is `revoked`.
   - **Not found:** it looks for an invitation, the document `invites/<their email in lower case>`.
     - **Invitation found:** their profile is created from it (role and client), and they are in.
     - **No invitation:** refused, and they are signed straight back out.
3. The security rules (`firestore.rules`) check the same things again on the server, so the checks cannot
   be skipped by tampering with the page.

## Where the settings come from

`app.js` reads `VITE_FIREBASE_*` values from the file `.env` (see `.env.example`). With
`npm run dev:emulator` it reads `.env.emulator` instead, which points at the pretend Firebase.

The pretend Firebase listens on these ports (set in `firebase.json`): sign-in `9099`, database `8181`,
control panel `4000`.
