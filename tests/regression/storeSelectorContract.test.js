// Store-selector contract sweep (regression guard, added 2026-10-27).
//
// The bug this guards against: a Zustand object selector whose
// returned keys are RENAMED (e.g. `getGuestCartTotals:
// state.getCartTotals`) paired with a destructure that still asks
// for the store's RAW key names (`const { getCartTotals:
// getGuestCartTotals } = useGuestCartStore(useShallow(...))`).
// Every renamed binding is then silently `undefined`, and the first
// call site crashes at runtime ("getGuestCartTotals is not a
// function") — while mocked component tests keep passing, because
// their store mocks ignore the selector argument entirely.
//
// This sweep scans every src file for the inline pattern
//   const { ... } = useXStore(useShallow((state) => ({ ... })))
// (and the same shape without useShallow) and asserts that every
// destructured key is actually provided by the selector object.
// It would have flagged all three defective sites (CartSlider,
// CheckoutPage, PersonalInformation) and passes on the fixed tree.

import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SRC_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../src",
);

function listSourceFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return listSourceFiles(full);
    return /\.(jsx?|tsx?)$/.test(entry.name) ? [full] : [];
  });
}

const PATTERN =
  /const\s*\{([^}]*)\}\s*=\s*use\w+Store\(\s*(?:useShallow\(\s*)?\(?state\)?\s*=>\s*\(\{([^}]*)\}\)/g;

function keysOf(list) {
  return list
    .split(",")
    .map((part) => part.split(":")[0].split("=")[0].trim())
    .filter(Boolean);
}

describe("Zustand selector/destructure contract", () => {
  it("every destructured key is provided by its object selector", () => {
    const violations = [];
    for (const file of listSourceFiles(SRC_ROOT)) {
      const source = readFileSync(file, "utf8");
      for (const match of source.matchAll(PATTERN)) {
        const destructured = keysOf(match[1]);
        const provided = keysOf(match[2]);
        const missing = destructured.filter((k) => !provided.includes(k));
        if (missing.length > 0) {
          violations.push(
            `${path.relative(SRC_ROOT, file)}: destructures [${missing.join(", ")}] ` +
              `but the selector provides [${provided.join(", ")}]`,
          );
        }
      }
    }
    expect(violations).toEqual([]);
  });
});
