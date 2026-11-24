// Turns the two AppSheet CSV exports ("SC Training Dashboard - Prompts.csv" and, optionally,
// "... - Categories.csv") into shared content. Nothing here talks to Firebase: it only reads text
// and says what would change. See CsvImport.jsx for the screen and csvImport.js for saving.

// ---------------------------------------------------------------------------------------------
// WHICH CATEGORY BECOMES WHAT. Change this list if the AppSheet categories change.
// The ids (C20, C35...) are the "Cat_ID" column of the Prompts CSV.
// ---------------------------------------------------------------------------------------------
export const CATEGORY_RULES = {
  // Beachcombing words: the first TIER1_SIZE become tier 1 and the rest become tier 3
  beachcombingWords: ["C20"],
  // Beachcombing tier 2
  tier2: ["C32", "C33"],
  // Pre-Outlining questions
  questions: ["C22"],
  // Flashcard decks
  oxford: ["C35"],
  phrasal: ["C28", "C29"],
  idioms: ["C1", "C2", "C3", "C4", "C5", "C6", "C7", "C8", "C9", "C10", "C11", "C12", "C13", "C14", "C15", "C16", "C21", "C27", "C37"],
};
export const TIER1_SIZE = 150;

// What the back of a card says when the CSV row has no "Meaning".
const DEFAULT_MEANING = {
  oxford: "Oxford 3000 B2 Vocabulary",
  phrasal: "Phrasal Verb",
  idioms: "Idiom / Metaphor",
};

// ---------------------------------------------------------------------------------------------
// Reading a CSV file (quotes, commas and line breaks inside quotes, Windows line endings, a BOM).
// Returns one object per row, keyed by the column names in the first row. Blank rows are dropped.
// ---------------------------------------------------------------------------------------------
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\r" && next === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i++;
    } else if (ch === "\n" || ch === "\r") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  if (rows.length < 2) return { headers: rows[0]?.map(cleanHeader) ?? [], rows: [] };
  const headers = rows[0].map(cleanHeader);
  const records = rows
    .slice(1)
    .filter((r) => r.some((cell) => cell && cell.trim() !== ""))
    .map((r) => Object.fromEntries(headers.map((h, idx) => [h, (r[idx] || "").trim()])));
  return { headers, rows: records };
}

const cleanHeader = (h) => h.trim().replace(/^\uFEFF/, "");

// Throws an Error with a plain message if the file is not the kind we expect.
export function readPromptsCsv(text) {
  const { headers, rows } = parseCsv(text);
  const missing = ["Cat_ID", "Prompt"].filter((name) => !headers.includes(name));
  if (missing.length) {
    throw new Error(
      `This does not look like the Prompts CSV: it needs the columns Cat_ID and Prompt (missing: ${missing.join(", ")}). The columns found are: ${headers.join(", ") || "none"}.`
    );
  }
  if (rows.length === 0) throw new Error("The Prompts CSV has no rows.");
  return rows;
}

export function readCategoriesCsv(text) {
  const { headers, rows } = parseCsv(text);
  if (!headers.includes("Cat_ID")) {
    throw new Error(`This does not look like the Categories CSV: it needs a Cat_ID column. The columns found are: ${headers.join(", ") || "none"}.`);
  }
  return rows;
}

// ---------------------------------------------------------------------------------------------
// Working out what the CSV contains.
// ---------------------------------------------------------------------------------------------

// Removes repeats (ignoring capitals). Returns { list, removed }.
function withoutRepeats(items) {
  const seen = new Set();
  const list = [];
  items.forEach((item) => {
    const key = item.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      list.push(item);
    }
  });
  return { list, removed: items.length - list.length };
}

// Gives every card a different id: a repeated id gets "_2", "_3"... "taken" holds ids already in use elsewhere.
function withUniqueCardIds(cards, taken = new Set()) {
  const used = new Set(taken);
  return cards.map((card) => {
    let id = card.id;
    for (let n = 2; used.has(id); n++) id = `${card.id}_${n}`;
    used.add(id);
    return id === card.id ? card : { ...card, id };
  });
}

// promptRows and categoryRows come from readPromptsCsv / readCategoriesCsv.
// Returns { changes, report }. "changes" holds ONLY the lists the CSV has something for; every other
// list is left alone when the import is applied:
//   changes = { beachcombing: { tier1?, tier2?, tier3? }, questions?, flashcards: { oxford?, phrasal?, idioms? } }
export function convertAppSheet(promptRows, categoryRows = []) {
  const categoryName = {};
  categoryRows.forEach((row) => {
    if (row.Cat_ID) categoryName[row.Cat_ID.trim()] = row.Category || row.Cat_ID;
  });

  const rule = (name) => new Set(CATEGORY_RULES[name]);
  const sets = { words: rule("beachcombingWords"), tier2: rule("tier2"), questions: rule("questions"), oxford: rule("oxford"), phrasal: rule("phrasal"), idioms: rule("idioms") };

  const words = [];
  const tier2 = [];
  const questions = [];
  const cards = { oxford: [], phrasal: [], idioms: [] };
  const unusedByCategory = {};
  let blank = 0;
  let unused = 0;

  promptRows.forEach((row, index) => {
    const catId = (row.Cat_ID || "").trim();
    const prompt = (row.Prompt || "").trim();
    if (!prompt) {
      blank += 1;
      return;
    }

    const card = (deck, note) => ({
      id: (row.Prompt_ID || "").trim() || `ap_${index}`,
      term: prompt,
      definition: (row.Meaning || "").trim() || DEFAULT_MEANING[deck],
      example: (row.Example || "").trim(),
      note,
    });

    if (sets.words.has(catId)) words.push(prompt);
    else if (sets.tier2.has(catId)) tier2.push(prompt);
    else if (sets.questions.has(catId)) questions.push(prompt);
    else if (sets.oxford.has(catId)) cards.oxford.push(card("oxford", ""));
    else if (sets.phrasal.has(catId)) cards.phrasal.push(card("phrasal", categoryName[catId] || ""));
    else if (sets.idioms.has(catId)) cards.idioms.push(card("idioms", categoryName[catId] || ""));
    else {
      unused += 1;
      unusedByCategory[catId || "(none)"] = (unusedByCategory[catId || "(none)"] || 0) + 1;
    }
  });

  const dedupedWords = withoutRepeats(words);
  const dedupedTier2 = withoutRepeats(tier2);
  const dedupedQuestions = withoutRepeats(questions);

  const changes = { beachcombing: {}, flashcards: {} };
  const tier1 = dedupedWords.list.slice(0, TIER1_SIZE);
  const tier3 = dedupedWords.list.slice(TIER1_SIZE);
  if (tier1.length) changes.beachcombing.tier1 = tier1;
  if (dedupedTier2.list.length) changes.beachcombing.tier2 = dedupedTier2.list;
  if (tier3.length) changes.beachcombing.tier3 = tier3;
  if (dedupedQuestions.list.length) changes.questions = dedupedQuestions.list;
  Object.entries(cards).forEach(([deck, list]) => {
    if (list.length) changes.flashcards[deck] = withUniqueCardIds(list);
  });

  return {
    changes,
    report: {
      rows: promptRows.length,
      blank,
      unused,
      unusedCategories: Object.entries(unusedByCategory).sort((a, b) => b[1] - a[1]).map(([id, count]) => ({ id, count })),
      repeatsRemoved: dedupedWords.removed + dedupedTier2.removed + dedupedQuestions.removed,
    },
  };
}

// A flashcard is remembered by its id, so ids must not clash across decks. This renames CSV ids that
// are already used by a deck the import is NOT replacing (library = the current normalised library).
export function avoidIdClashes(changes, library) {
  const replaced = new Set(Object.keys(changes.flashcards));
  const taken = new Set(
    Object.entries(library.flashcards).filter(([deck]) => !replaced.has(deck)).flatMap(([, list]) => list.map((card) => card.id))
  );
  const flashcards = {};
  Object.entries(changes.flashcards).forEach(([deck, list]) => {
    flashcards[deck] = withUniqueCardIds(list, taken);
    flashcards[deck].forEach((card) => taken.add(card.id));
  });
  return { ...changes, flashcards };
}

const LIST_LABELS = [
  ["beachcombing.tier1", "Beachcombing words, tier 1"],
  ["beachcombing.tier2", "Beachcombing words, tier 2"],
  ["beachcombing.tier3", "Beachcombing words, tier 3"],
  ["questions", "Pre-Outlining questions"],
  ["flashcards.oxford", "Flashcards: Oxford B2"],
  ["flashcards.phrasal", "Flashcards: phrasal verbs"],
  ["flashcards.idioms", "Flashcards: idioms & metaphors"],
];

// For the preview: [{ label, before, after }] for each list the import would replace.
export function describeChanges(changes, library) {
  const valueAt = (source, path) => path.split(".").reduce((o, key) => o?.[key], source);
  const current = {
    "beachcombing.tier1": library.beachcombing.tier1,
    "beachcombing.tier2": library.beachcombing.tier2,
    "beachcombing.tier3": library.beachcombing.tier3,
    questions: library.preOutliningQuestions,
    "flashcards.oxford": library.flashcards.oxford,
    "flashcards.phrasal": library.flashcards.phrasal,
    "flashcards.idioms": library.flashcards.idioms,
  };
  return LIST_LABELS.filter(([path]) => valueAt(changes, path)).map(([path, label]) => ({
    label,
    before: current[path].length,
    after: valueAt(changes, path).length,
  }));
}
