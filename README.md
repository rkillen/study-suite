# Study Suite

A practice studio for executive communication: Beachcombing (memory prompts), Pre-Outlining (timed
structure), Storycraft (story log), Speaking Arena (rehearse aloud), and a rolling 20-card Flashcard deck.
Each coaching client sees their own focus points, scenarios and personal cards.

> **Status: being rebuilt.** The page used to be a single `index.html` with data in JSON files. It is now a
> React app that will use Firebase (Google sign-in and a database) instead of files.
> Done so far: the app itself runs, reading the starter data in `seed/`. Still to come: Google sign-in,
> the Firebase database, and the admin area. See "Roadmap" below.

## Run it on your computer

You need [Node.js](https://nodejs.org) version 20.19 or newer (the "LTS" download is fine).

```
npm install      # once, downloads the building blocks
npm run dev      # starts the app
```

Then open <http://localhost:5173/?client=morocco>. Change `morocco` to any file name in
`seed/clients/` to see another client. A name with no file shows the generic `default` profile.
(`?client=` is temporary. Once sign-in exists, each person's client is decided by their account.)

Other commands:

```
npm run build    # makes the finished site in the "dist" folder
npm run preview  # shows that finished site locally
```

## What is where

| Folder / file | What it is |
|---|---|
| `src/` | The app. Start with `src/README.md`. |
| `seed/` | The starter content (flashcards, prompts, client profiles). See `seed/README.md`. |
| `src/index.css` | Colours and fonts. Change a colour here and it changes everywhere. |
| `src/tabs.js` | The list of tabs. Add or reorder tabs here. |
| `.env.example` | Template for the Firebase settings. Copy it to `.env` and fill it in. |
| `index.html` | The single page the app loads into. You rarely need to touch it. |

## Roadmap

1. ~~Scaffold (Vite, React, Tailwind)~~
2. ~~Port every screen, using the starter data~~
3. Firebase and Google sign-in (invite-only)
4. Content and progress stored in Firebase instead of files and the browser
5. Admin area: edit clients, cards, prompts; import CSVs
6. People and progress: invite clients, read their stories and progress
7. Full guides for setup, admins and developers; deployment
