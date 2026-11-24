# Helpers (`src/lib/`)

Small functions that don't draw anything on screen.

- `speech.js`: reads text aloud (the Listen buttons) and the shared microphone engine used for dictation.
- `useSpeechCapture.js`: lets a screen know whether its microphone button is the one currently listening.
- `chime.js`: the soft sound when the Pre-Outlining timer ends.
- `download.js`: saves text as a file download (story exports).
- `random.js`: picks a different random item, and shuffles a list.
- `text.js`: counts words.

Dictation uses the browser's built-in speech recognition. It works in Chrome and Edge, and not in every
browser; where it is missing, people can type instead.
