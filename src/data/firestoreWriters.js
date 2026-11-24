import { collection, doc, getDocs, serverTimestamp, writeBatch } from "firebase/firestore";
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

// profile: the normalised shape from normalize.js (profileName, beachcombing, watchOuts, scenarios, customCards)
export async function saveClientProfile(profile) {
  const { clientId } = profile;
  const sections = {
    watchOuts: withUniqueIds(profile.watchOuts, "wo"),
    scenarios: withUniqueIds(profile.scenarios, "scn"),
    cards: withUniqueIds(profile.customCards, "card"),
  };

  const operations = [
    (batch) =>
      batch.set(doc(db, "clients", clientId), {
        profileName: profile.profileName,
        beachcombing: profile.beachcombing,
        updatedAt: serverTimestamp(),
      }),
  ];

  for (const [section, items] of Object.entries(sections)) {
    const keep = new Set(items.map((item) => item.id));
    const existing = await getDocs(collection(db, "clients", clientId, section));

    items.forEach(({ id, ...data }, order) => {
      operations.push((batch) => batch.set(doc(db, "clients", clientId, section, id), { ...data, order }));
    });
    existing.docs
      .filter((d) => !keep.has(d.id))
      .forEach((d) => operations.push((batch) => batch.delete(d.ref)));
  }

  await commitAll(operations);
}
