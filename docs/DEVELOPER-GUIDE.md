# Developer guide

For whoever changes the code. You should be comfortable reading React and TypeScript. You do not need to know
Firebase beforehand; the parts that matter are explained here. If you only run the app, read
`docs/ADMIN-GUIDE.md` instead, and `docs/SETUP-FIREBASE.md` for first-time set-up.

## What this is

A static single-page app that talks straight to Firebase. There is **no server code of our own**.

```
Browser (the React app)
   ├── "Sign in with Google" ───────────────▶ Firebase Authentication
   └── reads and writes, each one checked by
       firestore.rules ─────────────────────▶ Firestore (the database)

Firebase Hosting only serves the files in dist/ (what `npm run build` makes).
```

Because there is no server, **`firestore.rules` is the security**. Anything the page checks (hiding the Admin
tab, refusing a switch-off) is a convenience for honest users; the rules are what stop anyone else. Never rely on
the page alone.

| Piece | Choice |
|---|---|
| App | React 19, TypeScript (strict), Vite, Tailwind 4, `lucide-react` icons |
| Sign-in and data | Firebase Authentication (Google only) and Firestore |
| Hosting | Firebase Hosting, free "Spark" plan, project `study-suite-65822` |
| Live address | <https://study-suite-65822.web.app> |

## Principles

- **Few dependencies.** Runtime: `react`, `react-dom`, `firebase`, `lucide-react`. Everything else is a build or
  type tool. There is deliberately no router (it is one page with tabs), no state library (a few React
  contexts), no linter and no `firebase-admin`. Add a dependency only when the gain is clear, and tell the
  README.
- **Rules first.** Change who may do what in `firestore.rules`, with tests, before changing the screens.
- **Reads are limited.** The free plan allows 50,000 database reads a day. That is why flashcards
  are stored about 200 to a document and why people's profiles carry summary counters (`docs/DATA-MODEL.md`).
- **Readable by non-experts.** Plain comments, a README in each folder, and tests written as sentences.

## Get it running

Follow `docs/SETUP-FIREBASE.md` once (connect `.env`, publish rules, invite yourself). Then:

| Command | What it does |
|---|---|
| `npm install` | Downloads the building blocks (once, and after `package.json` changes). |
| `npm run dev` | The app at <http://localhost:5173>, using the **real** Firebase project. |
| `npm run typecheck` | Checks all the code for mistakes without running it. |
| `npm run build` | Typechecks, then makes the finished site in `dist/`. Stops on any type error. |
| `npm run preview` | Serves `dist/` locally (still the real project). |
| `npm run emulators` | A pretend Firebase on your computer. Needs Java 21+. |
| `npm run dev:emulator` | The app connected to the pretend Firebase (`.env.emulator`). A red bar says so. |
| `npm run test:rules` | The security-rule tests against the emulator. Needs Java 21+. |
| `npm run deploy:rules` | Publishes `firestore.rules` only. |
| `npm run deploy` | Builds, then publishes the site, the rules and the indexes. |

Node 20.19 or newer. Java is only for the emulators and the rule tests.

**Tip:** with `npm run dev` you are working on the real data. For anything that writes (the Admin tab,
invitations, importing), prefer `npm run emulators` plus `npm run dev:emulator`: nothing you break there is real.

## How the code fits together

Start with `src/README.md` for the folder map. The path from opening the page to seeing a tab:

1. `main.tsx` nests the app in this order: toasts, **sign-in** (`AuthProvider`), `AuthGate`, the study data
   (`StudyProvider`), the story draft, and finally `App`.
2. `features/auth/AuthGate.tsx` shows a setup message, the sign-in screen, "no access", or the app. Nothing inside
   it (including the data) loads until `status === "ready"`.
3. `firebase/access.ts` (`resolveAccess`) decides who gets in: an existing profile (`users/<uid>`), or else an
   invitation (`invites/<email>`) that it turns into a profile, or else a refusal. The rules re-check all of it.
4. `context/StudyContext.tsx` loads the content (`data/index.ts`: shared library + the person's client, merged)
   and the person's own work (`data/useProgress.ts`), and gives every screen one object through `useStudy()`.
5. `App.tsx` draws the header and the tabs from `tabs.ts`. Every tab stays mounted and is only hidden, which is
   why drafts and timers survive tab switches.

Things worth knowing before you change them:

- **Two hooks for "who is signed in".** `useAuth()` is the raw state for the screens shown *before* the app
  opens. Everything inside the app uses `useSignedIn()`, which guarantees a user and profile exist (it throws
  otherwise, which cannot happen behind `AuthGate`).
- **Progress is optimistic.** `useProgress` updates the screen immediately and writes in the background. A
  `beforeunload` warning protects changes that are not confirmed yet. Per-person summary counters
  (`storyCount`, `jotCount`, `masteredCount`, `lastActiveAt`) are updated in the same batch as the change.
- **Live revocation.** When an admin switches someone off while the app is open, Firestore does *not* stop that
  person's open listeners. Two things notice instead: their own profile (which they can always read) now says
  `revoked`, and any write that fails with `permission-denied`. Both call `recheckAccess`, which shows "Access has
  ended". Do not rely on a listener erroring.
- **The invitation message uses the address you are on.** Someone invited while you run `npm run dev` is told to
  open `http://localhost:5173`. Send real invitations from the live site.
- **Content comes from Firebase only.** The `seed/` files are only read by the **Import starter data** button
  (`data/seedSource.ts`, `data/seedImport.ts`).
- **Prefs stay in the browser.** Which tab, accent, last position: `data/usePrefs.ts`, in `localStorage`.
- **Admin code is lazy.** `tabs.ts` loads the Admin tab with `lazy()`, so clients never download it.

## Common changes

**Change a colour, font or piece of text.** Colours and fonts: `src/index.css`. Text: search for the words. The
sign-in and "no access" wording is in `features/auth/`.

**Add a tab.** See "Add a new tab" in `src/features/README.md`. One folder, one line in `tabs.ts`.

**Add an Admin section.** Add a component in `src/features/admin/` and one line in `SECTIONS` in `AdminHome.tsx`.

**Add an editable list to the Admin screens.** Copy `tier(...)` or `deck(...)` in `SharedContent.tsx` (shared
content) or `ClientEditor.tsx` (one client), change the names, add it to `LISTS`. A "list spec" says what the form
boxes are, how a row looks, how to read the list out of the data and how to save it. `ListEditor.tsx` does the rest
(search, paging, add/edit/delete with confirmation, reorder).

**Change what is stored.** In this order:
1. Edit the shape in `src/types.ts`, then run `npm run typecheck`. It lists many of the places that need
   updating.
2. Existing documents will not have the new field. Make the code cope with that (`normalize.ts` is where missing
   fields are filled in) or write a one-off migration.
3. Update `docs/DATA-MODEL.md`.
4. If the field affects who may see or change something, change `firestore.rules` and add tests (below).

**Add a flashcard deck.** Add the name to `FlashcardCategory` in `types.ts` and run `npm run typecheck`: it flags
`data/normalize.ts` (`normalizeLibrary` and `FLASHCARD_CATEGORIES`) and the labels in
`features/flashcards/Flashcards.tsx`. It does **not** flag two lists that also need a line: the decks shown on screen
(`categories` in `Flashcards.tsx`) and the admin editors (a `deck(...)` line in `features/admin/SharedContent.tsx`), so
do those by hand. Add starter cards to the seed file if you want them. The database needs nothing: a deck is just the
`category` field on `flashcards/<category>_<n>`.

**Change which AppSheet category becomes what.** The list `CATEGORY_RULES` at the top of `src/data/appsheetCsv.ts`.
The preview screen shows a copy of the rules in words; update that text in `CsvImport.tsx` too.

**Change the consent line.** `features/auth/consent.ts`. It is shown on the sign-in screen and in every footer and
**must stay true to the rules**: admins can read people's stories and progress. If you ever change that access, change
the line in the same commit.

## The security rules

`firestore.rules` starts with a plain-English summary. The invariants worth protecting:

- Someone who is not signed in, not invited, or revoked can do **nothing**. A revoked person can only read their own
  profile, so the app can say "Access has ended".
- A person reads and writes only their own work. **Admins read everyone's work but never write it.**
- A person can never change their own `role`, `clientId` or `roleBeforeRevoke`. Only an admin can.
- Profiles are never deleted by the app. Access ends with `role: "revoked"`, and `roleBeforeRevoke` lets
  **Restore access** give the same role back.
- Under `users/{uid}`, sub-collections are matched **one by one**. Never write a `{document=**}` wildcard there: it
  would quietly open every future sub-collection.

**To change a rule:** edit `firestore.rules`; in `rules-tests/rules.test.mjs` add a test that the right person
**can** do it and one that the wrong person **cannot**; run `npm run test:rules` (ends with `fail 0`); then
`npm run deploy:rules`. `rules-tests/README.md` explains the file. A good habit: after writing a test, loosen the
rule on purpose and check the test fails, so you know it guards something.

## Testing

What is in the repository:

- **Types:** `npm run typecheck` (and `npm run build`, which runs it first).
- **Security rules:** 49 tests in `rules-tests/` (`npm run test:rules`).

What is **not** in the repository: automated tests of the screens. The app was checked in a real browser against the
emulators while it was built, but those scripts are not part of the project. So before publishing a change that
touches screens, do this by hand with `npm run emulators` and `npm run dev:emulator` (sign in as any email you
invited in the emulator's control panel):

1. Sign in as an invited person. Each tab opens; write a story, add a jot, master a card; reload and check it is
   still there.
2. Sign in as an admin. Open each Admin section. Invite someone, move them, switch them off and on, view their work.
3. Sign in with an email that was **not** invited and check you are refused.
4. Narrow the window to a phone width and look at what you changed.

## Deploying

```
npm run deploy
```

This builds the site (stopping on any type error), then publishes the site, the rules and the indexes to
`study-suite-65822`. You must be logged in once with `npx firebase-tools login`. Then open the live address in a
private window and check the sign-in screen, then sign in.

- **Only the site:** `npx firebase-tools deploy --only hosting`. **Only the rules:** `npm run deploy:rules`.
- **Roll back:** Firebase console > **Hosting** > release history > the menu on an earlier release > **Rollback**.
  It takes effect quickly. (Rules have their own history under Firestore > Rules.)
- **Try before publishing:** `npx firebase-tools hosting:channel:deploy preview --expires 1d` makes a temporary
  address for the build and adds it to the approved sign-in domains automatically.
- **Site settings** are the `hosting` part of `firebase.json`, and they matter:
  - The page itself (`index.html`) is sent with `no-cache`, so people get a new release on their next visit. The
    built files under `/assets/` have names that change with every build and are cached for a year.
  - There is **no catch-all "send everything to index.html" rule**, on purpose. This app has no page routes, and with
    that rule a request for a file that no longer exists after a deploy would get the home page, cached for a year.
    Now it gets a plain 404. Add the rule back only if you add a router.
- **Open tabs** keep running the version they loaded. After a deploy, someone with the app already open may hit an
  error when they first open a part they had not used yet (Admin is loaded on demand). A reload fixes it.
- **Limits:** the free plan allows 10 GB of site storage and about 10 GB of downloads a month. A first visit downloads
  about 220 KB from the site (plus about 200 KB of fonts from Google), and the hashed files are cached after that, so
  the limit is far away.
- **Custom address:** add it in console > Hosting, then add it under Authentication > Settings > **Authorized
  domains**, or Google sign-in will refuse it.

## Things you may need to do by hand (rare)

**Erasing a person completely.** The app never deletes people's work, by design. To erase someone entirely:
1. Look up their `uid` in the console under Authentication > Users (or in Firestore > `users`).
2. `npx firebase-tools firestore:delete users/<uid> --recursive --project study-suite-65822`. The `--recursive`
   matters: it also removes their stories, jots and progress, which a plain delete would leave behind.
3. Delete `invites/<their email>` if it is still there, and then delete their account under Authentication > Users.

**Getting an admin back after a lock-out.** The console bypasses the rules. In Firestore > `users/<uid>`, set
`role` to `admin`. If they have never signed in, create `invites/<their email in lower case>` as in
`docs/SETUP-FIREBASE.md`, step 5.

**Updating the building blocks.** `npm outdated` shows what is behind. `npm update` takes the allowed updates.
Then run `npm run typecheck`, `npm run build` and `npm run test:rules`, and click through the app. `npm audit` will
mention `@grpc/grpc-js`; that part of Firebase is for servers and is not in the website, so ignore it. **Never run
`npm audit fix --force`**: it would install a 2022 version of Firebase.

## Known limits and decisions

- **Two admins editing the same list at the same moment can overwrite each other.** Each list is written back whole.
  It is not guarded because a small team is unlikely to hit it.
- **The summary counters are kept by the browser**, so a person could alter their own counts. They only drive the
  admin's overview numbers; **View work** shows the real stories.
- **The People section reads every profile and invitation.** That is fine for hundreds of people. Far beyond that it
  should be paged.
- **Invitations send no email.** The admin copies a message and sends it. Sending email would need server code,
  which means leaving the free plan.
- **The starter content in `seed/` is built into the site's files** (the Admin tab's **Import starter data** reads
  it), so anyone who finds those files can read it without signing in. It is also in the public GitHub repository.
  If that content must become private, remove `seed/clients/` from the repository and the build once the content
  has been imported; the database is the real home of the content.
- **Fonts come from Google Fonts** (`index.html`), which means a visitor's browser contacts Google for them. To avoid
  that, put the font files in `public/` and point `index.css` at them.
- **A backup holds content only** (shared library and clients), not people's stories or progress. Firestore's own
  scheduled backups need a paid plan.
- **Old data is not migrated.** Whatever people stored in their browser on the old page stays there. They can export it
  from the old page (<https://rkillen.github.io/study-suite/>) and paste what they want into Storycraft.
