# Components

Small building blocks shared by more than one tab.

- `Header.jsx`: logo, client badge, data-source badge and the voice (en-US / en-GB) switch.
- `TabNav.jsx`: the row of tab buttons. It builds itself from `src/tabs.js`.
- `MicControl.jsx`: the Start / Stop microphone button with its status text. It types the spoken words
  into whichever text box it is given.

A piece that belongs to one tab only lives in that tab's folder in `src/features/`.
