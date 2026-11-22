import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

// The documentation content lives in ../docs (the repo's Markdown docs).
// The build bundles those .md files as raw strings; fs.allow only matters
// for the dev server.
export default defineConfig({
  plugins: [react()],
  server: {
    fs: {
      allow: [fileURLToPath(new URL("..", import.meta.url))],
    },
  },
});
