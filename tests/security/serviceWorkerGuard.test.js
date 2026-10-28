// FE-57 GUARD — no service worker may ship unregistered, and none may
// be registered without a deliberate, reviewed re-introduction.
//
// History: public/service-worker.js shipped in both dists (public/ is
// copied wholesale) but nothing ever registered it — grep over src/,
// index.html, index.admin.html, vite.config.* and tests/ found zero
// `serviceWorker.register` calls (the only `service-worker` hit was a
// comment in vite.config.js), zero workbox and zero vite-pwa references.
// The file was inert today but carried real defects (duplicate
// `badge`/`tag` object keys) and a stale-cache trap if ever registered
// unreviewed, so it was deleted (FE-57). This guard pins BOTH halves of
// that decision: no registration call in src/, and no service-worker
// file under public/. Re-introducing a worker must remove/adjust this
// guard in the same change that reviews and registers it.

import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const SRC_ROOT = path.join(ROOT, "src");
const PUBLIC_ROOT = path.join(ROOT, "public");

function collectSourceFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...collectSourceFiles(full));
    else if (/\.(js|jsx)$/.test(entry)) out.push(full);
  }
  return out;
}

describe("FE-57 service worker guard", () => {
  it("no src file registers a service worker", () => {
    const hits = [];
    for (const file of collectSourceFiles(SRC_ROOT)) {
      const rel = path.relative(ROOT, file);
      readFileSync(file, "utf8")
        .split("\n")
        .forEach((line, i) => {
          if (
            /serviceWorker\s*\.\s*register|navigator\s*\.\s*serviceWorker/.test(
              line,
            )
          ) {
            hits.push(`${rel}:${i + 1} ${line.trim()}`);
          }
        });
    }
    expect(hits).toEqual([]);
  });

  it("no service-worker file exists under public/", () => {
    const hits = [];
    if (existsSync(PUBLIC_ROOT)) {
      for (const entry of readdirSync(PUBLIC_ROOT)) {
        if (/service[-_]?worker/i.test(entry)) hits.push(`public/${entry}`);
      }
    }
    expect(hits).toEqual([]);
    expect(existsSync(path.join(PUBLIC_ROOT, "service-worker.js"))).toBe(false);
  });
});
