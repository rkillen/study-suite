# The app (`src/`)

| Path | What it does |
|---|---|
| `main.jsx` | Starts the app and wraps it in the shared pieces (notifications, sign-in, data, story draft). |
| `App.jsx` | The page layout: header, tab bar, and the tabs themselves. |
| `tabs.js` | The list of tabs, in order. **Add a new tab here.** |
| `index.css` | Fonts, colours and a few custom styles. |
| `features/` | One folder per tab (Overview, Beachcombing, ...). See `features/README.md`. |
| `components/` | Small pieces used in several places (header, tab bar, microphone button). |
| `context/` | Information shared across the whole app (current client, content, notifications). |
| `data/` | Where content and each person's progress come from. See `data/README.md`. |
| `firebase/` | The connection to Firebase and the check of who may sign in. See `firebase/README.md`. |
| `lib/` | Helper functions that don't show anything on screen (speech, downloads, random picks). |

## How it fits together

1. `features/auth/` makes sure the person is signed in and invited. Nothing else shows until then.
2. `data/` loads the shared library and the profile of the person's client.
3. `context/StudyContext.jsx` holds that content plus the person's progress, and hands it to every screen.
4. Each folder in `features/` is one tab. It reads what it needs from the context and shows it.

## Handy to know

- Words like `bg-crimson-700`, `text-gold-600` and `rounded-xl` are styling. The colour names and shades
  are defined in `index.css`.
- Every tab stays loaded while you use another one and is only hidden. That is why a half-written story
  or a running timer survives switching tabs.
