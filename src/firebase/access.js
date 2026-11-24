import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { db } from "./app.js";

const ACTIVE_ROLES = ["user", "admin"];

// Decides whether a freshly signed-in Google account may use the app.
//
//  - Already known (a users/<uid> document exists): fine, unless their access was revoked.
//  - Not known yet: they need an invitation, a document at invites/<their email>.
//    If there is one, their profile is created from it (role and client).
//  - No invitation: not allowed.
//
// Returns { ok: true, profile } or { ok: false, reason: "not-invited" | "revoked" }.
export async function resolveAccess(user) {
  const email = (user.email || "").toLowerCase();
  const userRef = doc(db, "users", user.uid);
  const existing = await getDoc(userRef);

  if (existing.exists()) {
    const profile = existing.data();
    if (!ACTIVE_ROLES.includes(profile.role)) return { ok: false, reason: "revoked" };
    updateDoc(userRef, { lastActiveAt: serverTimestamp(), displayName: user.displayName || "" }).catch(() => {});
    return { ok: true, profile: { ...profile, uid: user.uid } };
  }

  const invite = await getDoc(doc(db, "invites", email));
  if (!invite.exists()) return { ok: false, reason: "not-invited" };

  const { role, clientId } = invite.data();
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
