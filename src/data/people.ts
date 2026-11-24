import { collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, setDoc, where } from "firebase/firestore";
import { db } from "../firebase/app.ts";
import type { InviteDoc, Role, UserDoc } from "../types.ts";
import { isValidEmail, normalizeEmail } from "./emails.ts";

/** "invited" has not signed in yet; "revoked" means access was switched off. */
export type PersonStatus = "invited" | "active" | "revoked";

export interface Person {
  email: string;
  name: string;
  status: PersonStatus;
  role: Role;
  lastActiveAt: Date | null;
  invitedBy: string;
}

// People and invitations (admins only). See docs/DATA-MODEL.md.
//   invites/<email>  the guest list: who may sign in, and for which client
//   users/<uid>      a person who has signed in (role: user, admin, or revoked)

// Everyone attached to a client, as
//   { email, name, status: "invited" | "active" | "revoked", role, lastActiveAt, invitedBy }
// A person who has signed in is shown from their profile; otherwise from their invitation.
export async function listClientPeople(clientId: string): Promise<Person[]> {
  const [accounts, invites] = await Promise.all([
    getDocs(query(collection(db, "users"), where("clientId", "==", clientId))),
    getDocs(query(collection(db, "invites"), where("clientId", "==", clientId))),
  ]);

  const people = new Map<string, Person>();
  invites.docs.forEach((d) => {
    const invite = d.data() as InviteDoc;
    people.set(d.id, { email: d.id, name: "", status: "invited", role: invite.role, lastActiveAt: null, invitedBy: invite.invitedBy || "" });
  });
  accounts.docs.forEach((d) => {
    const account = d.data() as UserDoc & { lastActiveAt?: { toDate?: () => Date } };
    people.set(account.email, {
      email: account.email,
      name: account.displayName || "",
      status: account.role === "revoked" ? "revoked" : "active",
      role: account.role,
      lastActiveAt: account.lastActiveAt?.toDate?.() ?? null,
      invitedBy: "",
    });
  });
  return [...people.values()].sort((a, b) => a.email.localeCompare(b.email));
}

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
          ? `${email} already has an account, but their access has been switched off.`
          : `${email} already has an account (client: ${account.clientId}).`,
    };
  }
  if (invite.exists()) {
    return {
      problem:
        (invite.data() as InviteDoc).clientId === clientId
          ? `${email} has already been invited to this client.`
          : `${email} has already been invited, to the client "${(invite.data() as InviteDoc).clientId}". Cancel that invitation first.`,
    };
  }
  return {};
}

// Invites a person to a client as a regular user. Throws an Error with a plain message if not allowed.
export async function inviteToClient({ email: rawEmail, clientId, invitedBy }: { email: string; clientId: string; invitedBy: string }): Promise<string> {
  const { problem } = await checkCanInvite(rawEmail, clientId);
  if (problem) throw new Error(problem);

  const email = normalizeEmail(rawEmail);
  await setDoc(doc(db, "invites", email), { role: "user", clientId, invitedBy, createdAt: serverTimestamp() });
  return email;
}

export const cancelInvite = (email: string): Promise<void> => deleteDoc(doc(db, "invites", normalizeEmail(email)));
