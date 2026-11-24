import { collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where, writeBatch } from "firebase/firestore";
import { db } from "../firebase/app.js";
import { splitIntoChunks } from "./flashcardChunks.js";

// Saves content to Firebase. Each function REPLACES what is stored (anything that is no longer
// in the new data is removed). Only admins are allowed to do this; the security rules enforce it.

// Firebase allows at most 500 changes in one batch; stay well below.
const BATCH_LIMIT = 400;

async function commitAll(operations) {
  for (let i = 0; i < operations.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db);
    operations.slice(i, i + BATCH_LIMIT).forEach((operation) => operation(batch));
    await batch.commit();
  }
}

// Items become documents named after their id. Ids may not contain "/" and must be unique.
function withUniqueIds(items, fallbackPrefix) {
  const used = new Set();
  return items.map((item, index) => {
    const base = String(item.id || `${fallbackPrefix}_${index + 1}`).replace(/[/\s]+/g, "_");
    let id = base;
    for (let n = 2; used.has(id); n++) id = `${base}_${n}`;
    used.add(id);
    return { ...item, id };
  });
}

// ---- One list at a time (used by the Admin screens)

// beachcombing: { tier1: [...], tier2: [...], tier3: [...] }
export const saveBeachcombing = (beachcombing) => setDoc(doc(db, "library", "beachcombing"), beachcombing);

export const savePreOutliningQuestions = (questions) => setDoc(doc(db, "library", "preOutlining"), { questions });

export const saveStoryPrompts = (prompts) => setDoc(doc(db, "library", "storyPrompts"), { prompts });

// Replaces every card of one flashcard category (for example "oxford").
export async function saveFlashcardCategory(category, cards) {
  const chunks = splitIntoChunks({ [category]: cards });
  const keep = new Set(chunks.map((chunk) => chunk.id));
  const existing = await getDocs(query(collection(db, "flashcards"), where("category", "==", category)));

  await commitAll([
    ...chunks.map((chunk) => (batch) => batch.set(doc(db, "flashcards", chunk.id), chunk.data)),
    ...existing.docs.filter((d) => !keep.has(d.id)).map((d) => (batch) => batch.delete(d.ref)),
  ]);
}

// ---- Everything at once

// library: the normalised shape from normalize.js (beachcombing tiers, questions, prompts, flashcards)
export async function saveSharedLibrary(library) {
  const chunks = splitIntoChunks(library.flashcards);
  const keep = new Set(chunks.map((chunk) => chunk.id));
  const existing = await getDocs(collection(db, "flashcards"));

  await commitAll([
    (batch) => batch.set(doc(db, "library", "beachcombing"), library.beachcombing),
    (batch) => batch.set(doc(db, "library", "preOutlining"), { questions: library.preOutliningQuestions }),
    (batch) => batch.set(doc(db, "library", "storyPrompts"), { prompts: library.storyPrompts }),
    ...chunks.map((chunk) => (batch) => batch.set(doc(db, "flashcards", chunk.id), chunk.data)),
    ...existing.docs.filter((d) => !keep.has(d.id)).map((d) => (batch) => batch.delete(d.ref)),
  ]);
}

// ---- Clients

const SECTION_ID_PREFIX = { watchOuts: "wo", scenarios: "scn", cards: "card" };

// The changes that make one list of a client (watch-outs, scenarios or cards) match "items".
async function sectionOperations(clientId, section, items) {
  const withIds = withUniqueIds(items, SECTION_ID_PREFIX[section]);
  const keep = new Set(withIds.map((item) => item.id));
  const existing = await getDocs(collection(db, "clients", clientId, section));

  return [
    ...withIds.map(({ id, ...data }, order) => (batch) =>
      batch.set(doc(db, "clients", clientId, section, id), { ...data, order })
    ),
    ...existing.docs.filter((d) => !keep.has(d.id)).map((d) => (batch) => batch.delete(d.ref)),
  ];
}

// Replaces one list of a client. section is "watchOuts", "scenarios" or "cards".
export async function saveClientSection(clientId, section, items) {
  await commitAll([
    ...(await sectionOperations(clientId, section, items)),
    (batch) => batch.update(doc(db, "clients", clientId), { updatedAt: serverTimestamp() }),
  ]);
}

// beachcombing: the client's own extra words, { tier1: [...], tier2: [...], tier3: [...] }
export const saveClientBeachcombing = (clientId, beachcombing) =>
  updateDoc(doc(db, "clients", clientId), { beachcombing, updatedAt: serverTimestamp() });

export const saveClientName = (clientId, profileName) =>
  updateDoc(doc(db, "clients", clientId), { profileName, updatedAt: serverTimestamp() });

// profile: the normalised shape from normalize.js (profileName, beachcombing, watchOuts, scenarios, customCards)
// Replaces the whole client.
export async function saveClientProfile(profile) {
  const { clientId } = profile;
  const sections = { watchOuts: profile.watchOuts, scenarios: profile.scenarios, cards: profile.customCards };

  const operations = [
    (batch) =>
      batch.set(doc(db, "clients", clientId), {
        profileName: profile.profileName,
        beachcombing: profile.beachcombing,
        updatedAt: serverTimestamp(),
      }),
  ];
  for (const [section, items] of Object.entries(sections)) {
    operations.push(...(await sectionOperations(clientId, section, items)));
  }
  await commitAll(operations);
}

// Makes a new client. content (optional) is a copy of another client's content, see cloneClientContent.
// Refuses if a client with that id already exists.
export async function createClient({ clientId, profileName, content }) {
  if ((await getDoc(doc(db, "clients", clientId))).exists()) {
    throw new Error(`There is already a client with the id "${clientId}".`);
  }
  await saveClientProfile({
    clientId,
    profileName,
    beachcombing: content?.beachcombing ?? { tier1: [], tier2: [], tier3: [] },
    watchOuts: content?.watchOuts ?? [],
    scenarios: content?.scenarios ?? [],
    customCards: content?.customCards ?? [],
  });
}
