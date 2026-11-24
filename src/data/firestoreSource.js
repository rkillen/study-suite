import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "../firebase/app.js";
import { joinChunks } from "./flashcardChunks.js";

// Reads the content from Firebase. It returns the same shapes the starter files in /seed have,
// so everything after this (normalize.js, merge.js, the screens) works on either.
export const sourceName = "Firebase";

// A client's lists live in subcollections, one document per item, in this order.
const CLIENT_SECTIONS = ["watchOuts", "scenarios", "cards"];

const withoutOrder = ({ order, ...item }) => item;

async function readSection(clientId, section) {
  const snapshot = await getDocs(collection(db, "clients", clientId, section));
  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map(withoutOrder);
}

export async function fetchSharedLibrary() {
  const [beachcombing, preOutlining, storyPrompts, flashcardDocs] = await Promise.all([
    getDoc(doc(db, "library", "beachcombing")),
    getDoc(doc(db, "library", "preOutlining")),
    getDoc(doc(db, "library", "storyPrompts")),
    getDocs(collection(db, "flashcards")),
  ]);

  return {
    beachcombing: beachcombing.data() ?? {},
    preOutliningQuestions: preOutlining.data()?.questions ?? [],
    storyPrompts: storyPrompts.data()?.prompts ?? [],
    flashcards: joinChunks(flashcardDocs.docs.map((d) => d.data())),
  };
}

// Returns null when there is no such client.
export async function fetchClientProfile(clientId) {
  const clientDoc = await getDoc(doc(db, "clients", clientId));
  if (!clientDoc.exists()) return null;

  const [watchOuts, scenarios, customCards] = await Promise.all(
    CLIENT_SECTIONS.map((section) => readSection(clientId, section))
  );
  const { profileName, beachcombing } = clientDoc.data();
  return { clientId, profileName, beachcombing, watchOuts, scenarios, customCards };
}
