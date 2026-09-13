import { defineConfig, devices } from "@playwright/test";

// E2E-Smoke-Tests gegen die reale App-Oberfläche, aber ohne echtes
// Supabase/echte Auth (siehe e2e/harness/TestApp.jsx) — die App läuft
// dafür über den normalen Vite-Dev-Server, nur auf einer eigenen
// Test-HTML-Seite statt index.html.
export default defineConfig({
  testDir: "./e2e",
  timeout: 30000,
  fullyParallel: true,
  reporter: "list",
  webServer: {
    command: "npm run dev -- --port 5183 --strictPort",
    url: "http://localhost:5183/e2e/harness/index.html",
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
    // src/lib/supabaseClient.js ruft createClient() beim Modul-Import auf
    // und wirft ohne diese beiden Variablen sofort — der Harness nutzt zwar
    // keinen echten Supabase-Client (siehe TestApp.jsx), aber AuthContext.jsx
    // importiert das Modul trotzdem mit. Platzhalterwerte reichen, es wird
    // nie wirklich ein Request ausgelöst.
    env: {
      VITE_SUPABASE_URL: "https://e2e-test.supabase.co",
      VITE_SUPABASE_ANON_KEY: "e2e-test-anon-key",
    },
  },
  use: {
    baseURL: "http://localhost:5183",
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_BROWSERS_PATH ? "/opt/pw-browsers/chromium" : undefined,
    },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
