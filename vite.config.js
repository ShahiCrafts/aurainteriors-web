import { resolveApiConfig } from "./src/config/apiConfig.js";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import fs from "fs";

export default defineConfig(({ mode, command }) => {
  if (command === "build")
    resolveApiConfig({ ...loadEnv(mode, process.cwd(), "VITE_"), PROD: true });
  const isAdmin = mode === "admin";

  return {
    // ── Plugins ────────────────────────────────────────────────────────────────
    // adminHtmlEntry: dev-server only plugin.
    // Vite always serves index.html for the root request regardless of --mode.
    // This plugin intercepts "/" and "/index.html" and rewrites the URL to
    // "/index.admin.html" so that the admin dev server (port 5174) loads
    // main.admin.jsx → AdminApp.jsx instead of main.jsx → customer App.jsx.
    plugins: [
      isAdmin && {
        name: "admin-production-entry",
        apply: "build",
        enforce: "post",
        generateBundle(_options, bundle) {
          const entry = bundle["index.admin.html"];
          if (!entry) throw new Error("Admin HTML entry was not generated");
          delete bundle["index.admin.html"];
          entry.fileName = "index.html";
          bundle["index.html"] = entry;
        },
      },
      // FE-50: per-mode public pruning (build only). Vite copies public/
      // wholesale into BOTH dists, so single-app assets used to ship in the
      // other app's deploy too (the 1.35 MB AR model in dist/admin, the
      // admin logo in dist/customer). This plugin removes the files the
      // current mode provably never references, after the bundle is
      // written. Reference proof per file (grep over src/**, both
      // index.html files and vite config; full evidence in
      // audit/fe/remediation/phase3-assets.md):
      //   admin-only:    logo-aura-interiors-admin.webp — src/layouts/admin/AdminLayout.jsx
      //   customer-only: sofa-chair.glb — src/pages/shop/NativeARPage.jsx
      //                  promo-ad-banner.webp  — src/pages/shop/ShopPage.jsx
      // Everything else in public/ is referenced by both apps and is never
      // pruned: favicon.png by both entries, logo-aura-interiors.webp by
      // customer chrome AND the admin login page, brands/ by BrandMarquee —
      // which the ADMIN app also renders, because its NotFoundPage (routed
      // in AdminApp.jsx) reuses the customer Footer. Dev servers are
      // unaffected (apply: "build").
      {
        name: "fe50-per-mode-public-prune",
        apply: "build",
        closeBundle() {
          const outDir = path.resolve(isAdmin ? "dist/admin" : "dist/customer");
          const drop = isAdmin
            ? ["sofa-chair.glb", "promo-ad-banner.webp"]
            : ["logo-aura-interiors-admin.webp"];
          for (const entry of drop) {
            fs.rmSync(path.join(outDir, entry), {
              recursive: true,
              force: true,
            });
          }
        },
      },
      // PERF-007: preload the LCP hero image (1200w variant) in the
      // customer build only. Done in generateBundle so the hashed
      // asset filename emitted by Vite is used verbatim.
      !isAdmin && {
        name: "perf007-hero-preload",
        apply: "build",
        enforce: "post",
        generateBundle(_options, bundle) {
          const hero = Object.values(bundle).find(
            (a) =>
              a.type === "asset" &&
              /hero-furniture-living-room-1200w-[^/]*\.webp$/.test(a.fileName),
          );
          const html = bundle["index.html"];
          if (!hero || !html || html.type !== "asset") return;
          const tag = `<link rel="preload" as="image" type="image/webp" fetchpriority="high" href="/${hero.fileName}" />`;
          html.source = String(html.source).replace("</head>", `    ${tag}\n  </head>`);
        },
      },
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
                "utf-8",
              );
              const transformed = await server.transformIndexHtml(
                req.url ?? "/",
                adminHtml,
              );
              res.writeHead(200, {
                "Content-Type": "text/html; charset=utf-8",
              });
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
        // REUSE-015: the former "react-toastify" alias to src/lib/toast.js
        // was removed — every file now imports lib/toast directly and the
        // react-toastify dependency is gone.
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
      // The admin entry is normalized to index.html by the build plugin.
      rollupOptions: {
        // Point Rollup at the correct JS entry for each build target.
        input: isAdmin ? { main: "index.admin.html" } : undefined, // default: index.html

        output: {
          /**
           * Manual chunk strategy:
           *  - vendor-react   → React runtime (tiny, shared everywhere)
           *  - vendor-query   → TanStack Query (shared everywhere after init)
           *  - vendor-three   → three.js (~600 KB) — only AR routes need it
           *  - vendor-charts  → recharts + d3 — only admin dashboard needs it
           *  - vendor-exceljs → exceljs — only admin export needs it
           *  - vendor-motion  → framer-motion — used in 30+ files across customer + admin (PERF-004: an earlier comment claiming only the lazy ChatWidget used it was stale); it is chunked separately so lazy routes do not duplicate it
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

            // ── exceljs (used only by admin exports, SEC-003) ─────────────
            if (id.includes("/node_modules/exceljs/")) {
              return "vendor-exceljs";
            }

            // ── framer-motion (used broadly; kept in its own vendor chunk) ──
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

          },
        },
      },
    },
  }; // ← closes the return object
}); // ← closes defineConfig(() => { ... })
