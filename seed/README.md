# Starter content

These JSON files are the content the app started with. Right now the app reads them directly. When
Firebase is connected, an admin button will copy them into the database once, and the database becomes
the place where content is edited. These files then stay as the starting point and a backup.

## Files

- `shared-library.json` is the content everyone gets:
  - `beachcombing` has `tier1`, `tier2` and `tier3` lists of trigger words.
  - `preOutliningQuestions` is the list of questions for Pre-Outlining.
  - `storyPrompts` is the list of prompts for Storycraft.
  - `flashcards` has four decks: `oxford`, `phrasal`, `idioms` and `interview`. Each card has an `id`,
    a `term`, a `definition`, an optional `example` and an optional `note`.
- `clients/<name>.json` is one coaching client. **The file name is the client's ID** (`morocco.json` is
  the client `morocco`). It can contain:
  - `profileName`: a readable name.
  - `watchOuts`: focus points shown on the Overview (`tag`, `title`, `detail`).
  - `scenarios`: Speaking Arena scenarios (`title`, `category`, `prompt`, optional `context`).
  - `beachcombing`: extra trigger words for this client, shown before the shared ones.
  - `customCards`: personal flashcards (the "Personal Focus" deck), same shape as shared cards.
- `clients/default.json` is used for any client without a file of their own. It is also a good
  template to copy when starting a new client.

## Things to know

- A client does not need every section. Anything left out falls back to `default.json` (watch-outs and
  scenarios) or to the shared library (words).
- The scenario field `category` is shown as the small label above a scenario.
- `radiology.json` has an extra `scenarios-hidden` list of scenarios that are not used by the app.
- `sauna.json` says `"clientId": "pollead"` inside, but its ID is `sauna`, because the file name
  is what counts.
