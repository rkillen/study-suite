// A short unique id for something new, such as a flashcard. The prefix just makes ids readable
// ("oxford_lq3x9k2"). Mastered cards are remembered by id, so an id must never change once made.
export function newId(prefix) {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
}
