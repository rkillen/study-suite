# Study Suite: instructions for AI assistants

Read this first, every session. Follow it unless the owner tells you otherwise in the conversation.

## Who you are working for

The owner of this project is **not a software engineer**. They rely on you to write the code, so:

- Explain in plain English. Avoid jargon, or explain it in a few words when you must use it.
- Keep changes small, and make one change at a time.
- Ask before doing anything risky (see "Never, without explicit permission").
- Never assume they can read a code diff. Tell them what you changed and why, and how to check it.

## What this project is

A practice website for executive communication coaching. People are invited by an admin and sign in with Google.
Each person sees one coaching **client's** prompts, scenarios and flashcards, and keeps their own stories and progress.

- **Stack:** React 19, TypeScript (strict), Vite, Tailwind 4, `lucide-react`, `react-router`.
- **No server code of our own.** The browser talks straight to Firebase: Authentication (Google only), Firestore
  (the database) and Hosting (the free "Spark" plan). Firebase project id: `study-suite-65822`.
- **Live site:** <https://study-suite-65822.web.app>. Deploys are manual (`npm run deploy`); nothing publishes
  automatically, and pushing to GitHub does not change the live site.
- **Because there is no server, `firestore.rules` is the security.** Anything the page checks (hiding the Admin tab)
  is a convenience, not protection.

## Read before you change anything

| For | Read |
|---|---|
| Overview and commands | `README.md` |
| How the code fits together, common changes, rules, deploying | `docs/DEVELOPER-GUIDE.md` |
| Folder map of the app | `src/README.md` (and the `README.md` inside each folder) |
| What is stored where | `docs/DATA-MODEL.md` |
| What the owner does day to day | `docs/ADMIN-GUIDE.md`, `docs/HANDOVER-GUIDE.md` |

## Commands

| Command | What it does |
|---|---|
| `npm install` | Downloads the dependencies (once, and after `package.json` changes). |
| `npm run dev` | The app at <http://localhost:5173> against the **real** Firebase project. |
| `npm run typecheck` | Checks all the code for mistakes without running it. |
| `npm run build` | Typechecks, then builds the site into `dist/`. |
| `npm run emulators` | A pretend Firebase on this computer (needs Java 21+). Starts empty every time. |
| `npm run dev:emulator` | The app connected to the pretend Firebase. Use this for anything that writes data. |
| `npm run test:rules` | The security-rule tests (needs Java 21+). A healthy run ends with `fail 0`. |
| `npm run deploy:rules` | Publishes `firestore.rules` to the **live** project. |
| `npm run deploy` | Builds, then publishes the site, rules and indexes to the **live** project. |

There is no linter and no automated test of the screens. The checks that exist are `typecheck`, `build` and
`test:rules`.

## How to work

1. **Plan first.** For anything bigger than a small wording or colour change, tell the owner your plan in plain
   English and wait for their OK.
2. **Smallest change that does the job.** Match the surrounding code and comments. Do not refactor unrelated code.
3. **No new dependencies without asking.** The app deliberately uses very few (see "Principles" in
   `docs/DEVELOPER-GUIDE.md`). There is no state library on purpose.
4. **Run the checks** after changing code: `npm run typecheck` and `npm run build`. Report the result honestly,
   including failures. If you changed `firestore.rules`, also run `npm run test:rules`.
5. **Rules need tests.** For every rule change add, in `rules-tests/rules.test.mjs`, a test that the right person
   **can** do it and one that the wrong person **cannot**. Rules first, screens second.
6. **Changing what is stored:** edit `src/types.ts` first, run `npm run typecheck`, make the code cope with
   documents that lack the new field (`src/data/normalize.ts`), update `docs/DATA-MODEL.md`, and change
   `firestore.rules` and its tests if access is affected. Details: "Change what is stored" in
   `docs/DEVELOPER-GUIDE.md`.
7. **Keep the docs true.** If behaviour changes, update the README or guide that describes it in the same change.
8. **Finish by telling the owner how to check it by hand:** which page, what to click, what they should see.
9. **Commit only when asked,** with a clear message that says what changed and why.

## Never, without explicit permission in that conversation

- Run `npm run deploy`, `npm run deploy:rules`, or any `firebase` command that changes the live project. Say what it
  would publish and wait for a yes.
- Run `npm audit fix --force`. It would install a 2022 version of Firebase and break the app. The `@grpc/grpc-js`
  audit warning is expected and harmless here (that part of Firebase is for servers, not the website).
- Delete or overwrite data in Firebase, run `firestore:delete`, or press **Import starter data** against the live
  project. These can destroy people's work or replace edited content.
- Show, print, copy into chat, or commit `.env` or any key or password. `.env` is in `.gitignore`; keep it that way.
- Change `firestore.rules` or the consent line in `src/features/auth/consent.ts` unless that is the task. If the rules
  change, the consent line must stay true to them (admins can read people's stories and progress, never write them).
- Loosen a rule, or remove a test, to make an error go away.
- Run `git push`, merge, force-push, `reset`, `restore`, `clean` or anything else that rewrites history or discards
  uncommitted work. (At the time of writing, `main` on GitHub is the old single-page site served by GitHub Pages, and
  merging the new app into it would break that page. See "Handover checklist" in `docs/HANDOVER-GUIDE.md`.)
- Move the project to a paid Firebase plan, or add anything that needs one (for example Cloud Functions to send
  emails). Explain the cost and the trade-off instead, and let the owner decide.

## Things that are easy to get wrong

- **Content lives in the database, not in files.** Flashcards, prompts, clients and invitations are edited in the
  app's Admin tab. The files in `seed/` are only read by the **Import starter data** button, so editing them changes
  nothing on the live site. Never tell the owner a content change is done because you edited `seed/`.
- **A code change is not live until it is deployed,** and a rules change is not in force until `deploy:rules`.
- **Never write a `{document=**}` wildcard** under `users/{uid}` in `firestore.rules`. Sub-collections are matched one
  by one on purpose.
- **Admins read everyone's work but never write it.** A person can never change their own `role`, `clientId` or
  `roleBeforeRevoke`.
- **The 50,000-reads-a-day limit** on the free plan is why flashcards are stored about 200 to a document and why
  profiles carry summary counters. Do not add code that reads whole collections on every page load.
- **Tabs stay mounted.** Do not use `<Routes>` for the tabs: it would unmount the hidden ones and lose drafts and
  timers. See "The address says which tab is open" in `docs/DEVELOPER-GUIDE.md`.
- **Invitations made while running locally** tell people to open `http://localhost:5173`. The owner should send real
  invitations from the live site.
- **`.env` is read when the dev server starts.** After editing it, the server must be restarted.
- **Do not touch** `node_modules/`, `dist/` or `.firebase/`. They are generated.

## Checking a change by hand

There are no screen tests, so tell the owner to do this in a browser before anything goes live (use
`npm run emulators` plus `npm run dev:emulator` if the change writes data):

1. Sign in as an invited person. Open every tab. Write a story, add a jot, master a card, reload, and check they
   are still there.
2. Sign in as an admin. Open every Admin section.
3. Sign in with an email that was **not** invited and check it is refused.
4. Make the window phone-width and look at what changed.
