# Handover guide

You do not need to read or write code. You do need to be comfortable following steps, copying
and pasting, and asking an AI to explain things you do not understand.

This guide covers what to install, how to run the app on your own computer, how to change it safely with an AI
assistant, and how to put a change on the live site. The other guides go deeper once you need them (see the end).

The install, build and local-run steps were tested on a clean copy of the project on 25 November 2026 (Node 24,
npm 11).

## Start here

| I want to... | Go to |
|---|---|
| Understand what I have been given | [1. The big picture](#1-the-big-picture) |
| Get set up on a new computer | [2. Accounts](#2-accounts-you-need), [3. Install](#3-install-the-tools-once) and [4. Get the code](#4-get-the-code-and-connect-it) |
| See the app on my computer | [5. Run it on your computer](#5-run-it-on-your-computer) |
| Change something with an AI assistant | [6. Changing the app with an AI assistant](#6-changing-the-app-with-an-ai-assistant) |
| Put a change on the live site | [7. Put a change on the live site](#7-put-a-change-on-the-live-site-deploy) |
| Fix a problem | [9. When something goes wrong](#9-when-something-goes-wrong) |
| Look up a word | [10. Glossary](#10-glossary) |
| Hand the project over (current owner) | [11. Handover checklist](#11-handover-checklist-for-the-person-handing-over) |

If you only need to **run the site** (invite clients, edit flashcards and prompts, make backups), you do not need any
of the installing below. Use `docs/ADMIN-GUIDE.md`: it all happens in the app's **Admin** tab.

## 1. The big picture

Study Suite is a practice website for executive communication coaching. Each coaching client signs in with Google and
sees their own prompts, scenarios and flashcards. People are invited by an admin; nobody else can get in.

Key facts:

| | |
|---|---|
| Live site | <https://study-suite-65822.web.app> |
| Firebase project name | `study-suite-65822` (also written in the file `.firebaserc`) |
| Code | GitHub, `rkillen/study-suite` (see the note in step 4) |
| Monthly cost | Nothing. It runs on Firebase's free plan. |

### Three places, three jobs

```
 You + your AI assistant
        │  change files in
        ▼
 YOUR COMPUTER ──── "save" ────────▶ GITHUB  (the code and its history)
        │
        │  you run:  npm run deploy
        ▼
 FIREBASE (Google)  =  the live website + sign-in + the database
```

| Place | What lives there | If it is lost |
|---|---|---|
| **Your computer** | A working copy of the code, plus a private settings file called `.env`. | Not a problem if the code is saved to GitHub: download it again. |
| **GitHub** | The code and every earlier version of it. | You lose the history, and the code if no other copy exists. |
| **Firebase** | The live website, "Sign in with Google", the security rules, and the **database**: all the content and **every person's stories and progress**. | People lose their work. This is the part to protect. |

Two things surprise almost everyone:

1. **Saving to GitHub does not change the live site.** There is no automatic publishing. The live site changes only
   when you run `npm run deploy` yourself (step 7).
2. **Changing the code does not change anyone's content.** Flashcards, prompts, clients and invitations live in the
   database and are edited in the app's **Admin** tab, not in files.

### What you will and will not touch

Most day-to-day work is **content**, which needs no code at all (`docs/ADMIN-GUIDE.md`). Code changes are for new
features, new screens or fixes.

| Folder or file | What it is | Touch it? |
|---|---|---|
| `src/` | The app itself: every screen. | Yes, through your AI assistant. |
| `src/index.css` | Colours and fonts. | Yes. Easy and safe. |
| `src/tabs.ts` | The list of tabs. | Yes, through your AI assistant. |
| `AGENTS.md` | The briefing and rules your AI assistant reads at the start of every conversation. | Yes. Read it once; see step 6. |
| `docs/` | The guides, including this one. | Yes. Keep them true when things change. |
| `firestore.rules` | **Who may read and write what.** This is the app's security. | **Only with great care** (see step 6). |
| `rules-tests/` | Automatic checks for the rules. | Only together with the rules. |
| `firebase.json`, `.firebaserc` | Tell Firebase what to publish, and where. | Rarely. |
| `package.json` | The list of building blocks the app uses. | Only through your AI assistant, one at a time. |
| `seed/` | The *starting* content, copied into the database once. Editing it changes nothing on the live site. | Rarely. |
| `.env` | Your private link to the Firebase project. Never shared, never saved to GitHub. | Set up once. |
| `node_modules/`, `dist/`, `.firebase/` | Downloaded or generated. Safe to delete; they come back. | **Never edit.** |

## 2. Accounts you need

| Account | What for | How to check you have it |
|---|---|---|
| **A Google account with access to the Firebase project** | Publishing the site and rules, and using the Firebase console. | Go to <https://console.firebase.google.com>. You should see the project `study-suite-65822`. You need the **Owner** role (recommended) or **Editor**. |
| **A GitHub account** with permission to save to the project's repository | Keeping the code and its history safe. | Ask the previous owner to add you. See the handover checklist. |
| **An AI coding assistant** | Making the changes. See step 6. | Your own subscription. |
| **An admin login in the app itself** | Using the **Admin** tab on the live site. | An existing admin opens **Admin > People > Invite an admin** and types your Google email. |

## 3. Install the tools (once)

You need five things. Only the first three are required.

| Tool | Why | Required? | Where to get it |
|---|---|---|---|
| **Node.js** (the "LTS" version) | Runs everything. It includes `npm`, which downloads the building blocks. | Yes | <https://nodejs.org>. Click the **LTS** button and run the installer. |
| **Git** | Saves versions of the code and downloads it. | Yes | Windows: <https://git-scm.com/download/win>. Mac: nothing to download yet. Type `git --version` in Terminal; if it is missing, the Mac offers to install it. |
| **An AI coding assistant** | You tell it what you want; it changes the code. | Yes | See step 6. |
| **Java 21 or newer** | Only for the "safe practice mode" (the emulators) and the security-rule tests. | Optional | Mac with Homebrew: `brew install --cask temurin@21`. Windows or Mac without Homebrew: download "Temurin 21" from <https://adoptium.net>. |
| **A code editor** (for example [VS Code](https://code.visualstudio.com)) | Looking at files. Many AI assistants have one built in. | Optional | |

You do **not** install Firebase's tools. The commands in this guide download them automatically the first time
they are needed.

### The terminal in one minute

Every command in this guide is typed into the **terminal**: a window where you type instructions instead of clicking.
You type a command, press **Enter**, and wait until you can type again.

- **Open it.** Mac: press `Cmd + Space`, type `Terminal`, press Enter. Windows: press the Start key, type `cmd`, press
  Enter (this is **Command Prompt**). If you use PowerShell and it says "running scripts is disabled" when you type
  `npm`, use Command Prompt instead.
- **Open it in the project folder.** Commands only work when the terminal is "inside" the project folder.
  Mac: type `cd ` (with a space), drag the project folder from Finder into the Terminal window, press Enter.
  Windows: open the project folder in File Explorer, click the address bar, type `cmd`, press Enter. If you use an
  AI assistant or editor with a built-in terminal, it opens in the right folder for you.
- **Stop something that is running** (such as the app): click the terminal and press `Ctrl + C`.

### Check the install

Open a **new** terminal (one opened before installing will not see the new tools) and type these one at a time:

| Type | You should see |
|---|---|
| `node -v` | `v20.19` or higher. (This project was last run on `v24`.) |
| `npm -v` | Any number. |
| `git --version` | `git version ...` |
| `java -version` | Only if you installed Java: `21` or higher. |

If you see "command not found" or "is not recognized", the tool is not installed, or the terminal was opened too early.
Close it, open a new one, and try again.

## 4. Get the code and connect it

> **Note for the handover.** Ask the previous owner for the repository address **and the branch name**. When this guide
> was written, the finished app had not been uploaded to GitHub yet (see step 11). Delete this note once it is settled.

1. **Download the code.** In the terminal, from a folder where you keep projects:

   ```
   git clone <the repository address you were given>
   cd study-suite
   ```

   Git may ask you to sign in to GitHub. Follow the prompts, or ask your AI assistant to help.

2. **Download the building blocks** (about a minute, needs internet):

   ```
   npm install
   ```

   It ends with a warning such as "4 high severity vulnerabilities" and suggests `npm audit fix --force`.
   **Ignore that and never run it.** The warning is about a part of Firebase that is for servers and is not in the
   website. Running the "fix" would install a 2022 version of Firebase and break the app.

3. **Create your settings file.** `.env` tells the app which Firebase project to talk to.
   - Copy the template. Mac: `cp .env.example .env`. Windows: `copy .env.example .env`.
   - Open [Firebase console](https://console.firebase.google.com), choose the project, click the **gear icon >
     Project settings**, scroll to **Your apps**, and find the web app. Under **SDK setup and configuration**, copy
     each value into `.env` after the matching name: `apiKey` goes after `VITE_FIREBASE_API_KEY=`, `authDomain` after
     `VITE_FIREBASE_AUTH_DOMAIN=`, and so on for the six lines. Or ask the previous owner for their file.
   - These values identify the project; they are **not passwords**. Still, keep the file private. It is never saved
     to GitHub.
   - On a Mac, files starting with a dot are hidden in Finder. Press `Cmd + Shift + .` to show them.

4. **Log in to Firebase** (once per computer):

   ```
   npx firebase-tools login
   ```

   A browser window opens. Choose the Google account from step 2 and allow access.

`docs/SETUP-FIREBASE.md` has the same steps in more detail, plus how to set up a brand-new Firebase project from
nothing. You only need it if the old project is lost.

## 5. Run it on your computer

```
npm run dev
```

The terminal prints a line like `Local: http://localhost:5173/`. Open that address in your browser and click **Sign in
with Google**, using an account that has been invited. You should see the app, with a small **admin** badge if you
are an admin. When you edit a file, the page updates by itself within a second or two. Press `Ctrl + C` in the
terminal to stop it.

> **This uses the real database.** Anything you save while testing (a story, an invitation, a change in the Admin tab)
> is real and visible to real people. For anything that *writes* data, use safe practice mode below.

### Safe practice mode (needs Java)

A pretend Firebase runs on your computer, so nothing you do is real. You need **two terminals**, both in the project
folder.

| Terminal | Type | Leave it |
|---|---|---|
| 1 | `npm run emulators` | Running. Its control panel is <http://127.0.0.1:4000>. |
| 2 | `npm run dev:emulator` | Running. Open <http://localhost:5173>. A red bar at the bottom says "Running in emulator mode". |

The pretend Firebase **starts empty every time**, so each time you start it:

1. Open the control panel (<http://127.0.0.1:4000>), go to **Firestore**, and add a collection `invites` with a
   document whose ID is the email you will type, in lower case. Give it these fields: `role` (string) `admin`,
   `clientId` (string) `default`, `invitedBy` (string) `setup`, `createdAt` (timestamp) now.
2. In the app, **Sign in with Google**. A pretend Google window asks for any email address: type that one.
3. Open the **Admin** tab and click **Import starter data**, so there is something to practise with.

### The checks: your spell-check

These do not change anything. They look for mistakes.

| Command | What it checks | A good result |
|---|---|---|
| `npm run typecheck` | All the code, for mistakes such as a misspelled name. | Finishes with no `error` lines. |
| `npm run build` | The same check, then builds the finished website into `dist/`. | Ends with `built in ...`. |
| `npm run test:rules` | The security rules against a pretend database (needs Java). | Ends with `fail 0`. |
| `npm run preview` | Shows the finished build locally, as visitors would see it. | A page at the address it prints. |

Run `npm --prefix rules-tests install` once before the first `npm run test:rules`.

## 6. Changing the app with an AI assistant

This is how you will do nearly all development. An AI assistant that can read your project folder and run terminal
commands writes the code; your job is to ask clearly, check the result, and decide what goes live.

**Choose an assistant that can:** open a whole folder, edit files, run terminal commands, and **ask your permission
before running them** (turn that setting on if it is not the default). Examples are Cursor, Claude Code, OpenCode,
GitHub Copilot's agent mode and Codex. Any of them works with this project. Use the strongest model your plan offers
for anything risky.

### The assistant's briefing: `AGENTS.md`

An assistant starts every conversation knowing nothing about this project. The file `AGENTS.md` in the project
folder is its briefing. It says what the app is, which commands to run, which guides to read first, and, most
importantly, what it must **never** do without asking you (publish to the live site, delete data, change the
security rules, move to a paid plan, and so on).

- Cursor, OpenCode, Codex and most other assistants read `AGENTS.md` **automatically** at the start of every
  conversation. You do nothing.
- Claude Code reads a file called `CLAUDE.md` instead. Tell it at the start: *"Read AGENTS.md and follow it."* Or ask
  it to create a `CLAUDE.md` that says that.
- If an assistant seems to ignore the rules, say the same thing at the start of a new conversation.
- You can open `AGENTS.md` and read it. It is written in plain English. If your rules change (for example you decide
  an assistant may commit without asking), change it there, and ask the assistant to do it for you.

### The routine for every change

1. **Describe** what you want (see "Asking well" below). For anything that is not a tiny tweak, add *"First tell me
   your plan and wait for my OK."* Read the plan. If you do not understand part of it, ask.
2. **Let it make the change.** Approve the commands it asks to run if they look like the ones in this guide.
3. **Insist on the checks.** It should run `npm run typecheck` and `npm run build`, and tell you the result. If it
   changed the security rules, `npm run test:rules` too.
4. **Try it yourself** in the browser with `npm run dev` (or safe practice mode if the change writes data). Click
   through the screens the change could affect.
5. **Look at which files changed** (see "Checking work you cannot read").
6. **Save it.** Ask: *"Commit this with a clear message."* Do this after every change that works, so you can always
   get back to a working version.
7. **Put it live** when you are happy (step 7).

Make **one change at a time**. A small change that works is saved before the next one starts.

### Asking well

Say **what** you want, **where** in the app, and **what must not change**.

| Instead of | Say |
|---|---|
| "Make the flashcards better." | "On the Flashcards tab, show how many cards are left in the deck, under the card. Do not change anything else. Tell me your plan first." |
| "It's broken." | "On the Storycraft tab, after I click Save the story disappears. Here is the exact message from the terminal: ... What do you think is the cause? Do not change anything yet." |
| "Update everything." | "Run `npm outdated` and explain what is behind. Then update only the safe ones, one group at a time, running typecheck, build and test:rules after each." |
| "Add emails." | "I want invited people to get an email automatically. Explain what that would involve, what it would cost and what it would change in how the app is hosted. Do not build anything." |

Useful things to ask at any time:

- *"Explain in plain English what the app does when someone opens the Flashcards tab."*
- *"Explain what you just changed and why. What could it break?"*
- *"Which files did you change, and did you need to change each one?"*
- *"Show me how to check this by hand."*
- *"I got this error: (paste the whole message). Explain it simply and propose a fix."*

### Checking work you cannot read

You cannot judge the code, so rely on these instead:

- **The automatic checks** must pass: `npm run typecheck`, `npm run build`, and `npm run test:rules` for rule changes.
- **Your own click-through.** Before going live, in a browser:
  1. Sign in as an invited person. Open every tab. Write a story, master a flashcard, reload the page, and check both
     are still there.
  2. Sign in as an admin. Open every section of the Admin tab.
  3. Try an email that was **not** invited and check it is refused.
  4. Make the browser window narrow, like a phone, and look at what you changed.
- **Which files changed.** Ask the assistant to run `git status` and `git diff --stat`, or run them yourself. They
  list every file touched. A wording change should touch one or two files in `src/`. Be suspicious if you see
  `firestore.rules`, `package.json`, `firebase.json` or anything with `.env` in the name when you did not ask for it.
- **A second opinion.** Open a *new* conversation and ask: *"Review the uncommitted changes (git diff) for bugs and
  security problems, and explain what they do in plain English."* A fresh conversation is not biased by the first.

### How risky is the change?

| | Examples | What to do |
|---|---|---|
| **Low** | Wording, colours (`src/index.css`), content changes in the Admin tab, guides | The routine above. |
| **Medium** | A new tab or Admin section, a new list in the Admin, layout changes | The routine, and use safe practice mode for the click-through. |
| **High** | `firestore.rules`, sign-in, what is stored (`src/types.ts`, `src/data/`), upgrading building blocks, hosting settings in `firebase.json`, anything about who is an admin | Plan first. Rules tests must pass. Test in safe practice mode. Take a content backup first. Then consider paying an experienced developer for an hour to review before it goes live. That is cheap insurance. |

**Why the rules matter so much.** The app has no server of its own. The only thing stopping a stranger from reading
people's private stories is `firestore.rules`. A broken screen is embarrassing; a broken rule can expose private
writing. That is why `AGENTS.md` makes the assistant add tests for every rule change. Never let it "simplify" the
rules to make an error go away.

### Things AI assistants often get wrong here

- **Changing flashcards or prompts in `seed/` files.** That changes nothing live. Content is edited in the Admin tab.
  Worse, pressing **Import starter data** again replaces the live content with `seed/`, losing every edit made in the
  app, so never do that without a backup.
- **Forgetting that a change is not live until deployed.** Fixing the code does not fix the live site.
- **Editing `firestore.rules` and assuming it is in force.** The rules apply only after `npm run deploy:rules` (or a
  full `npm run deploy`).
- **Editing `.env` while the app is running.** Stop it with `Ctrl + C` and start it again to pick up the change.
- **Sending invitations from your computer.** The invitation message contains the address you are on, so an invitation
  made while running locally tells people to open `http://localhost:5173`. Make real invitations on the live site.
- **Suggesting Cloud Functions or "upgrade to the Blaze plan"** for things like sending emails. Both mean leaving the
  free plan and can cost money. Decide that yourself, not in the middle of a conversation.
- **Adding many new libraries.** The app deliberately uses very few (see "Principles" in `docs/DEVELOPER-GUIDE.md`).

### Saving your work (git in plain words)

| Word | Meaning |
|---|---|
| **Commit** | A save point with a label, such as "Change the sign-in wording". You can always return to one. |
| **Branch** | A separate copy of the project to try something in, so the main one is untouched. For anything larger than a small tweak, ask the assistant to *"create a new branch for this change"* first. |
| **Push** | Uploading your commits to GitHub, so they are backed up and shared. |

Ask the assistant to do all of these. Commit after every change that works, and push at least at the end of each day
you worked. Work that was never committed can be lost for good.

Pause and ask the assistant to explain first if it proposes a command containing `reset`, `restore`, `checkout .`,
`clean` or `--force`. They can permanently destroy work that was not committed.

## 7. Put a change on the live site (deploy)

"Deploying" means copying the finished website and the rules from your computer to Firebase, which makes them live.

### Before you deploy

- [ ] You tried the change in the browser (step 5) and the click-through passed.
- [ ] `npm run typecheck` and `npm run build` finish without errors.
- [ ] If the rules changed: `npm run test:rules` ends with `fail 0`.
- [ ] The change is committed, so you can get back to this version.
- [ ] `.env` exists in the project folder and points to the **real** project. The settings are built into the site, so
      a site deployed from a computer without `.env` shows "Firebase is not set up yet".
- [ ] You are logged in to Firebase (`npx firebase-tools login`).

### Deploy

```
npm run deploy
```

It checks the code, builds the site, then publishes the site, the security rules and the database indexes to project
`study-suite-65822`. It usually takes about a minute. If it worked, the last lines include **Deploy complete!** and a
**Hosting URL** of <https://study-suite-65822.web.app>.

If the build stops with an error, nothing was published: that is the safety check working. Copy the whole message to
your assistant (see step 9).

### Check it worked

1. Open <https://study-suite-65822.web.app> in a **private (incognito) window**. You should see the sign-in page.
2. Sign in as an admin, open a few tabs and the **Admin** tab.
3. Look at the thing you changed.

People who already had the app open keep the old version until they reload. Nothing is lost for them. Their stories
are in the database, not in the site.

### Other ways to deploy

| I want to... | Type |
|---|---|
| Publish only the security rules | `npm run deploy:rules` |
| Publish only the website | `npx firebase-tools deploy --only hosting` |
| Try the website on a temporary address first, for one day | `npx firebase-tools hosting:channel:deploy preview --expires 1d` |

A preview address uses the **same real database** as the live site. It is for checking how a screen looks, not a place
to test things that write data (use safe practice mode for that).

### Undo a deploy (roll back)

If the live site is broken after a deploy:

1. Open the [Firebase console](https://console.firebase.google.com), choose the project, go to **Hosting**.
2. Find the **release history**, click the menu (three dots) on the last release that worked, and choose **Rollback**.
   It takes effect within moments.
3. For a bad rules change: **Firestore Database > Rules** has its own history, where you can go back to an earlier
   version.

Rolling back the website does not undo changes already made to people's data.

If Firebase ever asks you to **upgrade to a paid plan** (called "Blaze") to deploy, stop and ask for help. The
app is designed to need only the free plan.

## 8. Routine care

| When | What | How |
|---|---|---|
| Before any big change, and once a month | **Download a content backup** and keep it somewhere outside your laptop (a cloud drive). | App: **Admin > Import & backup > Download a backup**. |
| After each working change | Commit, and push to GitHub. | Ask your assistant. |
| Monthly | Check you are far from the free limits. | Firebase console > **Firestore Database > Usage**. The limit is 50,000 reads a day; opening the app uses about 60. |
| When someone joins or leaves the team | Add or remove admins. | App: **Admin > People**. Firebase console: **Project settings > Users and permissions**. |
| Two or three times a year | Update the building blocks. | Ask your assistant to follow "Updating the building blocks" in `docs/DEVELOPER-GUIDE.md`. If everything works, there is no urgency. |

**What a backup does not cover:** the backup file holds **content only** (shared library and clients). It does **not**
hold people's stories and progress, and the free plan has no automatic database backups. That is a known limit of the
current set-up (`docs/DEVELOPER-GUIDE.md`, "Known limits").

## 9. When something goes wrong

First, **do not panic and do not keep retrying the same thing**. Read the message; most explain themselves. If you are
stuck after two or three attempts, stop, and use the last row of this table.

| What you see | What it means and what to do |
|---|---|
| `command not found: npm` or `'npm' is not recognized` | Node.js is not installed, or the terminal was opened before installing. Install it (step 3), open a **new** terminal, and check `node -v`. |
| `npm install` ends with "4 high severity vulnerabilities" | Expected. Ignore it. **Never** run `npm audit fix --force`. |
| The page says **"Firebase is not set up yet"** | `.env` is missing, empty, or misnamed (it must be exactly `.env`, not `.env.txt`). After editing it, stop and restart `npm run dev`. On the **live** site: the site was built without `.env`; create it and run `npm run deploy` again. |
| "This account has not been invited" | That email has no invitation. An admin invites it in **Admin > People**. For the first admin or a lock-out, see `docs/SETUP-FIREBASE.md`, step 5. In safe practice mode, add the invite by hand (step 5 above). |
| The Google sign-in window does not appear | The browser blocked the pop-up. Allow pop-ups for the address. |
| "This web address is not approved for sign-in" | Add the address in the Firebase console under **Authentication > Settings > Authorized domains**. |
| `npm run typecheck` or `build` shows `error TS...` | The checker found a mistake in the code. Copy the **whole** message to your assistant: *"Fix this error. Change as little as possible."* |
| `npm run deploy` says "Failed to authenticate" or "credentials are no longer valid" | Type `npx firebase-tools login` again and re-run. |
| `npm run deploy` says "permission denied" or "403" | Your Google account is not an Owner or Editor of the project. The owner adds you under **Project settings > Users and permissions**. |
| The emulators will not start and mention Java | Install Java 21 or newer (step 3), open a **new** terminal, and try again. |
| The emulators complain a **port** is busy | Another program, or an earlier emulator you forgot to stop, is using it. Close that terminal, or restart the computer. |
| The live site still looks old after deploying | Reload the page. Tabs that were open before keep the old version until reloaded. |
| The live site is broken right after a deploy | Roll back (step 7), then ask your assistant to find the cause on your computer. |
| The AI has made a mess | Stop. Ask it to run `git status` and `git diff --stat` and explain what is different. If you want to throw away everything since your last commit, tell it so explicitly. That is permanent. Then start a **new conversation** and tell it to read `AGENTS.md`. |
| The AI keeps going round in circles | Start a new conversation. Tell it to read `AGENTS.md`, then give it the exact error text, what you want, and what you already tried. If it still fails, get human help. |

**Getting a human developer to help.** Give them: this guide, the repository address, the Firebase project name
(`study-suite-65822`), a clear description of what you want or what went wrong, and any exact error message. Ask
them to read `docs/DEVELOPER-GUIDE.md` first. It is written for them.

## 10. Glossary

| Word | In plain English |
|---|---|
| **Terminal** | The window where you type commands. |
| **Node.js** | The program that runs the project's tools. Installed once. |
| **npm** | Comes with Node. Downloads the building blocks and runs the project's commands (`npm run ...`). |
| **Dependency / building block** | Ready-made code written by others that the app uses, such as React or Firebase. Listed in `package.json`. |
| **React, TypeScript, Vite, Tailwind** | The technologies the app is made with. Your assistant knows them; you do not need to. |
| **Type check** | A spell-check for code. It finds many mistakes without running the app. |
| **Build** | Turning the code into the finished website files, in the `dist` folder. |
| **Deploy** | Publishing the build and the rules to Firebase, so they are live. |
| **Production / live** | The real site that real people use. |
| **Localhost** | Your own computer. `http://localhost:5173` is the app running on it, visible only to you. |
| **Firebase** | The Google service that provides the website hosting, sign-in and database. |
| **Firestore** | Firebase's database: where content, people and their stories are stored. |
| **Security rules** | The file (`firestore.rules`) that says who may read or write what in the database. |
| **Emulator / safe practice mode** | A pretend Firebase on your computer, so you can test without touching real data. |
| **Console** | Firebase's website for managing the project: <https://console.firebase.google.com>. |
| **`.env`** | Your private settings file connecting the app to the project. |
| **Git, repository, commit, branch, push** | The system that saves versions of the code. See "Saving your work". |
| **GitHub** | The website that stores the repository online. |
| **Client** | In this app, a coaching client's own set of prompts, scenarios and cards. Not a computer program. |

## 11. Handover checklist (for the person handing over)

Work through this before you step away, ideally with the new owner watching.

**Code (the most urgent item)**

- [ ] **Move the finished app somewhere the new owner controls.** When this was written, all of the React and Firebase
      version (about 15 saved versions) existed only on one laptop, on the branch `feature/react-firebase-migration`.
      GitHub had only the **old** single-page site on `main`, in a repository owned by another person (`rkillen`), and
      the GitHub account used on that laptop had read-only access to it. Choose one: (a) the owner of that repository
      gives upload access to whoever holds the finished code and to the new owner; or (b) create a new repository in
      the new owner's account and upload everything there.
- [ ] **Do not simply merge the new code into `main` of `rkillen/study-suite`.** That repository's `main` branch is
      also the old site at <https://rkillen.github.io/study-suite/> (GitHub Pages publishes it from the top folder).
      The new `index.html` only works after a build, so merging would break the old page. Decide first whether the old
      page should stay, move or be switched off. People who used it can still export their old stories there.
- [ ] There is an uncommitted file, `opencode.json`, which sets up a browser-testing tool for one AI assistant. Commit
      it or delete it.
- [ ] Update the note in step 4 with the real repository address and branch, then delete it.

**Accounts and access**

- [ ] Add the new owner as **Owner** in the Firebase console: **Project settings > Users and permissions**.
- [ ] Add the new owner as an **admin in the app**: **Admin > People > Invite an admin**. Check they can sign in.
- [ ] Give the new owner access to the GitHub repository.
- [ ] Decide whether you stay on as an admin or are switched off (**Admin > People**).
- [ ] If the site ever gets its own web address, record who controls it and where it is set up.

**Safety net**

- [ ] **Download a content backup** (**Admin > Import & backup**) and put a copy somewhere the new owner can reach.
- [ ] Give the new owner the six `.env` values, or show them where to find them (step 4).

**Practice run**

- [ ] The new owner follows steps 3 to 5 on their **own** computer, from a fresh download of the code, until the app
      runs and they can sign in.
- [ ] Together, make one tiny harmless change with the AI assistant (for example a word on the sign-in screen), and
      deploy it to a one-day preview (step 7, "Other ways to deploy"). Then check it and let it expire.

## Where to go next

| Guide | For |
|---|---|
| `README.md` | The overview and the list of commands. |
| `docs/ADMIN-GUIDE.md` | Running the site day to day: clients, people, content and backups. No code. |
| `docs/SETUP-FIREBASE.md` | Setting Firebase up from scratch, and sign-in problems. |
| `docs/DEVELOPER-GUIDE.md` | How the code fits together, the security rules, and deploying. Written for developers; your assistant should read it. |
| `docs/DATA-MODEL.md` | What is stored where. |
