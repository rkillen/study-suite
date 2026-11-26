# Security rule tests

These tests check `firestore.rules` against a pretend database: who can read and write what.
They are the safety net for the most important file in the project. **Run them before publishing any
change to the rules.**

From the project folder (not this one):

```
npm --prefix rules-tests install    # once
npm run test:rules
```

You need Java 21 or newer once (see `docs/SETUP-FIREBASE.md`, "Trying things safely"). The command
starts the Firestore emulator, runs the tests, and stops it again. A healthy run ends with `fail 0`.

This folder has its own `package.json` so the testing tools never become part of the app.

## What is checked

- Signed-out people, and people with an unverified email, can do nothing.
- Invitations: you can read only your own, only admins can list, create or delete them.
- First sign-in: your profile can be created only if it matches your invitation (role, client, email),
  has no extra fields, and a real timestamp.
- Profiles: nobody can change their own role or client (or the note about their role before access was switched off), or delete a profile. Admins can change roles and switch access off and on. Someone switched off can still see their own profile and nothing else.
- Stories, jots and progress: the owner can read and write, admins can only read (including newest-first, a page at a
  time), other people and revoked people cannot touch them.
- Shared content: everyone invited can read, only admins can write.
- Client profiles: people see their own client and the default one; admins see, edit and delete all.
- Anything not mentioned is closed.

## Adding a test

Open `rules.test.mjs`. Each test is a short sentence plus one or two lines such as
`await assertFails(setDoc(doc(alice(), "users/alice"), { role: "admin" }))`. The people used in the tests
(`admin`, `alice`, `bob`, a revoked `gone`) are set up at the top of the file.

When you add a new rule to `firestore.rules`, add a test that the right person **can** do it and a test
that the wrong person **cannot**.
