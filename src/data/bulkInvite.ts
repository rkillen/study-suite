import type { ClientSummary } from "../types.ts";
import { isValidEmail, normalizeEmail } from "./emails.ts";

// Turns pasted text into invitations to review. One person per line:
//
//   ana@example.com, morocco
//   ben@example.com; Swiss CRO
//   cara@example.com            <- no client: uses the one chosen for such lines
//
// The client can be its short id or its exact name. Blank lines and lines starting with # are ignored.
// This only reads text. The database checks (already has an account...) are made afterwards.

export const MAX_BULK_ROWS = 200;

export interface BulkRow {
  /** The line number in what was pasted, counting from 1. */
  line: number;
  email: string;
  clientId: string;
  /** Why this line cannot be invited. Missing means it looks fine so far. */
  problem?: string;
}

export function parseBulkInvites(text: string, clients: ClientSummary[], fallbackClientId: string): BulkRow[] {
  const lines = text
    .split(/\r\n|\r|\n/)
    .map((raw, index) => ({ raw: raw.trim(), line: index + 1 }))
    .filter(({ raw }) => raw !== "" && !raw.startsWith("#"));

  if (lines.length > MAX_BULK_ROWS) {
    throw new Error(`That is ${lines.length} lines. Please invite at most ${MAX_BULK_ROWS} people at a time.`);
  }

  const byKey = new Map<string, ClientSummary>();
  clients.forEach((client) => {
    byKey.set(client.id.toLowerCase(), client);
    byKey.set(client.profileName.toLowerCase(), client);
  });

  const seen = new Set<string>();
  return lines.map(({ raw, line }) => {
    // The email is the first word. The client is everything after the first comma, semicolon, tab or space,
    // so a client's name can itself contain commas ("Acme, Inc.").
    const split = raw.match(/^([^\s,;]+)\s*[,;\t]?\s*(.*)$/);
    const first = split?.[1] ?? raw;
    const second = split?.[2]?.trim() ? split[2].trim() : undefined;

    const email = normalizeEmail(first);
    const row: BulkRow = { line, email, clientId: "" };

    if (!isValidEmail(email)) return { ...row, problem: `"${first}" does not look like an email address.` };
    if (seen.has(email)) return { ...row, problem: "This email is listed more than once." };

    const client = second !== undefined ? byKey.get(second.toLowerCase()) : fallbackClientId ? byKey.get(fallbackClientId.toLowerCase()) : undefined;
    if (!client) {
      return {
        ...row,
        problem:
          second !== undefined
            ? `There is no client called "${second}".`
            : "No client given. Add one after the email, or choose a client for lines without one.",
      };
    }
    // Only a line that is accepted uses up the email, so a corrected line further down still works.
    seen.add(email);
    return { ...row, clientId: client.id };
  });
}
