import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
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
    files: ['**/*.{js,jsx}'],
    plugins: { 'jsx-a11y': jsxA11y },
    rules: {
      ...jsxA11y.flatConfigs.recommended.rules,
      'react-hooks/rules-of-hooks': 'error',
      'no-undef': 'error',
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
    files: ['**/*.config.{js,jsx}'],
    languageOptions: {
      globals: globals.node,
    },
  },
  // Tests run under Vitest (globals: true in vitest.config.js) in a
  // jsdom browser-like environment, and the guard/battery tests also use
  // Node (node:fs/node:path imports, import.meta). Give the tests tree
  // the union so no-undef stays a trustworthy error there too.
  {
    files: ['tests/**/*.{js,jsx}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node, ...globals.vitest },
    },
  },
])
