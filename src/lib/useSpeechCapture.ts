import { useSyncExternalStore } from "react";
import { getCaptureOwner, startCapture, stopCapture, subscribeCapture, type CaptureOptions } from "./speech.ts";

// "id" names this microphone button, so each screen knows if it is the one listening.
export function useSpeechCapture(id: string) {
  const activeOwner = useSyncExternalStore(subscribeCapture, getCaptureOwner);
  return {
    listening: activeOwner === id,
    start: (options: CaptureOptions) => startCapture(id, options),
    stop: stopCapture,
  };
}
