// Anything can be thrown in JavaScript, not just an Error. This turns whatever it was into text for the screen.
export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
