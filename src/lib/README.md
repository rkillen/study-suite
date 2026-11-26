# Helpers (`src/lib/`)

Small functions that don't draw anything on screen.

- `routing.ts`: the address of each tab and Admin section, and links that keep the admin `?client=` preview.
- `speech.ts`: reads text aloud (the Listen buttons) and the shared microphone engine used for dictation.
- `useSpeechCapture.ts`: lets a screen know whether its microphone button is the one currently listening.
- `chime.ts`: the soft sound when the Pre-Outlining timer ends.
- `download.ts`: saves text as a file download (story exports).
- `random.ts`: picks a different random item, and shuffles a list.
- `text.ts`: counts words.
- `ids.ts`: makes a unique id for something new (such as a flashcard).

Dictation uses the browser's built-in speech recognition. It works in Chrome and Edge, and not in every
browser; where it is missing, people can type instead.
