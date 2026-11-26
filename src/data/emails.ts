// Email addresses are stored in lower case, because that is how Google reports them.
export const normalizeEmail = (raw: unknown): string => String(raw ?? "").trim().toLowerCase();

// Deliberately simple: something@something.something, and nothing that could break a database path.
export const isValidEmail = (email: string): boolean => /^[^\s@/]+@[^\s@/]+\.[^\s@/]+$/.test(email) && email.length <= 254;
