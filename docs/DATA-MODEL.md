# What is stored in Firebase

Everything lives in **Firestore**, Firebase's database. It is organised as *collections* (like folders)
of *documents* (like small records). You can browse all of it in the Firebase console under
**Build > Firestore Database > Data**.

Who may read or write each part is decided by `firestore.rules`. The short version is at the bottom.
The same shapes are written as TypeScript in `src/types.ts`, which the code is checked against.

## Overview

```
invites/<email>                        the guest list: who may sign in, and as what
users/<uid>                            one profile per person (role, client, summary numbers)
  users/<uid>/stories/<id>             their saved stories
  users/<uid>/jots/<id>                their Beachcombing jots
  users/<uid>/progress/state           mastered cards and their current decks
library/beachcombing                   shared trigger words, in three tiers
library/preOutlining                   shared Pre-Outlining questions
library/storyPrompts                   shared Storycraft prompts
flashcards/<category>_<n>              shared flashcards, many cards per document
clients/<clientId>                     one coaching client (name, own Beachcombing words)
  clients/<clientId>/watchOuts/<id>    "Things to watch out for"
  clients/<clientId>/scenarios/<id>    Speaking Arena scenarios
  clients/<clientId>/cards/<id>        personal flashcards ("Personal Focus" deck)
```

## People

### `invites/<email>`

The document **name** is the person's email address in lower case, for example `ana@example.com`.

| Field | Meaning |
|---|---|
| `role` | `user` or `admin` |
| `clientId` | which client they see, for example `morocco`. Admins usually use `default`. |
| `invitedBy`, `createdAt` | for your records |

On first sign-in the invitation is copied into the person's profile, so changing an invitation later does
not change someone who has already signed in. Change their profile instead.

### `users/<uid>`

`<uid>` is Firebase's own id for the person (not their email).

| Field | Meaning |
|---|---|
| `email`, `displayName` | from their Google account |
| `role` | `user`, `admin`, or `revoked` (access switched off) |
| `roleBeforeRevoke` | only present while revoked: the role to give back on restore |
| `clientId` | which client they see |
| `createdAt`, `lastActiveAt` | first sign-in, and the last time they saved something |
| `storyCount`, `jotCount`, `masteredCount` | summary numbers, kept up to date by the app. The admin's progress list reads these so it does not need to open everyone's stories. |

Only an admin can change `role` or `clientId`. Profiles are never deleted: access ends by setting
`role` to `revoked`, and the role they had is kept in `roleBeforeRevoke` so that **Restore access** gives the same
role back (an admin who is switched off and on again is still an admin). Stories and progress are kept throughout.

Once someone has signed in, their invitation stays on file. When an admin moves a person to another client, both
the profile and that leftover invitation are updated together; switching access off removes the invitation.

### Their work

- `stories/<id>`: `title`, `prompt`, `body`, `createdAt`, and `updatedAt` once edited. Dates are text like
  `2026-11-24T10:41:46.256Z`.
- `jots/<id>`: `word`, `text`, `date`.
- `progress/state`: `masteredIds` (ids of retired flashcards) and `activeDecks` (for each flashcard
  category, the ordered list of card ids in the current 20-card deck).

## Shared content (the same for every client)

- `library/beachcombing`: `tier1`, `tier2`, `tier3`, each a list of words.
- `library/preOutlining`: `questions`, a list of text.
- `library/storyPrompts`: `prompts`, a list of text.
- `flashcards/<category>_<n>`: `category` (`oxford`, `phrasal`, `idioms`, `interview`), `chunk` (the
  number `n`) and `cards`. Each card has `id`, `term`, `definition`, and optionally `example` and `note`.

**Why many cards in one document?** Every database read counts against the free daily allowance, and every
person loads all the cards each time they open the app. Storing around 200 cards per document means that
loading every card costs a handful of reads instead of hundreds. The only code that knows about this is
`src/data/flashcardChunks.ts`; the rest of the app just sees lists of cards.

## Clients

`clients/<clientId>` has `profileName` and `beachcombing` (the client's own extra words in `tier1`, `tier2`,
`tier3`, shown before the shared ones). The `clientId` is the short name used everywhere else, such as `morocco`.

The three lists are separate documents, one per item, each with an `order` number that sets the order
shown. Each item's document name is its id.

| Subcollection | Fields |
|---|---|
| `watchOuts` | `tag`, `title`, `detail` |
| `scenarios` | `domain` (the small label above the title), `title`, `context`, `prompt` |
| `cards` | `category` (`custom`), `term`, `definition`, `example`, `note` |

A client with no watch-outs or no scenarios of their own gets those from the client named `default`.
That is what makes `default` special: keep it filled in.

## How much does the app read?

Opening the app reads roughly 60 documents: the shared content (about 7), the client's items (about 25), the
generic `default` client only when needed, the person's profile and progress, and their stories. The free
plan allows 50,000 reads a day, so around 50 clients opening the app a few times a day is comfortably inside it.

## Who can do what (short version)

| | Their own work | Shared content and clients | Everyone's work |
|---|---|---|---|
| A person (`user`) | read and write | read (their own client only) | no access |
| An admin | read and write their own | read and write all | **read only** |
| Revoked, or not invited | no access | no access | no access |

The full rules are in `firestore.rules`, with plain-language comments at the top, and they are checked by
the tests in `rules-tests/`.
