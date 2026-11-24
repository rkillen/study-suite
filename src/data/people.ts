import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "../firebase/app.ts";
import type { InviteDoc, Role, UserDoc } from "../types.ts";
import { isValidEmail, normalizeEmail } from "./emails.ts";

// People and invitations (admins only). See docs/DATA-MODEL.md.
//   invites/<email>  the guest list: who may sign in, and for which client
//   users/<uid>      a person who has signed in (role: user, admin, or revoked)

/** "invited" has not signed in yet; "revoked" means access was switched off. */
export type PersonStatus = "invited" | "active" | "revoked";

export interface Person {
  email: string;
  name: string;
  status: PersonStatus;
  role: Role;
  /** Their account id. null until they have signed in for the first time. */
  uid: string | null;
  clientId: string;
  lastActiveAt: Date | null;
  invitedBy: string;
  /** The numbers the progress list shows. Zero for someone who has not signed in. */
  storyCount: number;
  jotCount: number;
  masteredCount: number;
  /** Only for revoked people: the role to give back on restore. */
  roleBeforeRevoke?: Role;
}

type AccountDoc = UserDoc & { lastActiveAt?: { toDate?: () => Date } };

// A person who has signed in is shown from their account; otherwise from their invitation.
function peopleFrom(accounts: QueryDocumentSnapshot[], invites: QueryDocumentSnapshot[]): Person[] {
  const people = new Map<string, Person>();

  invites.forEach((d) => {
    const invite = d.data() as InviteDoc;
    people.set(d.id, {
      email: d.id,
      name: "",
      status: "invited",
      role: invite.role,
      uid: null,
      clientId: invite.clientId,
      lastActiveAt: null,
      invitedBy: invite.invitedBy || "",
      storyCount: 0,
      jotCount: 0,
      masteredCount: 0,
    });
  });

  accounts.forEach((d) => {
    const account = d.data() as AccountDoc;
    people.set(account.email, {
      email: account.email,
      name: account.displayName || "",
      status: account.role === "revoked" ? "revoked" : "active",
      role: account.role,
      uid: d.id,
      clientId: account.clientId,
      lastActiveAt: account.lastActiveAt?.toDate?.() ?? null,
      invitedBy: "",
      storyCount: account.storyCount ?? 0,
      jotCount: account.jotCount ?? 0,
      masteredCount: account.masteredCount ?? 0,
      roleBeforeRevoke: account.roleBeforeRevoke,
    });
  });

  return [...people.values()].sort((a, b) => a.email.localeCompare(b.email));
}

/** Everyone attached to one client. */
export async function listClientPeople(clientId: string): Promise<Person[]> {
  const [accounts, invites] = await Promise.all([
    getDocs(query(collection(db, "users"), where("clientId", "==", clientId))),
    getDocs(query(collection(db, "invites"), where("clientId", "==", clientId))),
  ]);
  return peopleFrom(accounts.docs, invites.docs);
}

/** Everyone who has an account or an invitation. */
export async function listAllPeople(): Promise<Person[]> {
  const [accounts, invites] = await Promise.all([getDocs(collection(db, "users")), getDocs(collection(db, "invites"))]);
  return peopleFrom(accounts.docs, invites.docs);
}

// ---------------------------------------------------------------------------------------------
// Inviting
// ---------------------------------------------------------------------------------------------

// Can this email be invited to this client? Returns { problem } with a plain-English reason if not.
// An invitation only matters at someone's first sign-in, so anyone who already has an account,
// or is already invited, is refused here.
export async function checkCanInvite(rawEmail: string, clientId: string): Promise<{ problem?: string }> {
  const email = normalizeEmail(rawEmail);
  if (!email) return { problem: "Enter an email address." };
  if (!isValidEmail(email)) return { problem: `"${rawEmail.trim()}" does not look like an email address.` };

  const [accounts, invite] = await Promise.all([
    getDocs(query(collection(db, "users"), where("email", "==", email))),
    getDoc(doc(db, "invites", email)),
  ]);

  if (!accounts.empty) {
    const account = accounts.docs[0]!.data() as UserDoc;
    return {
      problem:
        account.role === "revoked"
          ? `${email} already has an account, but their access has been switched off. Open People and use Restore access.`
          : `${email} already has an account (client: ${account.clientId}).`,
    };
  }
  if (invite.exists()) {
    const existing = invite.data() as InviteDoc;
    return {
      problem:
        existing.clientId === clientId
          ? `${email} has already been invited to this client.`
          : `${email} has already been invited, to the client "${existing.clientId}". Cancel that invitation first.`,
    };
  }
  return {};
}

async function createInvite(rawEmail: string, clientId: string, role: Role, invitedBy: string): Promise<string> {
  const { problem } = await checkCanInvite(rawEmail, clientId);
  if (problem) throw new Error(problem);

  const email = normalizeEmail(rawEmail);
  await setDoc(doc(db, "invites", email), { role, clientId, invitedBy, createdAt: serverTimestamp() });
  return email;
}

/** Invites a person to a client as a regular user. Throws an Error with a plain message if not allowed. */
export const inviteToClient = ({ email, clientId, invitedBy }: { email: string; clientId: string; invitedBy: string }): Promise<string> =>
  createInvite(email, clientId, "user", invitedBy);

/** Invites an admin. Admins have no client of their own, so they get "default". */
export const inviteAdmin = ({ email, invitedBy }: { email: string; invitedBy: string }): Promise<string> =>
  createInvite(email, "default", "admin", invitedBy);

/** Invites many people at once. Each row must already have been checked with checkCanInvite. */
export async function inviteMany(rows: { email: string; clientId: string }[], invitedBy: string): Promise<void> {
  const BATCH = 400; // Firebase allows 500 changes per batch
  for (let start = 0; start < rows.length; start += BATCH) {
    const batch = writeBatch(db);
    rows.slice(start, start + BATCH).forEach(({ email, clientId }) => {
      batch.set(doc(db, "invites", normalizeEmail(email)), { role: "user", clientId, invitedBy, createdAt: serverTimestamp() });
    });
    await batch.commit();
  }
}

export const cancelInvite = (email: string): Promise<void> => deleteDoc(doc(db, "invites", normalizeEmail(email)));

// ---------------------------------------------------------------------------------------------
// Changing someone who is already in
// ---------------------------------------------------------------------------------------------

/**
 * Switches off a person's access: their account is marked revoked and any invitation is removed.
 * Their stories and progress are kept. Throws an Error with a plain message if it is not allowed.
 */
export async function revokeAccess(person: Person, actingEmail: string): Promise<void> {
  if (!person.uid) throw new Error(`${person.email} has not signed in yet. Cancel their invitation instead.`);
  if (normalizeEmail(person.email) === normalizeEmail(actingEmail)) throw new Error("You cannot switch off your own access.");

  if (person.role === "admin") {
    const admins = (await listAllPeople()).filter((p) => p.status === "active" && p.role === "admin");
    if (admins.length <= 1) throw new Error("This is the only admin. Invite another admin first, so the app is never left without one.");
  }

  const batch = writeBatch(db);
  batch.update(doc(db, "users", person.uid), { role: "revoked", roleBeforeRevoke: person.role });
  batch.delete(doc(db, "invites", person.email));
  await batch.commit();
}

/** Gives access back, with the role the person had before it was switched off. */
export async function restoreAccess(person: Person): Promise<void> {
  if (!person.uid || person.status !== "revoked") throw new Error(`${person.email}'s access is not switched off.`);
  await updateDoc(doc(db, "users", person.uid), {
    role: person.roleBeforeRevoke === "admin" ? "admin" : "user",
    roleBeforeRevoke: deleteField(),
  });
}

/** Moves a person to another client. Works for people who have not signed in yet, too. */
export async function moveToClient(person: Person, clientId: string): Promise<void> {
  if (person.clientId === clientId) throw new Error(`${person.email} is already in that client.`);
  if (!(await getDoc(doc(db, "clients", clientId))).exists()) throw new Error(`There is no client "${clientId}".`);

  const batch = writeBatch(db);
  if (person.uid) batch.update(doc(db, "users", person.uid), { clientId });
  // The invitation stays on file after sign-in, so keep it in step.
  if ((await getDoc(doc(db, "invites", person.email))).exists()) batch.update(doc(db, "invites", person.email), { clientId });
  await batch.commit();
}
