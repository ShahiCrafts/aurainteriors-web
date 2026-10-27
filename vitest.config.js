import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vitest/config";

// Test convention (Phase 0): tests live in a top-level `tests/` tree that
// mirrors `src/` (e.g. tests/store/authStore.test.js), plus
// tests/security/ for the pen-test battery ports. Test files are named
// `*.test.{js,jsx}`. Application code is never colocated with tests.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Mirror the production alias in vite.config.js so imports of
      // "react-toastify" resolve to the app's own toast implementation.
      "react-toastify": path.resolve("./src/lib/toast.js"),
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
