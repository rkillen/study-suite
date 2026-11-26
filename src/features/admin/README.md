# The Admin tab (`src/features/admin/`)

Only admins see this tab. Everything in it changes what is stored in Firebase, so changes reach everyone
straight away.

| File | What it is |
|---|---|
| `AdminHome.tsx` | The tab itself: a title and a row of sections. **To add a section, add a line to the `SECTIONS` list at the top.** |
| `SharedContent.tsx` | Edit the content every client shares: Beachcombing words (3 tiers), Pre-Outlining questions, Story prompts and the four flashcard decks. |
| `ClientsAdmin.tsx` | Pick a client from a list, or add a new one. |
| `ClientEditor.tsx` | Everything about one client: rename, and edit their watch-outs, scenarios, personal cards and own Beachcombing words. |
| `AddClientForm.tsx` | Makes a new client, empty or as a copy of an existing one, and can invite their person at the same time. |
| `PeoplePanel.tsx` | On each client: who has an account or an invitation, and a form to invite someone. |
| `AllPeople.tsx` | The **People** section: everyone, with search, filter and sort, their progress numbers, and what you can do about them. |
| `PersonRow.tsx` | One person as a card, with their actions (view work, move, switch access off or on, cancel an invitation). Used by both people lists. |
| `PersonWork.tsx` | A person's stories and jots, read-only, 25 at a time. |
| `BulkInvite.tsx` | Paste a list of emails and clients, review it, and invite them all. |
| `InviteAdmin.tsx` | Invite another admin (with an extra "are you sure"). |
| `InviteMessage.tsx` | The message to send someone you invited, with a Copy button. |
| `ImportBackup.tsx` | Import the starter data from `seed/`, import AppSheet CSVs, download a backup, restore from a backup file. |
| `CsvImport.tsx` | The AppSheet CSV card: choose the files, see a before/after preview, confirm. |
| `ListEditor.tsx` | The reusable list: search, pages, add, edit, delete (with "are you sure"), add several at once, reorder. Every list in the Admin area is one of these. |
| `listSpec.tsx` | Describes one editable list (its form boxes, its rows, how it is read and saved). `defineList()` turns that into something a screen can show. |
| `AdminCard.tsx` | The titled card and the two button styles used on the Admin screens. |

## The AppSheet CSV import

- **Which category becomes what** is one short list at the top of `src/data/appsheetCsv.ts` (`CATEGORY_RULES`).
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
- **Delete client** (at the bottom of a client) removes it and all its items. It is refused while anyone still has an
  account or invitation in that client (it names them), and the `default` client cannot be deleted.

## Inviting people

- An invitation is a record saying "this email may sign in, as a regular user, for this client". The person then
  opens the site and signs in with that Google account; their account is created from the invitation.
  There is no email sent: the **Copy message** button gives you the words to send yourself.
- Emails are stored in lower case. A person can only be invited once: someone who already has an account, or
  is already invited (to any client), is refused with the reason.
- A client normally has one person. Inviting a second shows a warning and needs **Invite anyway**.
- **Cancel invitation** is only offered before the person has signed in. After that, use **Switch off access**.
- Admins are invited from the **People** section (**Invite an admin**), not from a client.

## The People section

- It lists everyone who has an account or an invitation, with the numbers an admin needs at a glance: last active,
  stories, jots and cards mastered. Sort by "Longest quiet first" to find people who have gone quiet.
- **View work** opens a person's stories and jots to read. It is strictly read-only (the security rules allow admins
  to read people's work, never to change it), and the screen reminds you that the person has been told, in the footer
  of every page, that their facilitator can read their stories and progress.
- **Switch off access** keeps everything the person wrote, removes their invitation, and makes the app say "Access has
  ended". It works even if they have the app open at that moment. **Restore access** gives the same role back, so an
  admin who is switched off and on again is still an admin. You cannot switch yourself off, and the app refuses to switch
  off the last admin.
- **Move to another client** changes which client someone sees. It also works for people who have not signed in yet.
- **Invite many people**: one person per line, as `email, client`. The client is its short id or its exact name (names
  with commas are fine). Lines are checked before anything is saved, and the preview says why a line was refused.
  Lines with no client can use a client you pick. Up to 200 lines at a time.

## Adding another editable list

Each list in `SharedContent.tsx` and `ClientEditor.tsx` is a small block of settings, not a new screen. Look at `tier(...)` or
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
