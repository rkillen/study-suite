# Admin guide

For the person who runs Study Suite: who invites clients, keeps the content up to date and checks in on how
people are getting on. You do not need to write any code. Everything here happens in the app, in the
**Admin** tab.

The live site is **<https://study-suite-65822.web.app>**.

## The short version

- Only people you invite can sign in, and only with the Google account you invited.
- Each person sees one **client**: that client's focus points, scenarios and personal flashcards, plus the
  shared words, questions and cards everyone gets.
- You can read every person's stories and progress. You can never change or delete them. People are told
  this on the sign-in screen and at the bottom of every page ("Your facilitator can read your stories and
  progress.").
- Changes you make to content are saved at once. People see them the next time they open or reload the app.
- Nothing you do in the Admin tab can lose anyone's stories. The biggest actions (replacing lists, importing)
  show you a preview first and ask you to confirm.

## Signing in as admin

Open the site and click **Sign in with Google**, using the account that was set up as admin. You will see a
small **admin** badge at the top and an **Admin** tab. Nobody else sees that tab.

The Admin tab has four sections: **Shared content**, **Clients**, **People** and **Import & backup**.

## Jobs you will do often

### Bring on a new client

1. **Admin > Clients > Add client.**
2. Type the client's **Name** (for example `Ana`, or `Swiss CRO`). The **Short id** under it is made for you.
   It is used inside the database and **cannot be changed later**, but the name can.
3. Under **Start from**, choose **Nothing: an empty client**, or **A copy of** an existing client to begin
   with their watch-outs, scenarios, personal cards and extra words. A copy is completely independent: you can
   change it without touching the original.
4. Under **Invite their person**, type the client's **Google email address** to invite them straight away (you
   can also do this later).
5. Click **Create client**.
6. A box appears with a message to send, such as: *"Hello! You are invited to Study Suite. Open
   https://study-suite-65822.web.app and click 'Sign in with Google', using the Google account ana@example.com."*
   Click **Copy message** and send it yourself, by email or chat. The app does not send emails.

A client with no watch-outs or no scenarios of their own automatically shows the ones from the **default**
client, and the screen tells you so. Keep **default** filled in.

**About the email address:** the person must sign in with a Google account that uses that exact address. A
Gmail address always works. For a work or other address, they need a Google account that uses it (Google
Workspace does; otherwise they can create a Google account with their existing address). If they sign in
with a different Google account, they see "This account has not been invited". Nothing breaks, and they can
try again with the right one.

### Invite many people at once

1. **Admin > People > Invite many people.**
2. Paste one person per line: the email, a comma, then the client (its short id, or its exact name):

   ```
   ana@example.com, morocco
   ben@example.com, Swiss CRO
   ```

3. Click **Preview the invitations**. Every line is checked, and a line that cannot be invited says why
   ("this person already has an account", "there is no client called ...", "does not look like an email
   address"). Nothing is saved yet.
4. Click **Invite N people**, then **Copy message** and send it to them.

Tips: up to 200 lines at a time; lines starting with `#` and blank lines are ignored; the list **For lines with
no client** lets you pick one client for lines that have only an email.

### See how people are getting on

**Admin > People** lists everyone, one card each, with when they were **last active** and how many **stories,
jots and cards mastered** they have.

- **Search** looks at email, name and client.
- **Show** filters to *Signed in*, *Invited* (has not signed in yet) or *Access switched off*.
- **Sort by > Longest quiet first** shows who has gone quiet, which is the quickest way to know whom to nudge.
- *Last active* means the last time they saved something: a story (new, edited or deleted), a jot or a mastered
  card. Just opening the app does not count.

### Read someone's stories

On a person's card click **View work**. You see their stories, newest first (click one to read all of it) and,
under **Beachcombing jots**, their jots. **Load 25 more** shows older ones. It is strictly read-only: there is
no button that changes anything of theirs, and the database would refuse it if there were.

### Move someone to another client

On their card click **Move to another client**, choose the client, click **Move**. It works even before they
have signed in. They see the new client the next time they open the app, and keep all their own work.

### Switch someone's access off, and back on

- **Switch off access** (on the card of someone who has signed in) asks you to confirm. Afterwards the app
  tells them "Access has ended", **even if they have it open right now**. Everything they wrote is kept.
- **Restore access** gives them back the same role they had, so an admin you switch off and on again is
  still an admin.
- You cannot switch off yourself, and the app refuses to switch off the last admin, so it is never left
  without one.
- For someone who has been invited but has not signed in yet, the button is **Cancel invitation** instead.

### Invite another admin

**Admin > People > Invite an admin**, type their email, and confirm. Admins can read everyone's stories,
change all content and invite or switch off anyone, so only invite people you trust with that.

### Change the shared content

**Admin > Shared content** holds what every client gets:

- **Beachcombing words**, in three tiers (1 concrete, 2 scenes, 3 abstract)
- **Pre-Outlining questions**
- **Story prompts**
- **Flashcards**: Oxford B2, phrasal verbs, idioms & metaphors, and interview questions

Pick a list, then use the search box, **Add** (for example **Add word**), **Edit** and **Delete**. The word, question and prompt
lists also have **Add several**: paste one item per line. Deleting always asks first.

Flashcards are remembered by people's progress, so *editing* a card keeps everyone's progress on it, while
*deleting* a card removes it from everyone's decks.

### Change one client's content

**Admin > Clients**, pick the client from the list. You can rename them, and edit their:

- **Watch-outs**: the "things to watch out for" on their Overview. Three are shown at a time, picked at random.
- **Scenarios**: the Speaking Arena situations. Use the arrows to set the order.
- **Personal cards**: their own "Personal Focus" flashcard deck. Use the arrows to set the order they start in.
- **Own words**: extra Beachcombing words, shown before the shared ones.

Below that are **People** (who is attached to this client, with the same actions as above) and, at the very
bottom, **Delete client**. A client can only be deleted when nobody is in it (the screen names anyone who is),
and **default** cannot be deleted.

### Look at the app as a client sees it

While signed in as admin, add `?client=` and the client's id to the address, for example
`https://study-suite-65822.web.app/?client=morocco`. You see that client's watch-outs, scenarios and cards.
Anything you write while previewing (a story, a mastered card) is saved under your own account, never the
client's.

### Import from AppSheet

**Admin > Import & backup > Import AppSheet CSVs.** Choose the **Prompts CSV** (and, if you have it, the
**Categories CSV**, which gives the cards their tags), then **Preview the import**. The preview shows each list
with how many items it has now and how many it would have, and how many rows were skipped. Only after you click
**Yes, replace these lists** is anything changed.

- It only replaces the lists the file has something for. A file with only questions replaces only the questions.
- Interview flashcards, story prompts and every client are never touched by this import.
- Open "Which AppSheet categories go where?" on that screen for the exact rules. If AppSheet's categories change,
  ask your developer to update them (it is one short list in the code).

### Back up the content

**Admin > Import & backup > Download a backup** saves all the content (the shared library and every client) as
one file. **Make one before any big change**: a CSV import, a clean-up, deleting a client. To undo, use **Restore
from a backup file**: it shows what is in the file and asks first. A backup holds content only. It does not
hold people's stories or progress.

> The **Starter content** card on that screen is for the very first set-up (its button is **Import starter data**).
> Once content exists the button reads **Import again…**: it replaces the shared library and the starter clients
> with the original versions and loses any edits made in the app, so it asks you to confirm.

## What people see

- **Signed-out:** only the sign-in screen, which says access is by invitation and that you can read their work.
- **Signed in:** six tabs (Overview, Beachcombing, Pre-Outlining, Storycraft, Speaking Arena, Flashcards) for
  their client. Their stories, jots and flashcard progress are saved in the database, so they follow them to
  any device.
- **Storycraft** has **Export Journal (.md)** and **Export (.json)**, so people can keep their own copy.
- **Not invited, or switched off:** a plain message ("This account has not been invited" / "Access has ended").

### People who used the old page

The old single-page version is still online at <https://rkillen.github.io/study-suite/>. Whatever someone
wrote there is stored in *their own browser* on that page, so it is not in the new app and cannot be moved over
automatically. People who want to keep old stories should open the old page, use **Export Journal (.md)**
there, and paste the stories they want into the new Storycraft.

## Good to know

- **Two admins editing the same list at the same moment** can overwrite each other (the whole list is saved
  back). That is unlikely with a small team. If you work as a pair, agree who edits what.
- **Invitations are used up at first sign-in.** After that the person has an account, so changes go through
  *People* (move, switch off), not by inviting again.
- **A client normally has one person.** Inviting a second shows a warning and needs **Invite anyway**.
- **Email addresses** are stored in lower case, so capitals never matter.
- **Free plan.** The site runs on Firebase's free plan, which is plenty for about 50 clients (the main limit is
  50,000 database reads a day, and opening the app uses roughly 60). If a limit were ever passed, that part of
  the app would pause until the limit resets (the database limits reset every day, website downloads every
  month) rather than charging you. Nothing is lost.
- **Removing someone's data completely** (for example if they ask) is deliberately not a button: no admin action
  deletes anyone's work (people can delete their own stories, admins cannot). Switching access off keeps
  everything. Your developer can erase a person fully: see "Erasing a person" in `docs/DEVELOPER-GUIDE.md`.

## When something looks wrong

| What you see | What to do |
|---|---|
| Someone says "This account has not been invited" | They signed in with a different Google account than the one you invited. Check the address in **People** and tell them which to use. |
| "Access has ended" | You (or another admin) switched them off. **People > Restore access**. |
| Someone invited but cannot be found in the list | Search for the email. If they are not there, the invitation was not saved: invite again and read any message under the form. |
| A change you made is not showing for a client | Ask them to reload the page. Content is loaded when the app opens. |
| A list shows "Could not save" | Usually no internet, or your admin access was switched off. Reload and try again. |
| The whole site shows an error after an update | Reload the page. If it persists, tell your developer. A bad update can be rolled back quickly (see the developer guide). |
| "Could not load" or all admin lists fail | Check your connection. If it persists, a free limit may have been reached (see "Free plan" above). |

If you are ever unsure, **download a backup first**, then try.
