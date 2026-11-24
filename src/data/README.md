# Data (`src/data/`)

This folder decides where information comes from and where it is saved. The rest of the app never
reads files or the database directly; it only calls what is exported here. That is what makes it
possible to switch to Firebase without redoing any screen.

| File | Job |
|---|---|
| `index.js` | `loadStudyData(clientId)`: gets the shared library and the client's profile, and combines them. |
| `seedSource.js` | **Where the content comes from today:** the JSON files in `/seed`. Firebase replaces this file. |
| `normalize.js` | Tidies loaded content: fills missing ids, and shows a scenario's `category` as its `domain`. |
| `merge.js` | Puts a client's own Beachcombing words ahead of the shared ones. |
| `useProgress.js` | A person's jots, stories, mastered cards and decks, with the actions that change them. Saved in the browser today; Firebase later. |
| `usePrefs.js` | Screen settings and positions (current tab, voice accent, which card). Always saved in the browser. |
| `useStoredState.js` | The small helper that remembers an object in the browser. |

## Two kinds of saved data

- **Progress** (jots, stories, mastered cards, decks) is the person's own work. It will move to Firebase
  so it follows them between devices.
- **Preferences** (current tab, accent, "where was I") only matter on this device, so they stay in
  the browser.
