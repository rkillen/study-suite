# The Admin tab (`src/features/admin/`)

Only admins see this tab. Everything in it changes what is stored in Firebase, so changes reach everyone
straight away.

| File | What it is |
|---|---|
| `AdminHome.jsx` | The tab itself: a title and a row of sections. **To add a section, add a line to the `SECTIONS` list at the top.** |
| `SharedContent.jsx` | Edit the content every client shares: Beachcombing words (3 tiers), Pre-Outlining questions, Story prompts and the four flashcard decks. |
| `ClientsAdmin.jsx` | Pick a client from a list, or add a new one. |
| `ClientEditor.jsx` | Everything about one client: rename, and edit their watch-outs, scenarios, personal cards and own Beachcombing words. |
| `AddClientForm.jsx` | Makes a new client, empty or as a copy of an existing one, and can invite their person at the same time. |
| `PeoplePanel.jsx` | On each client: who has an account or an invitation, and a form to invite someone. |
| `InviteMessage.jsx` | The message to send someone you invited, with a Copy button. |
| `ImportBackup.jsx` | Import the starter data from `seed/`, import AppSheet CSVs, download a backup, restore from a backup file. |
| `CsvImport.jsx` | The AppSheet CSV card: choose the files, see a before/after preview, confirm. |
| `ListEditor.jsx` | The reusable list: search, pages, add, edit, delete (with "are you sure"), add several at once, reorder. Every list in the Admin area is one of these. |
| `AdminCard.jsx` | The titled card and the two button styles used on the Admin screens. |

## The AppSheet CSV import

- **Which category becomes what** is one short list at the top of `src/data/appsheetCsv.js` (`CATEGORY_RULES`).
  If AppSheet categories change, change that list; nothing else needs touching. The screen shows the same
  list under "Which AppSheet categories go where?".
- It only replaces the lists the file has something for. A file with only questions replaces only the questions.
  The interview flashcards, the story prompts and every client are never touched.
- Rows in other categories are skipped and counted in the preview. Repeated words or questions (ignoring
  capitals) are left out. A card's id is the row's `Prompt_ID`, so re-importing keeps people's progress on cards that
  are still in the file. If an id repeats, or clashes with a deck that is staying, it gets `_2`, `_3`...
- Nothing is saved until you press **Yes, replace these lists**. The tip in the preview applies: download a
  backup first, then you can undo it with **Restore from a backup file**.

## Clients

- A client's **id** (for example `morocco`) is made from the name when the client is created, and it can never be
  changed: it is used in the database and in people's records. The **name** can be changed at any time.
- "Add client" can start from a copy of another client (including `default`). Every copied item gets a new id,
  because flashcards are remembered by id in people's progress, so two clients must not share them. The copy is
  completely independent afterwards.
- A client with no watch-outs or no scenarios of their own shows the `default` client's. The screen says so.
- There is no "delete client" yet.

## Inviting people

- An invitation is a record saying "this email may sign in, as a regular user, for this client". The person then
  opens the site and signs in with that Google account; their account is created from the invitation.
  There is no email sent: the **Copy message** button gives you the words to send yourself.
- Emails are stored in lower case. A person can only be invited once: someone who already has an account, or
  is already invited (to any client), is refused with the reason.
- A client normally has one person. Inviting a second shows a warning and needs **Invite anyway**.
- **Cancel invitation** is only offered before the person has signed in. (Switching off access for someone who
  has signed in comes with the People section.)
- Inviting an admin is not done here, because it is a bigger step. For now it is the manual console method in
  `docs/SETUP-FIREBASE.md`.

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
