# Study Suite

A practice studio for executive communication: Beachcombing (memory prompts), Pre-Outlining (timed
structure), Storycraft (story log), Speaking Arena (rehearse aloud), and a rolling 20-card Flashcard deck.
Each coaching client sees their own focus points, scenarios and personal cards.

> **Status: being rebuilt.** The page used to be a single `index.html` with data in JSON files. It is now a
> React app that uses Firebase (Google sign-in and a database) instead of files.
> Done so far: the app itself, Google sign-in with an invitation list, the security rules, and storing
> content and each person's progress in Firebase. Still to come: the screens for admins to edit content
> and manage people. See "Roadmap" below.

## Run it on your computer

You need [Node.js](https://nodejs.org) version 20.19 or newer (the "LTS" download is fine), and the
Firebase project connected. **Follow `docs/SETUP-FIREBASE.md` first**: it connects the app to Firebase,
publishes the security rules, and invites the first admin.

```
npm install      # once, downloads the building blocks
npm run dev      # starts the app at http://localhost:5173
```

Only people on the invitation list can sign in (with Google). Each person sees the client they were
invited for. The very first time, an admin opens the **Admin** tab and clicks **Import starter data** to
fill the database from `seed/`. Admins can preview any client by adding `?client=morocco` to the address (use any file
name from `seed/clients/`).

Other commands:

```
npm run build          # makes the finished site in the "dist" folder
npm run preview        # shows that finished site locally
npm run emulators      # a pretend Firebase on your computer, for safe testing (needs Java)
npm run dev:emulator   # the app, connected to the pretend Firebase
npm run test:rules     # checks the security rules (needs Java)
npm run deploy:rules   # publishes the security rules to Firebase
npm run deploy         # builds the site and publishes everything to Firebase
```

## What is where

| Folder / file | What it is |
|---|---|
| `src/` | The app. Start with `src/README.md`. |
| `seed/` | The starter content (flashcards, prompts, client profiles), copied into Firebase once. See `seed/README.md`. |
| `src/index.css` | Colours and fonts. Change a colour here and it changes everywhere. |
| `src/tabs.js` | The list of tabs. Add or reorder tabs here. |
| `docs/` | Guides. Start with `docs/SETUP-FIREBASE.md`; `docs/DATA-MODEL.md` explains what is stored where. |
| `firestore.rules` | **Who may read and write what.** The most important file for privacy. Test it with `npm run test:rules`. |
| `rules-tests/` | Automatic checks for `firestore.rules`. |
| `firebase.json`, `.firebaserc` | Tell Firebase what to publish and to which project. |
| `.env.example` | Template for the Firebase settings. Copy it to `.env` and fill it in. |
| `index.html` | The single page the app loads into. You rarely need to touch it. |

## Roadmap

1. ~~Scaffold (Vite, React, Tailwind)~~
2. ~~Port every screen, using the starter data~~
3. ~~Firebase and Google sign-in (invite-only), with tested security rules~~
4. ~~Content and progress stored in Firebase instead of files and the browser~~
5. Admin area: edit clients, cards, prompts; import CSVs
6. People and progress: invite clients, read their stories and progress
7. Full guides for setup, admins and developers; deployment
