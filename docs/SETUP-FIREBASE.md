# Setting up Firebase

Firebase is the free Google service that stores the data and handles "Sign in with Google".
Most of this is done once. Do the parts in order.

> You are the site owner if you created the Firebase project. The project used here is called
> `study-suite-65822` (the name is saved in the file `.firebaserc`).

## What you need

- A computer with [Node.js](https://nodejs.org) (version 20.19 or newer; the "LTS" download is fine).
- The Google account that owns the Firebase project.
- A terminal (on a Mac: the "Terminal" app).

All commands below are typed in the terminal, inside the project folder.

## 1. Connect the app to your project

1. Install the building blocks (once): `npm install`
2. Copy the file `.env.example` to a new file called `.env`.
3. Open the [Firebase console](https://console.firebase.google.com), choose your project, click the gear
   icon, **Project settings**, scroll to **Your apps**, and find the web app. Copy each value from
   "SDK setup and configuration" into `.env`.

`.env` identifies your project. It is not a password, but it is private to your computer and is never
saved to GitHub (the file `.gitignore` makes sure of that).

If `.env` is missing or empty, the app opens a "Firebase is not set up yet" page instead of crashing.

## 2. Check the sign-in settings

In the Firebase console, open **Build > Authentication > Sign-in method**:

- **Google** must be **Enabled**.
- **Email/Password** must be **Disabled**. (Everyone signs in with Google, and nothing else.)

Then open **Authentication > Settings > User actions** and make sure **Enable create (sign-up)** is
**ticked**, and save. This looks like it should be off for a private site, but it must be on: Firebase
creates an account record the first time someone signs in with Google, and with this switched off every
first sign-in fails with `auth/admin-restricted-operation`.

Being invited is checked separately, in our own database and rules (steps 4 and 5). A stranger who tries
to sign in ends up with an empty account record under **Authentication > Users**, but no access to any
data, and the app signs them straight out. You can delete such records there whenever you like.

Under **Authentication > Settings > Authorized domains**, make sure these are listed. They are by default:

- `localhost` (for working on your computer)
- `study-suite-65822.web.app` and `study-suite-65822.firebaseapp.com` (the live site)

If you later use your own web address, add it here, otherwise sign-in fails with "not approved".

## 3. Log in to Firebase from the terminal (once)

```
npx firebase-tools login
```

A browser window opens. Choose the Google account that owns the project and allow access. The terminal
then remembers you.

## 4. Publish the security rules

The rules (in `firestore.rules`) are what keep each person's work private and let only admins change
content. Until you publish them, the database stays locked, which is safe but means nobody can sign in.

```
npm run deploy:rules
```

Run this again whenever `firestore.rules` changes.

## 5. Invite yourself as the first admin

Only people on the guest list can sign in, so the very first admin has to be added by hand. After that,
admins invite everyone else from inside the app.

1. In the Firebase console open **Build > Firestore Database > Data**.
2. Click **Start collection**. Collection ID: `invites`. Click **Next**.
3. **Document ID:** your Google email address, all lower case, for example `you@gmail.com`.
4. Add these fields (Type is shown in brackets):

   | Field | Type | Value |
   |---|---|---|
   | `role` | string | `admin` |
   | `clientId` | string | `default` |
   | `invitedBy` | string | `setup` |
   | `createdAt` | timestamp | now (pick today's date and time) |

5. Click **Save**.

## 6. Try it

```
npm run dev
```

Open <http://localhost:5173>, click **Sign in with Google**, and choose the invited account. You should
see the app with a small **admin** badge at the top. The first sign-in turns the invitation into your
profile (document `users/<your id>`).

Signing in with an account that has no invitation shows "This account has not been invited" and signs it
straight back out.

## Trying things safely: the emulators

The emulators are a pretend Firebase that runs on your computer, so you can test sign-in, rules and
invitations without touching real data.

**One-off:** the emulators need Java 21 or newer. On a Mac with Homebrew: `brew install --cask temurin@21`.
On Windows, download "Temurin 21" from <https://adoptium.net>. (Normal work on the app does not need Java.)

Then use two terminals:

```
npm run emulators        # terminal 1: the pretend Firebase (its control panel is http://127.0.0.1:4000)
npm run dev:emulator     # terminal 2: the app, connected to it
```

In the emulator, "Sign in with Google" opens a pretend Google window where you type any email address.
To let that email in, add a document `invites/<that email>` in the control panel's Firestore tab, with the
same fields as in step 5.

A red bar at the bottom of the page ("Running in emulator mode") shows you are on the pretend Firebase.

Before changing `firestore.rules`, run the safety tests:

```
npm run test:rules
```

See `rules-tests/README.md`.

## Problems

| What you see | What it means |
|---|---|
| "Firebase is not set up yet" | `.env` is missing or empty (step 1). |
| "This account has not been invited" | That email has no document in `invites` (step 5), or it was typed with capital letters. |
| "Could not check your access" | No internet, or the rules were not published (step 4). |
| "This web address is not approved for sign-in" | Add the address under Authorized domains (step 2). |
| "New sign-ins are switched off in Firebase" (`auth/admin-restricted-operation`) | Tick **Enable create (sign-up)** under Authentication > Settings > User actions (step 2). |
| "Google sign-in is not switched on" (`auth/operation-not-allowed`) | Enable the **Google** provider under Authentication > Sign-in method (step 2). |
| The sign-in window does not appear | The browser blocked the pop-up. Allow pop-ups for the site. |
| `Port 8080 is not open` or similar when starting emulators | Another program uses that port. The ports are set in `firebase.json`. |
| `npm audit` warns about `@grpc/grpc-js` | Harmless here: that part of Firebase is for servers and is not included in the website. Do **not** run `npm audit fix --force`; it would install a 2022 version of Firebase. |
