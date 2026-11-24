import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // The Firebase library makes the main file about 850 KB (260 KB when sent compressed).
    // That is expected, so don't warn about it on every build.
    chunkSizeWarningLimit: 1000,
  },
});
