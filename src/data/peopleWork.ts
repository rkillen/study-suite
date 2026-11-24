import { collection, getDocs, limit, orderBy, query, startAfter, type QueryDocumentSnapshot } from "firebase/firestore";
import { db } from "../firebase/app.ts";
import type { Jot, Story } from "../types.ts";

// Reading a person's own work, for admins. This is read-only: the security rules let admins read
// people's stories and jots but never change them. Loaded a page at a time.

export const WORK_PAGE_SIZE = 25;

export interface WorkPage<T> {
  items: T[];
  /** Pass this back to get the next page. null when there is no more. */
  next: QueryDocumentSnapshot | null;
}

async function readPage<T>(uid: string, section: "stories" | "jots", sortBy: string, after: QueryDocumentSnapshot | null): Promise<WorkPage<T>> {
  const base = [orderBy(sortBy, "desc"), limit(WORK_PAGE_SIZE + 1)];
  const snapshot = await getDocs(query(collection(db, "users", uid, section), ...base, ...(after ? [startAfter(after)] : [])));

  // One extra is asked for, only to know whether another page exists.
  const hasMore = snapshot.docs.length > WORK_PAGE_SIZE;
  const docs = hasMore ? snapshot.docs.slice(0, WORK_PAGE_SIZE) : snapshot.docs;
  return {
    items: docs.map((d) => ({ id: d.id, ...d.data() }) as T),
    next: hasMore ? docs[docs.length - 1]! : null,
  };
}

export const fetchStoriesPage = (uid: string, after: QueryDocumentSnapshot | null = null): Promise<WorkPage<Story>> =>
  readPage<Story>(uid, "stories", "createdAt", after);

export const fetchJotsPage = (uid: string, after: QueryDocumentSnapshot | null = null): Promise<WorkPage<Jot>> =>
  readPage<Jot>(uid, "jots", "date", after);
