import { collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where, writeBatch, type WriteBatch } from "firebase/firestore";
import { db } from "../firebase/app.ts";
import type { BeachWords, ClientProfile, CustomCard, Flashcard, Library, Scenario, WatchOut } from "../types.ts";
import type { ClientContent } from "./clientIds.ts";
import { splitIntoChunks } from "./flashcardChunks.ts";

// Saves content to Firebase. Each function REPLACES what is stored (anything that is no longer
// in the new data is removed). Only admins are allowed to do this; the security rules enforce it.

// Firebase allows at most 500 changes in one batch; stay well below.
const BATCH_LIMIT = 400;

// One change to make, given the batch it will be part of.
type Operation = (batch: WriteBatch) => void;

async function commitAll(operations: Operation[]): Promise<void> {
  for (let i = 0; i < operations.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db);
    operations.slice(i, i + BATCH_LIMIT).forEach((operation) => operation(batch));
    await batch.commit();
  }
}

// Items become documents named after their id. Ids may not contain "/" and must be unique.
function withUniqueIds<T extends { id?: string }>(items: T[], fallbackPrefix: string): (T & { id: string })[] {
  const used = new Set<string>();
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
export const saveBeachcombing = (beachcombing: BeachWords): Promise<void> => setDoc(doc(db, "library", "beachcombing"), beachcombing);

export const savePreOutliningQuestions = (questions: string[]): Promise<void> => setDoc(doc(db, "library", "preOutlining"), { questions });

export const saveStoryPrompts = (prompts: string[]): Promise<void> => setDoc(doc(db, "library", "storyPrompts"), { prompts });

// Replaces every card of one flashcard category (for example "oxford").
export async function saveFlashcardCategory(category: string, cards: Flashcard[]): Promise<void> {
  const chunks = splitIntoChunks({ [category]: cards });
  const keep = new Set(chunks.map((chunk) => chunk.id));
  const existing = await getDocs(query(collection(db, "flashcards"), where("category", "==", category)));

  await commitAll([
    ...chunks.map((chunk) => (batch: WriteBatch) => batch.set(doc(db, "flashcards", chunk.id), chunk.data)),
    ...existing.docs.filter((d) => !keep.has(d.id)).map((d) => (batch: WriteBatch) => batch.delete(d.ref)),
  ]);
}

// ---- Everything at once

// library: the normalised shape from normalize.ts (beachcombing tiers, questions, prompts, flashcards)
export async function saveSharedLibrary(library: Library): Promise<void> {
  const chunks = splitIntoChunks(library.flashcards);
  const keep = new Set(chunks.map((chunk) => chunk.id));
  const existing = await getDocs(collection(db, "flashcards"));

  await commitAll([
    (batch: WriteBatch) => batch.set(doc(db, "library", "beachcombing"), library.beachcombing),
    (batch: WriteBatch) => batch.set(doc(db, "library", "preOutlining"), { questions: library.preOutliningQuestions }),
    (batch: WriteBatch) => batch.set(doc(db, "library", "storyPrompts"), { prompts: library.storyPrompts }),
    ...chunks.map((chunk) => (batch: WriteBatch) => batch.set(doc(db, "flashcards", chunk.id), chunk.data)),
    ...existing.docs.filter((d) => !keep.has(d.id)).map((d) => (batch: WriteBatch) => batch.delete(d.ref)),
  ]);
}

// ---- Clients

/** The three lists a client has, as they are named in the database. */
export type ClientSection = "watchOuts" | "scenarios" | "cards";
type SectionItem = WatchOut | Scenario | CustomCard;

const SECTION_ID_PREFIX: Record<ClientSection, string> = { watchOuts: "wo", scenarios: "scn", cards: "card" };

// The changes that make one list of a client (watch-outs, scenarios or cards) match "items".
async function sectionOperations(clientId: string, section: ClientSection, items: SectionItem[]): Promise<Operation[]> {
  const withIds = withUniqueIds(items, SECTION_ID_PREFIX[section]);
  const keep = new Set(withIds.map((item) => item.id));
  const existing = await getDocs(collection(db, "clients", clientId, section));

  return [
    ...withIds.map(({ id, ...data }, order) => (batch: WriteBatch) =>
      batch.set(doc(db, "clients", clientId, section, id), { ...data, order })
    ),
    ...existing.docs.filter((d) => !keep.has(d.id)).map((d) => (batch: WriteBatch) => batch.delete(d.ref)),
  ];
}

// Replaces one list of a client. section is "watchOuts", "scenarios" or "cards".
export async function saveClientSection(clientId: string, section: ClientSection, items: SectionItem[]): Promise<void> {
  await commitAll([
    ...(await sectionOperations(clientId, section, items)),
    (batch: WriteBatch) => batch.update(doc(db, "clients", clientId), { updatedAt: serverTimestamp() }),
  ]);
}

// beachcombing: the client's own extra words, { tier1: [...], tier2: [...], tier3: [...] }
export const saveClientBeachcombing = (clientId: string, beachcombing: BeachWords): Promise<void> =>
  updateDoc(doc(db, "clients", clientId), { beachcombing, updatedAt: serverTimestamp() });

export const saveClientName = (clientId: string, profileName: string): Promise<void> =>
  updateDoc(doc(db, "clients", clientId), { profileName, updatedAt: serverTimestamp() });

// profile: the normalised shape from normalize.ts (profileName, beachcombing, watchOuts, scenarios, customCards)
// Replaces the whole client.
export async function saveClientProfile(profile: ClientProfile): Promise<void> {
  const { clientId } = profile;
  const sections: Record<ClientSection, SectionItem[]> = { watchOuts: profile.watchOuts, scenarios: profile.scenarios, cards: profile.customCards };

  const operations: Operation[] = [
    (batch: WriteBatch) =>
      batch.set(doc(db, "clients", clientId), {
        profileName: profile.profileName,
        beachcombing: profile.beachcombing,
        updatedAt: serverTimestamp(),
      }),
  ];
  for (const [section, items] of Object.entries(sections) as [ClientSection, SectionItem[]][]) {
    operations.push(...(await sectionOperations(clientId, section, items)));
  }
  await commitAll(operations);
}

// Makes a new client. content (optional) is a copy of another client's content, see cloneClientContent.
// Refuses if a client with that id already exists.
export async function createClient({ clientId, profileName, content }: { clientId: string; profileName: string; content?: ClientContent }): Promise<void> {
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
