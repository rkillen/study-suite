import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "../firebase/app.ts";
import type { BeachWords, ClientSummary, RawClientProfile, RawLibrary } from "../types.ts";
import { joinChunks, type ChunkData } from "./flashcardChunks.ts";

// Reads the content from Firebase. It returns the same shapes the starter files in /seed have,
// so everything after this (normalize.ts, merge.ts, the screens) works on either.
export const sourceName = "Firebase";

// A client's lists live in subcollections, one document per item, in this order.
const CLIENT_SECTIONS = ["watchOuts", "scenarios", "cards"] as const;
type Section = (typeof CLIENT_SECTIONS)[number];

async function readSection<T>(clientId: string, section: Section): Promise<T[]> {
  const snapshot = await getDocs(collection(db, "clients", clientId, section));
  return snapshot.docs
    .map((d) => ({ id: d.id, ...(d.data() as { order?: number }) }))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map(({ order: _order, ...item }) => item as T);
}

export async function fetchSharedLibrary(): Promise<RawLibrary> {
  const [beachcombing, preOutlining, storyPrompts, flashcardDocs] = await Promise.all([
    getDoc(doc(db, "library", "beachcombing")),
    getDoc(doc(db, "library", "preOutlining")),
    getDoc(doc(db, "library", "storyPrompts")),
    getDocs(collection(db, "flashcards")),
  ]);

  return {
    beachcombing: (beachcombing.data() ?? {}) as Partial<BeachWords>,
    preOutliningQuestions: (preOutlining.data()?.questions ?? []) as string[],
    storyPrompts: (storyPrompts.data()?.prompts ?? []) as string[],
    flashcards: joinChunks(flashcardDocs.docs.map((d) => d.data() as ChunkData)),
  };
}

// Every client that exists, as { id, profileName } (admins only).
export async function listClients(): Promise<ClientSummary[]> {
  const snapshot = await getDocs(collection(db, "clients"));
  return snapshot.docs
    .map((d) => ({ id: d.id, profileName: (d.data().profileName as string | undefined) || d.id }))
    .sort((a, b) => a.profileName.localeCompare(b.profileName));
}

export const listClientIds = async (): Promise<string[]> => (await listClients()).map((client) => client.id).sort();

// Returns null when there is no such client.
export async function fetchClientProfile(clientId: string): Promise<RawClientProfile | null> {
  const clientDoc = await getDoc(doc(db, "clients", clientId));
  if (!clientDoc.exists()) return null;

  const [watchOuts, scenarios, customCards] = await Promise.all([
    readSection<NonNullable<RawClientProfile["watchOuts"]>[number]>(clientId, "watchOuts"),
    readSection<NonNullable<RawClientProfile["scenarios"]>[number]>(clientId, "scenarios"),
    readSection<NonNullable<RawClientProfile["customCards"]>[number]>(clientId, "cards"),
  ]);
  const { profileName, beachcombing } = clientDoc.data() as { profileName?: string; beachcombing?: Partial<BeachWords> };
  return { clientId, profileName, beachcombing, watchOuts, scenarios, customCards };
}
