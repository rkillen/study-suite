import { useSyncExternalStore } from "react";
import { getCaptureOwner, startCapture, stopCapture, subscribeCapture } from "./speech.js";

// "id" names this microphone button, so each screen knows if it is the one listening.
export function useSpeechCapture(id) {
  const activeOwner = useSyncExternalStore(subscribeCapture, getCaptureOwner);
  return {
    listening: activeOwner === id,
    start: (options) => startCapture(id, options),
    stop: stopCapture,
  };
}
