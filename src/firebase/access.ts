import type { User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import type { InviteDoc, Role, UserDoc, UserProfile } from "../types.ts";
import { db } from "./app.ts";

const ACTIVE_ROLES: Role[] = ["user", "admin"];

export type AccessResult = { ok: true; profile: UserProfile } | { ok: false; reason: "not-invited" | "revoked" };

// Decides whether a freshly signed-in Google account may use the app.
//
//  - Already known (a users/<uid> document exists): fine, unless their access was revoked.
//  - Not known yet: they need an invitation, a document at invites/<their email>.
//    If there is one, their profile is created from it (role and client).
//  - No invitation: not allowed.
//
// Returns { ok: true, profile } or { ok: false, reason: "not-invited" | "revoked" }.
export async function resolveAccess(user: User): Promise<AccessResult> {
  const email = (user.email || "").toLowerCase();
  const userRef = doc(db, "users", user.uid);
  const existing = await getDoc(userRef);

  if (existing.exists()) {
    const profile = existing.data() as UserDoc;
    if (!ACTIVE_ROLES.includes(profile.role)) return { ok: false, reason: "revoked" };
    updateDoc(userRef, { lastActiveAt: serverTimestamp(), displayName: user.displayName || "" }).catch(() => {});
    return { ok: true, profile: { uid: user.uid, email: profile.email, displayName: profile.displayName, role: profile.role, clientId: profile.clientId } };
  }

  const invite = await getDoc(doc(db, "invites", email));
  if (!invite.exists()) return { ok: false, reason: "not-invited" };

  const { role, clientId } = invite.data() as InviteDoc;
  await setDoc(userRef, {
    email,
    displayName: user.displayName || "",
    role,
    clientId,
    createdAt: serverTimestamp(),
    lastActiveAt: serverTimestamp(),
    storyCount: 0,
    jotCount: 0,
    masteredCount: 0,
  });

  if (!ACTIVE_ROLES.includes(role)) return { ok: false, reason: "revoked" };
  return { ok: true, profile: { uid: user.uid, email, role, clientId } };
}
