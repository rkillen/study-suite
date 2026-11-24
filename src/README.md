# The app (`src/`)

This is the folder map. For the bigger picture, common changes and how to deploy, see `docs/DEVELOPER-GUIDE.md`.

| Path | What it does |
|---|---|
| `main.tsx` | Starts the app and wraps it in the shared pieces (notifications, sign-in, data, story draft). |
| `App.tsx` | The page layout: header, tab bar, and the tabs themselves. |
| `tabs.ts` | The list of tabs, in order. **Add a new tab here.** Mark a tab `adminOnly: true` to show it to admins only. |
| `index.css` | Fonts, colours and a few custom styles. |
| `types.ts` | **The shapes of all the data** (a client, a flashcard, a story...). Start here to see what the app stores. |
| `features/` | One folder per tab (Overview, Beachcombing, ...). See `features/README.md`. |
| `components/` | Small pieces used in several places (header, tab bar, microphone button). |
| `context/` | Information shared across the whole app (current client, content, notifications). |
| `data/` | Where content and each person's progress come from. See `data/README.md`. |
| `firebase/` | The connection to Firebase and the check of who may sign in. See `firebase/README.md`. |
| `lib/` | Helper functions that don't show anything on screen (speech, downloads, random picks). |

## How it fits together

1. `features/auth/` makes sure the person is signed in and invited. Nothing else shows until then.
2. `data/` loads the shared library and the profile of the person's client.
3. `context/StudyContext.tsx` holds that content plus the person's progress, and hands it to every screen.
4. Each folder in `features/` is one tab. It reads what it needs from the context and shows it.

## Handy to know

- Words like `bg-crimson-700`, `text-gold-600` and `rounded-xl` are styling. The colour names and shades
  are defined in `index.css`.
- Every tab stays loaded while you use another one and is only hidden. That is why a half-written story
  or a running timer survives switching tabs.

## TypeScript, in plain words

Files ending in `.ts` and `.tsx` are TypeScript: ordinary JavaScript with labels that say what kind of
thing each value is (a piece of text, a number, a client profile...). A checker reads the labels and points out
mistakes before anyone sees them: using a field that does not exist, or forgetting that something might be empty.

- Run the checker with `npm run typecheck`. `npm run build` runs it first and stops if there are mistakes, so a
  broken change never reaches the live site. (`npm run dev` still shows the app while you work; the checker is
  separate.)
- A message looks like `src/data/people.ts(12,5): error TS2339: Property 'nam' does not exist on type 'Person'`. It tells
  you the file, the line and column, and what is wrong. This one is a typo for `name`.
- **To change what the app stores, change it in `types.ts` first**, then run `npm run typecheck`. The checker lists
  every place that now needs updating, so nothing is forgotten. Then change `docs/DATA-MODEL.md` and, if people's
  access is affected, `firestore.rules`.
- You will see short labels such as `: string`, `: number[]` and `: Promise<void>` after names. They are only
  there for the checker and have no effect when the app runs.
