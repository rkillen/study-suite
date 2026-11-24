import { useCallback, useEffect, useState } from "react";

function load(key, defaults) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
  } catch (e) {
    console.warn("Could not read saved state:", e);
    return defaults;
  }
}

// Like useState for an object, but remembered in this browser.
// update() accepts a partial object, or a function that returns one.
export function useStoredState(key, defaults) {
  const [value, setValue] = useState(() => load(key, defaults));

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn("Could not save state:", e);
    }
  }, [key, value]);

  const update = useCallback((patch) => {
    setValue((prev) => ({ ...prev, ...(typeof patch === "function" ? patch(prev) : patch) }));
  }, []);

  return [value, update];
}
