import { useEffect, useMemo, useRef, useState } from "react";
import {
  arrayUnion,
  collection,
  doc,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase/app.ts";
import type { DeckCategory, Progress, Story, UserDoc } from "../types.ts";

// The person's own work, stored in Firebase under users/<their id>:
//   users/<id>                 profile, with summary counters (jotCount, storyCount, masteredCount)
//   users/<id>/stories/<id>    one document per story
//   users/<id>/jots/<id>       one document per Beachcombing jot (only counted on screen)
//   users/<id>/progress/state  { masteredIds, activeDecks }
//
// Screens only use the "progress" values and the "actions" returned here. Changes appear on screen
// at once and are sent to Firebase in the background. The counters on the profile are what the
// admin's progress list reads, so every action that changes something keeps them up to date.
const EMPTY: Progress = { jotCount: 0, stories: [], masteredIds: [], activeDecks: {} };

/** The words and text of a story, as saved from Storycraft, Pre-Outlining or the Speaking Arena. */
export interface StoryInput {
  title: string;
  prompt: string;
  body: string;
}

/** Everything a screen can do to a person's work. Each one returns at once and saves in the background. */
export interface ProgressActions {
  addJot: (jot: { word: string; text: string }) => void;
  addStory: (story: StoryInput) => void;
  updateStory: (id: string, story: StoryInput) => void;
  removeStory: (id: string) => void;
  setActiveDeck: (category: DeckCategory, ids: string[]) => void;
  masterCard: (category: DeckCategory, cardId: string, deckIds: string[]) => void;
}

/** Called when loading or saving fails. "kind" says which. */
export type ProgressErrorHandler = (error: unknown, kind: "load" | "save") => void;

/** What is in users/<id>/progress/state. */
type StateDoc = Partial<Pick<Progress, "masteredIds" | "activeDecks">>;

export function useProgress(
  uid: string,
  onError: ProgressErrorHandler,
  /** Called when the person's own profile says their access has been switched off. */
  onRevoked: () => void
): { progress: Progress; ready: boolean; actions: ProgressActions } {
  const [profile, setProfile] = useState<Partial<UserDoc> | null>(null);
  const [state, setState] = useState<StateDoc | null>(null);
  const [stories, setStories] = useState<Story[] | null>(null);

  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  const onRevokedRef = useRef(onRevoked);
  onRevokedRef.current = onRevoked;

  useEffect(() => {
    const userRef = doc(db, "users", uid);
    const fail = (error: unknown) => onErrorRef.current?.(error, "load");

    const unsubscribers = [
      // A person can always read their own profile, even after access is switched off. That makes it the
      // reliable way to notice: Firestore does not stop an open listener just because the rules now say no.
      onSnapshot(
        userRef,
        (snap) => {
          const data = (snap.data() ?? {}) as Partial<UserDoc>;
          setProfile(data);
          if (data.role === "revoked") onRevokedRef.current();
        },
        fail
      ),
      onSnapshot(doc(userRef, "progress", "state"), (snap) => setState((snap.data() ?? {}) as StateDoc), fail),
      onSnapshot(
        query(collection(userRef, "stories"), orderBy("createdAt", "desc")),
        (snap) => setStories(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Story)),
        fail
      ),
    ];
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [uid]);

  const ready = profile !== null && state !== null && stories !== null;

  const progress = useMemo(
    () =>
      ready
        ? {
            jotCount: profile.jotCount ?? 0,
            stories,
            masteredIds: state.masteredIds ?? EMPTY.masteredIds,
            activeDecks: state.activeDecks ?? EMPTY.activeDecks,
          }
        : EMPTY,
    [ready, profile, state, stories]
  );

  // Always the newest values, for actions that need to know the current numbers.
  const latest = useRef(progress);
  latest.current = progress;

  // Changes not yet confirmed by Firebase (for example while offline). The browser warns before
  // the page is closed, because those changes would be lost.
  const unsaved = useRef(0);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (unsaved.current > 0) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  const actions = useMemo<ProgressActions>(() => {
    const userRef = doc(db, "users", uid);
    const stateRef = doc(userRef, "progress", "state");
    const now = () => new Date().toISOString();
    const touch = { lastActiveAt: serverTimestamp() };

    const send = (write: () => Promise<unknown>) => {
      unsaved.current += 1;
      Promise.resolve()
        .then(write)
        .catch((error) => onErrorRef.current?.(error, "save"))
        .finally(() => {
          unsaved.current -= 1;
        });
    };

    return {
      addJot: ({ word, text }) =>
        send(() => {
          const batch = writeBatch(db);
          batch.set(doc(collection(userRef, "jots")), { word, text, date: now() });
          batch.update(userRef, { jotCount: increment(1), ...touch });
          return batch.commit();
        }),

      addStory: ({ title, prompt, body }) =>
        send(() => {
          const batch = writeBatch(db);
          batch.set(doc(collection(userRef, "stories")), { title, prompt, body, createdAt: now() });
          batch.update(userRef, { storyCount: increment(1), ...touch });
          return batch.commit();
        }),

      updateStory: (id, { title, prompt, body }) =>
        send(() => {
          const batch = writeBatch(db);
          batch.update(doc(userRef, "stories", id), { title, prompt, body, updatedAt: now() });
          batch.update(userRef, touch);
          return batch.commit();
        }),

      removeStory: (id) =>
        send(() => {
          const batch = writeBatch(db);
          batch.delete(doc(userRef, "stories", id));
          batch.update(userRef, { storyCount: increment(-1), ...touch });
          return batch.commit();
        }),

      setActiveDeck: (category, ids) =>
        send(() => setDoc(stateRef, { activeDecks: { [category]: ids } }, { merge: true })),

      masterCard: (category, cardId, deckIds) =>
        send(() => {
          const known = latest.current.masteredIds;
          const masteredCount = known.includes(cardId) ? known.length : known.length + 1;
          const batch = writeBatch(db);
          batch.set(
            stateRef,
            { masteredIds: arrayUnion(cardId), activeDecks: { [category]: deckIds } },
            { merge: true }
          );
          batch.update(userRef, { masteredCount, ...touch });
          return batch.commit();
        }),
    };
  }, [uid]);

  return { progress, ready, actions };
}
