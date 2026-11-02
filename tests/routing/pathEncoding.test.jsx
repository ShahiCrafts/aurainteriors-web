// FE-12 — link / URL construction sites interpolated slugs and names
// into paths and query strings unencoded. A slug 'a/b?x=1#y' reshaped
// the route (extra segment, query split, fragment truncation) and a
// category name like 'Chairs & Tables' split the query string.
//
// Render tests pin the named sites; a source guard pins the class for
// every template-built route path in src/ (files owned by another
// Phase 4 worker this wave — ProductCard.jsx, BlogDetailsPage.jsx —
// are excluded from the guard and listed for the coordinator).
import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

describe("FE-12 — class guard: no raw template route-path interpolation remains in src/", () => {
  const SRC_ROOT = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../src",
  );
  // Owned by another Phase 4 worker this wave — reported to the
  // coordinator instead of edited here.
  const EXCLUDED_FILES = new Set([
    "src/components/shop/ProductCard.jsx",
  ]);
  // FE-03's media-URL helper joins a validated base + storage path;
  // storage keys legitimately contain '/', route params do not live
  // here. API modules are guarded separately in
  // tests/api/pathEncoding.test.js.
  const EXCLUDED_PREFIXES = ["src/utils/imageUrl.js", "src/api/"];

  function collect(dir) {
    const out = [];
    for (const entry of readdirSync(dir)) {
      const full = path.join(dir, entry);
      if (statSync(full).isDirectory()) out.push(...collect(full));
      else if (/\.(js|jsx)$/.test(entry)) out.push(full);
    }
    return out;
  }

  it("every `/…/${…}` route template wraps its segment in encodeURIComponent", () => {
    const offenders = [];
    for (const file of collect(SRC_ROOT)) {
      const rel = path.relative(path.resolve(SRC_ROOT, ".."), file);
      if (EXCLUDED_FILES.has(rel)) continue;
      if (EXCLUDED_PREFIXES.some((p) => rel.startsWith(p))) continue;
      readFileSync(file, "utf8")
        .split("\n")
        .forEach((line, i) => {
          // A path segment interpolation: '/' immediately before ${...}
          // inside a template literal that is a route/URL path.
          for (const m of line.matchAll(/\/\$\{([^}]*)\}/g)) {
            if (!m[1].startsWith("encodeURIComponent(")) {
              offenders.push(`${rel}:${i + 1}: ${line.trim()}`);
            }
          }
          // Query value interpolation: '?name=${...}' must be encoded
          // (or built with URLSearchParams, which never appears in this
          // template form).
          for (const m of line.matchAll(/[?&][A-Za-z]+=\$\{([^}]*)\}/g)) {
            if (!m[1].startsWith("encodeURIComponent(")) {
              offenders.push(`${rel}:${i + 1}: ${line.trim()}`);
            }
          }
        });
    }
    expect(offenders).toEqual([]);
  });
});
