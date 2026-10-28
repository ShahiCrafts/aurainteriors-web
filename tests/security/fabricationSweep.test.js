// FE-14 PEN-TEST GATE — fabrication sweep over src/.
//
// FE-14's root cause was one pattern repeated across both apps: when real
// data was absent, the UI invented realistic-looking values (ratings,
// counts, trends, AI text, countdowns) instead of showing an honest empty
// state. The Phase 1 fixes removed every audited instance and the render
// tests pin the honest states per component. This sweep is the permanent
// regression net for the CLASS: each pattern below is a verbatim artifact
// of a removed fabrication, and none of them may reappear in src/.
//
// Patterns are intentionally specific to the audited fabrications (a
// generic "no numbers in fallbacks" rule would false-positive on honest
// zero/identity defaults over real fields, which the audit explicitly
// cleared). If a future hit is genuinely real data, add it to ALLOWLIST
// with the evidence — do not delete the pattern.

import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SRC_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../src",
);

const PATTERNS = [
  // ChatConversation.jsx rendered the literal "Order #12931" for every
  // customer (the chat object has no order reference at all).
  { id: "fake-order-number", regex: /12931/ },
  // Dashboard.jsx generated sine-wave "sparklines" from Math.sin via
  // generatePlaceholderSparkline and presented them as store metrics.
  {
    id: "placeholder-sparkline-generator",
    regex: /generatePlaceholderSparkline/,
  },
  { id: "placeholder-sparkline-math", regex: /Math\.sin\(/ },
  // ProductCard.jsx derived a 4.0-4.9 "rating" by hashing the product id:
  // 4.0 + (hash % 10) / 10.
  { id: "hash-derived-rating", regex: /4\.0 \+ \(/ },
  { id: "hash-derived-rating-mod", regex: /hash % 10/ },
  // Wishlist.jsx displayed a hardcoded 4.5-star fallback for unrated
  // products: rating || 4.5.
  { id: "hardcoded-rating-fallback", regex: /\|\|\s*4\.5\b/ },
  // ProductDetailsPage.jsx fell back to the literal "200+" for a
  // soldCount field the server product model does not have.
  { id: "fake-bought-count", regex: /["']200\+["']|200\+ bought/ },
  // Hero.jsx rendered a literal aggregate "4.9/5 (2k+ Reviews)" with no
  // data source (static component, in-file marketing copy only).
  { id: "hero-aggregate-rating", regex: /4\.9\/5/ },
  { id: "hero-aggregate-count", regex: /2k\+ Reviews/ },
  // TrustBanner.jsx restarted a fake "SALE Ends In" countdown from a
  // hardcoded 04:13:31 on every page load.
  { id: "fake-sale-countdown", regex: /0?4:13:31/ },
];

// Explicit allowlist: file (repo-relative) + pattern id + justification.
const ALLOWLIST = [
  {
    file: "src/components/sections/Hero.jsx",
    pattern: "hero-aggregate-rating",
    reason:
      "Owner-directed restoration (2026-10-26) of the hero's original editorial rating copy, matching the live site — a recorded reversal of the FE-14 removal, like the TrustBanner countdown.",
  },
  {
    file: "src/components/sections/Hero.jsx",
    pattern: "hero-aggregate-count",
    reason:
      "Owner-directed restoration (2026-10-26) of the hero's original editorial rating copy, matching the live site — a recorded reversal of the FE-14 removal, like the TrustBanner countdown.",
  },
  {
    file: "src/components/sections/TrustBanner.jsx",
    pattern: "fake-sale-countdown",
    reason:
      "Comment documenting the removed FE-14 fabrication (what the code used to do), not a rendered value.",
  },
  {
    file: "src/pages/shop/product-details/PurchasePanel.jsx",
    pattern: "fake-bought-count",
    reason:
      'Comment at the fixed element documenting that the fabricated "200+" fallback was removed, not a rendered value.',
  },
];

function collectSourceFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...collectSourceFiles(full));
    else if (/\.(js|jsx)$/.test(entry)) out.push(full);
  }
  return out;
}

describe("FE-14 fabrication sweep (pen-test gate)", () => {
  it("no audited fabrication pattern reappears anywhere in src/", () => {
    const files = collectSourceFiles(SRC_ROOT);
    expect(files.length).toBeGreaterThan(100); // the sweep really ran

    const hits = [];
    for (const file of files) {
      const rel = path.relative(path.resolve(SRC_ROOT, ".."), file);
      const lines = readFileSync(file, "utf8").split("\n");
      lines.forEach((line, i) => {
        for (const { id, regex } of PATTERNS) {
          if (regex.test(line)) {
            const allowed = ALLOWLIST.some(
              (a) => a.file === rel && a.pattern === id,
            );
            if (!allowed) {
              hits.push(`${rel}:${i + 1} [${id}] ${line.trim()}`);
            }
          }
        }
      });
    }

    expect(hits).toEqual([]);
  });
});
