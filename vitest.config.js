import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Separate Config statt Erweiterung von vite.config.js, damit der
// normale `vite build`/`vite dev` unberührt bleibt — Tests laufen nur
// über `npm test` (vitest liest automatisch vitest.config.js, falls
// vorhanden, statt vite.config.js).
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/setupTests.js"],
  },
});
