import { useCallback, useEffect, useState } from "react";

function load<T extends object>(key: string, defaults: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
  } catch (e) {
    console.warn("Could not read saved state:", e);
    return defaults;
  }
}

/** Changes some fields of the stored object: give the new values, or a function that works them out. */
export type Updater<T> = (patch: Partial<T> | ((previous: T) => Partial<T>)) => void;

// Like useState for an object, but remembered in this browser.
// update() accepts a partial object, or a function that returns one.
export function useStoredState<T extends object>(
  key: string,
  defaults: T
): [T, Updater<T>] {
  const [value, setValue] = useState<T>(() => load(key, defaults));

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn("Could not save state:", e);
    }
  }, [key, value]);

  const update = useCallback((patch: Partial<T> | ((previous: T) => Partial<T>)) => {
    setValue((prev) => ({ ...prev, ...(typeof patch === "function" ? patch(prev) : patch) }));
  }, []);

  return [value, update];
}
