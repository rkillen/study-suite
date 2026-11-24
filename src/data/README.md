# Data (`src/data/`)

This folder decides where information comes from and where it is saved. The rest of the app never
talks to the database directly; screens only use what is exported here (through `useStudy()`). What is
stored, and where, is described in `docs/DATA-MODEL.md`.

## Reading content

| File | Job |
|---|---|
| `index.js` | `loadStudyData(clientId)`: gets the shared library and the client's profile, and combines them. |
| `firestoreSource.js` | Reads the shared library and a client's profile from Firebase. |
| `flashcardChunks.js` | Shared flashcards are stored a couple of hundred per document (to save database reads). This file splits them up and puts them back together. Nothing else needs to know. |
| `normalize.js` | Tidies loaded content: fills missing ids, and shows a scenario's `category` as its `domain`. |
| `merge.js` | Puts a client's own Beachcombing words ahead of the shared ones. |

## Saving content (admins only)

| File | Job |
|---|---|
| `firestoreWriters.js` | Saves content: one list at a time (`saveBeachcombing`, `saveFlashcardCategory`, `saveClientSection`...), a whole client (`saveClientProfile`, `createClient`) or everything (`saveSharedLibrary`). Each one replaces what is stored. |
| `appsheetCsv.js` | Reads the two AppSheet CSV files and works out what the shared content would become. Reads text only: it never talks to Firebase. The category rules are at the top. |
| `csvImport.js` | Saves the result of `appsheetCsv.js`, replacing only the lists the CSV had something for. |
| `people.js` | Invitations and who is attached to a client: list them, check an email can be invited, invite, cancel. |
| `clientIds.js` | Making a client's short id from a name, checking an id is allowed, and copying a client's content with fresh ids. |
| `replaceContent.js` | Saves a whole set of content (the shared library plus a list of clients). Used by both the starter import and the backup restore. |
| `seedSource.js` | Reads the starter files in `/seed`. Loaded only when an admin imports. |
| `seedImport.js` | `importSeed()`: copies the starter files into Firebase. Used by the Admin tab's "Import starter data" button. |
| `backup.js` | `createBackup()` collects all content into one file's worth of data; `readBackup()` checks a backup file and gets it ready to restore. |

## A person's own work

| File | Job |
|---|---|
| `useProgress.js` | Jots, stories, mastered cards and decks, with the actions that change them (`addStory`, `masterCard`, ...). Saved in Firebase, shown on screen immediately, and kept in step across devices. It also keeps the summary numbers on the person's profile up to date, because the admin's progress list reads those. |

## Settings kept on this device

| File | Job |
|---|---|
| `usePrefs.js` | Screen settings and positions (current tab, voice accent, which card). |
| `useStoredState.js` | The small helper that remembers an object in the browser. |

These only matter on one device, so they are not stored in Firebase.

## Good to know

- Changes to a person's work appear on screen at once and are sent in the background. If the connection
  drops, they are kept until it returns. The browser warns before the page is closed while anything is
  still unsent, because it would be lost.
- If a save is refused or fails, the person sees "Could not save your last change".
