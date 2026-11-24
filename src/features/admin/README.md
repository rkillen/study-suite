# The Admin tab (`src/features/admin/`)

Only admins see this tab. Everything in it changes what is stored in Firebase, so changes reach everyone
straight away.

| File | What it is |
|---|---|
| `AdminHome.jsx` | The tab itself: a title and a row of sections. **To add a section, add a line to the `SECTIONS` list at the top.** |
| `SharedContent.jsx` | Edit the content every client shares: Beachcombing words (3 tiers), Pre-Outlining questions, Story prompts and the four flashcard decks. |
| `ClientsAdmin.jsx` | Pick a client from a list, or add a new one. |
| `ClientEditor.jsx` | Everything about one client: rename, and edit their watch-outs, scenarios, personal cards and own Beachcombing words. |
| `AddClientForm.jsx` | Makes a new client, empty or as a copy of an existing one. |
| `ImportBackup.jsx` | Import the starter data from `seed/`, download a backup, restore from a backup file. |
| `ListEditor.jsx` | The reusable list: search, pages, add, edit, delete (with "are you sure"), add several at once, reorder. Every list in the Admin area is one of these. |
| `AdminCard.jsx` | The titled card and the two button styles used on the Admin screens. |

## Clients

- A client's **id** (for example `morocco`) is made from the name when the client is created, and it can never be
  changed: it is used in the database and in people's records. The **name** can be changed at any time.
- "Add client" can start from a copy of another client (including `default`). Every copied item gets a new id,
  because flashcards are remembered by id in people's progress, so two clients must not share them. The copy is
  completely independent afterwards.
- A client with no watch-outs or no scenarios of their own shows the `default` client's. The screen says so.
- There is no "delete client" yet.

## Adding another editable list

Each list in `SharedContent.jsx` and `ClientEditor.jsx` is a small block of settings, not a new screen. Look at `tier(...)` or
`deck(...)` near the top: they say what the form boxes are called (`fields`), how to show a row
(`renderSummary`), how to read the list from the library (`read`), and how to save it (`persist`).
Copy one, change the names, and add it to the `LISTS` array.

## Good to know

- Saving is "all or nothing" per list: the whole list is written back. Two admins editing the *same* list
  at the same moment could overwrite each other. That is unlikely with a small team, so it is not guarded.
- After a change, the admin's own app view refreshes by itself a second later. Other people see the change
  the next time they open or reload the app.
- Flashcards are remembered by id. Editing a card keeps it (so progress on it stays); deleting it takes it
  out of everyone's decks. Never reuse an id for a different card.
- A backup holds content only (shared library and clients). It does not hold people's stories or progress.
