import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import fs from "fs";

export default defineConfig(({ mode }) => {
  const isAdmin = mode === "admin";

  return {
  // ── Plugins ────────────────────────────────────────────────────────────────
  // adminHtmlEntry: dev-server only plugin.
  // Vite always serves index.html for the root request regardless of --mode.
  // This plugin intercepts "/" and "/index.html" and rewrites the URL to
  // "/index.admin.html" so that the admin dev server (port 5174) loads
  // main.admin.jsx → AdminApp.jsx instead of main.jsx → customer App.jsx.
  plugins: [
    react(),
    tailwindcss(),
    isAdmin && {
      name: "admin-html-entry",
      configureServer(server) {
        // Intercept HTML document requests for routes before Vite's own SPA
        // middleware serves index.html, and serve index.admin.html instead.
        server.middlewares.use(async (req, res, next) => {
          try {
            const accept = req.headers.accept || "";
            if (!accept.includes("text/html")) return next();

            const url = req.url?.split("?")[0] ?? "/";
            const hasFileExtension = /\.\w+$/.test(url);
            if (hasFileExtension) return next();

            const adminHtml = fs.readFileSync(
              path.resolve("index.admin.html"),
              "utf-8"
            );
            const transformed = await server.transformIndexHtml(
              req.url ?? "/",
              adminHtml
            );
            res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
            res.end(transformed);
          } catch (e) {
            next(e);
          }
        });
      },
    },
  ].filter(Boolean),

  resolve: {
    dedupe: ["three", "react", "react-dom"],
    alias: {
      three: path.resolve("./node_modules/three"),
      // Map every `import { toast } from "react-toastify"` to our custom
      // implementation. This means zero per-file import changes are needed,
      // react-toastify ships 0 bytes to the bundle, and we own the full design.
      "react-toastify": path.resolve("./src/lib/toast.js"),
    },
  },

  // optimizeDeps is dev-server only — keep capacitor-arcore pre-bundled.
  // 'three' is intentionally excluded: it's only consumed by lazy AR routes,
  // so pre-bundling it eagerly wastes dev-server start time.
  optimizeDeps: {
    include: ["capacitor-arcore"],
  },

  build: {
    // Target modern browsers to enable smaller output (no legacy transforms).
    target: "es2020",

    // Each mode emits into its own directory so the two builds never collide.
    outDir: isAdmin ? "dist/admin" : "dist/customer",

    // Override the HTML entry point for the admin build.
    // The customer build uses the default index.html → src/main.jsx.
    // The admin build uses index.html but we swap the script tag via rollupOptions.
    rollupOptions: {
      // Point Rollup at the correct JS entry for each build target.
      input: isAdmin
        ? { main: "index.admin.html" }
        : undefined, // default: index.html

      output: {
        /**
         * Manual chunk strategy:
         *  - vendor-react   → React runtime (tiny, shared everywhere)
         *  - vendor-query   → TanStack Query (shared everywhere after init)
         *  - vendor-three   → three.js (~600 KB) — only AR routes need it
         *  - vendor-charts  → recharts + d3 — only admin dashboard needs it
         *  - vendor-xlsx    → xlsx — only admin export needs it
         *  - vendor-motion  → framer-motion — only ChatWidget (lazy) needs it
         *  - vendor-socket  → socket.io-client — only chat needs it
         *
         * Everything else falls through to Rollup's automatic chunking.
         */
        manualChunks(id) {
          // ── React core runtime ──────────────────────────────────────────
          if (
            id.includes("/node_modules/react/") ||
            id.includes("/node_modules/react-dom/") ||
            id.includes("/node_modules/scheduler/")
          ) {
            return "vendor-react";
          }

          // ── React Router ───────────────────────────────────────────────
          if (id.includes("/node_modules/react-router")) {
            return "vendor-router";
          }

          // ── TanStack Query ─────────────────────────────────────────────
          if (id.includes("/node_modules/@tanstack/")) {
            return "vendor-query";
          }

          // ── three.js (used only by lazy AR routes) ─────────────────────
          if (id.includes("/node_modules/three/")) {
            return "vendor-three";
          }

          // ── recharts + d3 (used only by admin dashboard) ───────────────
          if (
            id.includes("/node_modules/recharts/") ||
            id.includes("/node_modules/d3-") ||
            id.includes("/node_modules/victory-")
          ) {
            return "vendor-charts";
          }

          // ── xlsx (used only by admin exports) ──────────────────────────
          if (id.includes("/node_modules/xlsx/")) {
            return "vendor-xlsx";
          }

          // ── framer-motion (used only by lazy ChatWidget) ───────────────
          if (id.includes("/node_modules/framer-motion/")) {
            return "vendor-motion";
          }

          // ── socket.io-client (used only by lazy chat) ──────────────────
          if (
            id.includes("/node_modules/socket.io-client/") ||
            id.includes("/node_modules/engine.io-client/") ||
            id.includes("/node_modules/@socket.io/")
          ) {
            return "vendor-socket";
          }

          // ── lottie-react (used only by lazy NotFoundPage) ──────────────
          if (id.includes("/node_modules/lottie-react/") || id.includes("/node_modules/lottie-web/")) {
            return "vendor-lottie";
          }
        },
      },
    },
  },
  }; // ← closes the return object
}); // ← closes defineConfig(() => { ... })

