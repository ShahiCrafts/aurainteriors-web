#!/usr/bin/env node
/**
 * Bundle-size budget check for the CUSTOMER build (remediation Phase 8,
 * PERF-F-008).
 *
 * Reads the emitted files under dist/customer/assets and fails (exit 1)
 * if any guarded chunk exceeds its budget. Guarded chunks and budgets
 * (bytes, matching Vite's kB = bytes / 1000 reporting):
 *
 *   entry index   <= 120,000 B   (120 kB)
 *   vendor-react  <= 220,000 B   (220 kB)
 *   vendor-three  <= 650,000 B   (650 kB)
 *
 * Rationale: budgets sit roughly 10–25% above the Phase 7 (2026-10-27)
 * customer-build sizes — index 95.19 kB, vendor-react 192.50 kB,
 * vendor-three 586.59 kB — so ordinary feature work does not trip the
 * gate, but a step-change regression (a heavy dependency landing in the
 * entry graph, three.js leaking into the shared vendor chunk, etc.)
 * fails CI instead of shipping silently. If a budget is intentionally
 * raised, update the numbers here AND this comment in the same commit.
 *
 * The entry chunk is identified from dist/customer/index.html's module
 * script tag (there can be more than one `index-*.js` file in assets);
 * vendor chunks are matched by their manualChunks names from
 * vite.config.js.
 *
 * Usage: npm run build:customer && npm run check:bundle
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const distDir = join(root, "dist", "customer");
const assetsDir = join(distDir, "assets");

const BUDGETS = [
  { key: "entry index", budget: 120_000 },
  { key: "vendor-react", budget: 220_000 },
  { key: "vendor-three", budget: 650_000 },
];

function fail(message) {
  console.error(`check-bundle-budget: ${message}`);
  process.exit(1);
}

if (!existsSync(assetsDir)) {
  fail("dist/customer/assets not found — run `npm run build:customer` first.");
}

const files = readdirSync(assetsDir).filter((f) => f.endsWith(".js"));
const sizeOf = (name) => statSync(join(assetsDir, name)).size;

// Entry chunk: the module script referenced by index.html.
const html = readFileSync(join(distDir, "index.html"), "utf8");
const entryMatch = html.match(/<script[^>]+src="[^"]*\/assets\/([^"]+\.js)"/);
if (!entryMatch) fail("could not find the entry <script> in dist/customer/index.html.");
const entryName = entryMatch[1];
if (!files.includes(entryName)) fail(`entry chunk ${entryName} missing from dist/customer/assets.`);

const actual = new Map([["entry index", { name: entryName, size: sizeOf(entryName) }]]);
for (const key of ["vendor-react", "vendor-three"]) {
  const name = files.find((f) => f.startsWith(`${key}-`));
  if (!name) fail(`chunk ${key}-*.js missing from dist/customer/assets.`);
  actual.set(key, { name, size: sizeOf(name) });
}

let over = 0;
for (const { key, budget } of BUDGETS) {
  const { name, size } = actual.get(key);
  const kb = (size / 1000).toFixed(2);
  const budgetKb = (budget / 1000).toFixed(0);
  const status = size <= budget ? "ok" : "OVER BUDGET";
  if (size > budget) over += 1;
  console.log(`${key.padEnd(12)} ${name.padEnd(28)} ${kb.padStart(8)} kB / ${budgetKb} kB  ${status}`);
}

if (over > 0) {
  fail(`${over} chunk(s) exceed the bundle budget. Either shrink the chunk or raise the budget in scripts/check-bundle-budget.mjs with a justification in the same commit.`);
}
console.log("check-bundle-budget: all guarded chunks within budget.");
