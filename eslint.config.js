import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import jsxA11y from "eslint-plugin-jsx-a11y";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{js,jsx}"],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: "latest",
        ecmaFeatures: { jsx: true },
        sourceType: "module",
      },
    },
    rules: {
      "no-unused-vars": ["error", { varsIgnorePattern: "^[A-Z_]" }],
    },
  },
  // ── FE remediation Phase 0 promotions ──────────────────────────────────
  // The jsx-a11y recommended set is the plugin's core rule set; every rule
  // it enables is at "error" (the three rules it leaves "off" stay off).
  // rules-of-hooks and no-undef are additionally pinned to "error"
  // explicitly so the gate this remediation is measured against cannot
  // silently soften if an upstream preset changes. The gate is EXPECTED to
  // be red at Phase 0 exit (FE-13's rules-of-hooks errors are a Phase 1
  // fix); see audit/fe/remediation/BASELINE.md for the counts.
  {
    files: ["**/*.{js,jsx}"],
    plugins: { "jsx-a11y": jsxA11y },
    rules: {
      ...jsxA11y.flatConfigs.recommended.rules,
      "react-hooks/rules-of-hooks": "error",
      "no-undef": "error",
    },
  },
  // ── FE-60: model the environments the repo actually runs in ─────────
  // The base block above applies browser globals to EVERY js/jsx file,
  // which made no-undef report false positives on tooling files:
  // 'process' in vite.config.js (current vite.config.js:9, process.cwd())
  // is Node config context, not browser code. Root config/tooling files
  // (vite.config.js, vitest.config.js, this file — the only *.config.js
  // in the repo; there are no tailwind/postcss config files, Tailwind is
  // wired via the @tailwindcss/vite plugin) therefore additionally get
  // Node globals. The 'clients' service-worker false positives are gone
  // with FE-57 (the worker file was deleted, not given an env).
  {
    files: ["**/*.config.{js,jsx}"],
    languageOptions: {
      globals: globals.node,
    },
  },
  // Tests run under Vitest (globals: true in vitest.config.js) in a
  // jsdom browser-like environment, and the guard/battery tests also use
  // Node (node:fs/node:path imports, import.meta). Give the tests tree
  // the union so no-undef stays a trustworthy error there too.
  {
    files: ["tests/**/*.{js,jsx}"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node, ...globals.vitest },
    },
  },
  // ── Phase 4 (REUSE-003): no raw hex colours in class strings ────────
  // New UI primitives must use the theme tokens (bg-brand,
  // hover:bg-brand-hover, …) instead of raw hex like bg-[#F27318].
  // Scoped to components/ui for now: the legacy tree carries 100+ raw-hex
  // class strings, so widening this to all of src/ today would flood the
  // warning total and bury the signal. Widen the `files` glob as legacy
  // surfaces migrate onto the primitives. Warning level on purpose — it
  // guides new code, it does not gate the build.
  {
    files: ["src/components/ui/**/*.{js,jsx}"],
    plugins: {
      local: {
        rules: {
          "no-raw-hex-class": {
            meta: {
              type: "suggestion",
              docs: {
                description:
                  "disallow raw hex colours inside className strings; use theme tokens",
              },
            },
            create(context) {
              const HEX = /#[0-9a-fA-F]{3,8}\b/;
              const check = (node, raw) => {
                if (typeof raw !== "string" || !HEX.test(raw)) return;
                const inClassName = context.sourceCode
                  .getAncestors(node)
                  .some(
                    (ancestor) =>
                      ancestor.type === "JSXAttribute" &&
                      ancestor.name &&
                      ancestor.name.name === "className",
                  );
                if (inClassName) {
                  context.report({
                    node,
                    message:
                      "Raw hex colour in a className string — use a theme token (e.g. bg-brand, text-brand) instead.",
                  });
                }
              };
              return {
                Literal(node) {
                  if (typeof node.value === "string") check(node, node.value);
                },
                TemplateElement(node) {
                  check(node, node.value && node.value.cooked);
                },
              };
            },
          },
        },
      },
    },
    rules: {
      "local/no-raw-hex-class": "warn",
    },
  },
]);
