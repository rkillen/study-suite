# Features (one folder per tab)

| Folder | Tab |
|---|---|
| `overview/` | Overview: numbers, watch-outs, shortcuts |
| `beachcombing/` | Beachcombing: trigger words and memory jots |
| `preoutlining/` | Pre-Outlining: countdown timer and spoken answer |
| `storycraft/` | Storycraft: write stories and keep the story log |
| `speaking/` | Speaking Arena: scenarios and live transcripts |
| `flashcards/` | Flashcards: the rolling 20-card deck |
| `admin/` | The Admin tab (admins only): content management. Today: importing the starter data |
| `auth/` | Not a tab: the sign-in, "not invited" and setup screens shown before the app opens |

Inside a folder, the main file is named after the tab, for example `Beachcombing.jsx`.

## Add a new tab

1. Make a folder, for example `src/features/journal/`, with a file `Journal.jsx`:

   ```jsx
   import { useStudy } from "../../context/StudyContext.jsx";

   export default function Journal() {
     const { clientId } = useStudy();
     return (
       <section className="space-y-6">
         <h1 className="font-serif text-2xl font-semibold text-charcoal-900">Journal for {clientId}</h1>
       </section>
     );
   }
   ```

2. Open `src/tabs.js`, import it, and add one line to the list:

   ```js
   { id: "journal", label: "Journal", icon: BookOpen, Component: Journal },
   ```

   (Icons come from <https://lucide.dev/icons>. Import the one you pick at the top of the file.)

3. Run `npm run dev` and the tab appears.

## What `useStudy()` gives you

`clientId`, `clientProfile` (watch-outs, scenarios, personal cards), `library` (shared words, questions,
prompts, flashcards), `progress` (the person's stories, mastered cards, decks and `jotCount`), and the actions that
change them (`addJot`, `addStory`, `updateStory`, `removeStory`, `masterCard`, ...). Use these rather
than saving things yourself, so that the data ends up in the right place.
