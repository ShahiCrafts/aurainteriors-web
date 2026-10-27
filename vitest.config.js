import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Test convention (Phase 0): tests live in a top-level `tests/` tree that
// mirrors `src/` (e.g. tests/store/authStore.test.js), plus
// tests/security/ for the pen-test battery ports. Test files are named
// `*.test.{js,jsx}`. Application code is never colocated with tests.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // REUSE-015: the former "react-toastify" alias was removed with
      // the dependency — src and tests both import src/lib/toast.js
      // directly now.
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.js"],
    include: ["tests/**/*.test.{js,jsx}"],
    env: {
      // Same placeholder the audit/baseline builds use; tests mock the
      // network layer, this only satisfies config resolution.
      VITE_API_BASE_URL: "http://localhost:3001",
    },
  },
});
