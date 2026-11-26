import { readFileSync } from "node:fs";
import { after, before, beforeEach, describe, it } from "node:test";
import { assertFails, assertSucceeds, initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { collection, deleteDoc, deleteField, doc, getDoc, getDocs, limit, orderBy, query, serverTimestamp, setDoc, setLogLevel, updateDoc } from "firebase/firestore";

// Refused writes are expected in these tests; keep the output readable.
setLogLevel("silent");

// Checks firestore.rules against a fake database. Run with "npm run test:rules" from the project root.

let env;

before(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-study-suite",
    firestore: { rules: readFileSync(new URL("../firestore.rules", import.meta.url), "utf8") },
  });
});
after(() => env.cleanup());

const profile = (email, role, clientId) => ({
  email,
  displayName: "",
  role,
  clientId,
  createdAt: new Date("2026-01-01"),
  lastActiveAt: new Date("2026-01-01"),
  storyCount: 0,
  jotCount: 0,
  masteredCount: 0,
});

// A signed-in person. Pass verified=false for an unverified email.
const as = (uid, email, verified = true) =>
  env.authenticatedContext(uid, { email, email_verified: verified }).firestore();
const signedOut = () => env.unauthenticatedContext().firestore();

const admin = () => as("admin1", "admin@x.com");
const alice = () => as("alice", "alice@x.com");
const bob = () => as("bob", "bob@x.com");

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, "users/admin1"), profile("admin@x.com", "admin", "default"));
    await setDoc(doc(db, "users/alice"), profile("alice@x.com", "user", "morocco"));
    await setDoc(doc(db, "users/bob"), profile("bob@x.com", "user", "sauna"));
    await setDoc(doc(db, "users/gone"), profile("gone@x.com", "revoked", "morocco"));
    await setDoc(doc(db, "users/alice/stories/s1"), { title: "Alice story", body: "text" });
    await setDoc(doc(db, "users/bob/stories/s2"), { title: "Bob story", body: "text" });
    await setDoc(doc(db, "users/alice/jots/j1"), { word: "Lantern", text: "x" });
    await setDoc(doc(db, "users/alice/progress/state"), { masteredIds: [] });
    await setDoc(doc(db, "users/gone/stories/s3"), { title: "Gone story", body: "text" });
    await setDoc(doc(db, "library/beachcombing"), { tier1: ["Lantern"] });
    await setDoc(doc(db, "flashcards/oxford_1"), { cards: [] });
    await setDoc(doc(db, "clients/default"), { profileName: "Default" });
    await setDoc(doc(db, "clients/morocco"), { profileName: "Morocco" });
    await setDoc(doc(db, "clients/morocco/watchOuts/w1"), { title: "Watch out" });
    await setDoc(doc(db, "clients/sauna"), { profileName: "Sauna" });
    await setDoc(doc(db, "clients/sauna/watchOuts/w2"), { title: "Sauna watch out" });
    await setDoc(doc(db, "invites/alice@x.com"), { role: "user", clientId: "morocco" });
    await setDoc(doc(db, "invites/newbie@x.com"), { role: "user", clientId: "sauna" });
    await setDoc(doc(db, "invites/boss@x.com"), { role: "admin", clientId: "default" });
  });
});

describe("signed out, or email not verified", () => {
  it("cannot read anything", async () => {
    const db = signedOut();
    await assertFails(getDoc(doc(db, "library/beachcombing")));
    await assertFails(getDoc(doc(db, "users/alice")));
    await assertFails(getDoc(doc(db, "invites/alice@x.com")));
    await assertFails(getDoc(doc(db, "clients/default")));
  });

  it("an unverified email gets no access even with a profile", async () => {
    const db = as("alice", "alice@x.com", false);
    await assertFails(getDoc(doc(db, "library/beachcombing")));
    await assertFails(getDoc(doc(db, "users/alice/stories/s1")));
  });
});

describe("invites", () => {
  it("a person can read their own invite", async () => {
    await assertSucceeds(getDoc(doc(as("newbie", "newbie@x.com"), "invites/newbie@x.com")));
  });

  it("the lookup is not case sensitive", async () => {
    await assertSucceeds(getDoc(doc(as("newbie", "NewBie@X.com"), "invites/newbie@x.com")));
  });

  it("a person cannot read someone else's invite or list invites", async () => {
    await assertFails(getDoc(doc(bob(), "invites/alice@x.com")));
    await assertFails(getDocs(collection(bob(), "invites")));
  });

  it("a person cannot create, change or delete invites", async () => {
    await assertFails(setDoc(doc(alice(), "invites/friend@x.com"), { role: "user", clientId: "morocco" }));
    await assertFails(setDoc(doc(alice(), "invites/alice@x.com"), { role: "admin", clientId: "morocco" }));
    await assertFails(deleteDoc(doc(alice(), "invites/alice@x.com")));
  });

  it("an admin can move an invitation to another client; a person cannot", async () => {
    await assertSucceeds(updateDoc(doc(admin(), "invites/alice@x.com"), { clientId: "sauna" }));
    await assertFails(updateDoc(doc(alice(), "invites/alice@x.com"), { clientId: "sauna" }));
  });

  it("an admin can list, create and delete invites", async () => {
    await assertSucceeds(getDocs(collection(admin(), "invites")));
    await assertSucceeds(setDoc(doc(admin(), "invites/friend@x.com"), { role: "user", clientId: "morocco" }));
    await assertSucceeds(deleteDoc(doc(admin(), "invites/friend@x.com")));
  });
});

describe("first sign-in: creating your own profile", () => {
  const fresh = (overrides = {}) => ({
    email: "newbie@x.com",
    displayName: "New Person",
    role: "user",
    clientId: "sauna",
    createdAt: serverTimestamp(),
    lastActiveAt: serverTimestamp(),
    storyCount: 0,
    jotCount: 0,
    masteredCount: 0,
    ...overrides,
  });
  const newbie = () => as("newbie", "newbie@x.com");

  it("works when it matches the invite", async () => {
    await assertSucceeds(setDoc(doc(newbie(), "users/newbie"), fresh()));
  });

  it("is refused without an invite", async () => {
    const db = as("stranger", "stranger@x.com");
    await assertFails(setDoc(doc(db, "users/stranger"), fresh({ email: "stranger@x.com" })));
  });

  it("is refused if you claim a role other than your invite's", async () => {
    await assertFails(setDoc(doc(newbie(), "users/newbie"), fresh({ role: "admin" })));
  });

  it("is refused if you claim another client", async () => {
    await assertFails(setDoc(doc(newbie(), "users/newbie"), fresh({ clientId: "morocco" })));
  });

  it("is refused for someone else's uid", async () => {
    await assertFails(setDoc(doc(newbie(), "users/someone-else"), fresh()));
  });

  it("is refused with a different email than your own", async () => {
    await assertFails(setDoc(doc(newbie(), "users/newbie"), fresh({ email: "alice@x.com" })));
  });

  it("is refused with extra fields", async () => {
    await assertFails(setDoc(doc(newbie(), "users/newbie"), fresh({ isSuperAdmin: true })));
  });

  it("is refused with a made-up creation time", async () => {
    await assertFails(setDoc(doc(newbie(), "users/newbie"), fresh({ createdAt: new Date("2020-01-01") })));
  });

  it("an invited admin gets the admin role", async () => {
    const db = as("boss", "boss@x.com");
    await assertSucceeds(setDoc(doc(db, "users/boss"), fresh({ email: "boss@x.com", role: "admin", clientId: "default" })));
  });

  it("an existing profile cannot be re-created with a new role", async () => {
    await assertFails(
      setDoc(doc(alice(), "users/alice"), fresh({ email: "alice@x.com", role: "admin", clientId: "morocco" }))
    );
  });
});

describe("profiles", () => {
  it("you can read your own profile, even after access was revoked", async () => {
    await assertSucceeds(getDoc(doc(alice(), "users/alice")));
    await assertSucceeds(getDoc(doc(as("gone", "gone@x.com"), "users/gone")));
  });

  it("you can check that you have no profile yet", async () => {
    await assertSucceeds(getDoc(doc(as("newbie", "newbie@x.com"), "users/newbie")));
  });

  it("you cannot read or list other profiles", async () => {
    await assertFails(getDoc(doc(alice(), "users/bob")));
    await assertFails(getDocs(collection(alice(), "users")));
  });

  it("you can update your activity fields", async () => {
    await assertSucceeds(updateDoc(doc(alice(), "users/alice"), { storyCount: 3, jotCount: 5, masteredCount: 2, lastActiveAt: serverTimestamp() }));
  });

  it("you cannot make yourself an admin or change your client", async () => {
    await assertFails(updateDoc(doc(alice(), "users/alice"), { role: "admin" }));
    await assertFails(updateDoc(doc(alice(), "users/alice"), { clientId: "sauna" }));
    await assertFails(updateDoc(doc(alice(), "users/alice"), { email: "other@x.com" }));
  });

  it("you cannot delete your profile", async () => {
    await assertFails(deleteDoc(doc(alice(), "users/alice")));
  });

  it("a revoked person cannot update their profile", async () => {
    await assertFails(updateDoc(doc(as("gone", "gone@x.com"), "users/gone"), { storyCount: 1 }));
  });

  it("an admin can list profiles and change roles and clients", async () => {
    await assertSucceeds(getDocs(collection(admin(), "users")));
    await assertSucceeds(updateDoc(doc(admin(), "users/alice"), { role: "revoked" }));
    await assertSucceeds(updateDoc(doc(admin(), "users/bob"), { clientId: "morocco" }));
  });

  it("you cannot write the note that remembers your role before access was switched off", async () => {
    await assertFails(updateDoc(doc(alice(), "users/alice"), { roleBeforeRevoke: "admin" }));
  });

  it("an admin can switch access off and back on, and the note is theirs to write", async () => {
    await assertSucceeds(updateDoc(doc(admin(), "users/alice"), { role: "revoked", roleBeforeRevoke: "user" }));
    await assertSucceeds(updateDoc(doc(admin(), "users/alice"), { role: "user", roleBeforeRevoke: deleteField() }));
  });

  it("after access is switched off the person can still see their own profile, but nothing else", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await updateDoc(doc(ctx.firestore(), "users/alice"), { role: "revoked", roleBeforeRevoke: "user" });
    });
    await assertSucceeds(getDoc(doc(alice(), "users/alice")));
    await assertFails(getDoc(doc(alice(), "users/alice/stories/s1")));
    await assertFails(getDocs(query(collection(alice(), "users/alice/stories"), orderBy("createdAt", "desc"), limit(25))));
    await assertFails(getDoc(doc(alice(), "library/beachcombing")));
  });

  it("an admin cannot delete profiles either", async () => {
    await assertFails(deleteDoc(doc(admin(), "users/alice")));
  });
});

describe("a person's own work (stories, jots, progress)", () => {
  it("the owner can read and write it", async () => {
    await assertSucceeds(getDoc(doc(alice(), "users/alice/stories/s1")));
    await assertSucceeds(getDocs(collection(alice(), "users/alice/stories")));
    await assertSucceeds(setDoc(doc(alice(), "users/alice/stories/s9"), { title: "New", body: "text" }));
    await assertSucceeds(setDoc(doc(alice(), "users/alice/jots/j9"), { word: "Door", text: "x" }));
    await assertSucceeds(setDoc(doc(alice(), "users/alice/progress/state"), { masteredIds: ["a"] }));
    await assertSucceeds(deleteDoc(doc(alice(), "users/alice/stories/s1")));
  });

  it("other people cannot read or write it", async () => {
    await assertFails(getDoc(doc(bob(), "users/alice/stories/s1")));
    await assertFails(getDocs(collection(bob(), "users/alice/jots")));
    await assertFails(setDoc(doc(bob(), "users/alice/stories/s9"), { title: "Hack", body: "x" }));
    await assertFails(deleteDoc(doc(bob(), "users/alice/stories/s1")));
  });

  it("an admin can read it but never change it", async () => {
    await assertSucceeds(getDoc(doc(admin(), "users/alice/stories/s1")));
    await assertSucceeds(getDocs(collection(admin(), "users/alice/stories")));
    await assertSucceeds(getDocs(collection(admin(), "users/alice/jots")));
    await assertSucceeds(getDoc(doc(admin(), "users/alice/progress/state")));
    await assertFails(setDoc(doc(admin(), "users/alice/stories/s9"), { title: "Hack", body: "x" }));
    await assertFails(updateDoc(doc(admin(), "users/alice/stories/s1"), { title: "Edited" }));
    await assertFails(deleteDoc(doc(admin(), "users/alice/stories/s1")));
  });

  it("an admin can read a person's stories and jots newest first, a page at a time", async () => {
    await assertSucceeds(getDocs(query(collection(admin(), "users/alice/stories"), orderBy("createdAt", "desc"), limit(26))));
    await assertSucceeds(getDocs(query(collection(admin(), "users/alice/jots"), orderBy("date", "desc"), limit(26))));
  });

  it("another person cannot read those stories with a query either", async () => {
    await assertFails(getDocs(query(collection(bob(), "users/alice/stories"), orderBy("createdAt", "desc"), limit(26))));
  });

  it("a revoked person loses access to their own work", async () => {
    const db = as("gone", "gone@x.com");
    await assertFails(getDoc(doc(db, "users/gone/stories/s3")));
    await assertFails(setDoc(doc(db, "users/gone/stories/s4"), { title: "x", body: "y" }));
  });

  it("an unknown subcollection is not open to anyone", async () => {
    await assertFails(setDoc(doc(alice(), "users/alice/secrets/x"), { a: 1 }));
    await assertFails(getDoc(doc(admin(), "users/alice/secrets/x")));
  });
});

describe("shared content (library and flashcards)", () => {
  it("people can read it", async () => {
    await assertSucceeds(getDoc(doc(alice(), "library/beachcombing")));
    await assertSucceeds(getDoc(doc(alice(), "flashcards/oxford_1")));
    await assertSucceeds(getDocs(collection(alice(), "flashcards")));
  });

  it("people cannot change it", async () => {
    await assertFails(setDoc(doc(alice(), "library/beachcombing"), { tier1: [] }));
    await assertFails(updateDoc(doc(alice(), "flashcards/oxford_1"), { cards: ["x"] }));
    await assertFails(deleteDoc(doc(alice(), "library/beachcombing")));
  });

  it("an admin can change it", async () => {
    await assertSucceeds(setDoc(doc(admin(), "library/beachcombing"), { tier1: ["Door"] }));
    await assertSucceeds(setDoc(doc(admin(), "flashcards/oxford_2"), { cards: [] }));
  });

  it("a revoked person or someone with no profile cannot read it", async () => {
    await assertFails(getDoc(doc(as("gone", "gone@x.com"), "library/beachcombing")));
    await assertFails(getDoc(doc(as("newbie", "newbie@x.com"), "library/beachcombing")));
  });
});

describe("client profiles", () => {
  it("a person can read their own client and the default one", async () => {
    await assertSucceeds(getDoc(doc(alice(), "clients/morocco")));
    await assertSucceeds(getDoc(doc(alice(), "clients/default")));
    await assertSucceeds(getDocs(collection(alice(), "clients/morocco/watchOuts")));
  });

  it("a person cannot read another client", async () => {
    await assertFails(getDoc(doc(alice(), "clients/sauna")));
    await assertFails(getDocs(collection(alice(), "clients/sauna/watchOuts")));
  });

  it("a person cannot list all clients", async () => {
    await assertFails(getDocs(collection(alice(), "clients")));
  });

  it("a person cannot change a client", async () => {
    await assertFails(setDoc(doc(alice(), "clients/morocco"), { profileName: "Hacked" }));
    await assertFails(setDoc(doc(alice(), "clients/morocco/watchOuts/w9"), { title: "Hacked" }));
    await assertFails(deleteDoc(doc(alice(), "clients/morocco/watchOuts/w1")));
  });

  it("an admin can list, read and change every client", async () => {
    await assertSucceeds(getDocs(collection(admin(), "clients")));
    await assertSucceeds(getDoc(doc(admin(), "clients/sauna")));
    await assertSucceeds(getDocs(collection(admin(), "clients/sauna/watchOuts")));
    await assertSucceeds(setDoc(doc(admin(), "clients/newco"), { profileName: "New Co" }));
    await assertSucceeds(setDoc(doc(admin(), "clients/newco/scenarios/s1"), { title: "Scenario" }));
  });

  it("an admin can delete a client and its items; a person cannot", async () => {
    await assertFails(deleteDoc(doc(alice(), "clients/morocco/watchOuts/w1")));
    await assertFails(deleteDoc(doc(alice(), "clients/morocco")));
    await assertSucceeds(deleteDoc(doc(admin(), "clients/morocco/watchOuts/w1")));
    await assertSucceeds(deleteDoc(doc(admin(), "clients/morocco")));
  });

  it("a revoked person cannot read any client", async () => {
    await assertFails(getDoc(doc(as("gone", "gone@x.com"), "clients/morocco")));
  });
});

describe("everything else", () => {
  it("unknown collections are closed to everyone, even admins", async () => {
    await assertFails(getDoc(doc(admin(), "settings/app")));
    await assertFails(setDoc(doc(admin(), "settings/app"), { a: 1 }));
    await assertFails(setDoc(doc(alice(), "settings/app"), { a: 1 }));
  });
});
