// FE-04 GUARD — the pre-fix actionUrl string-surgery pattern must not
// return: no `.replace("/admin", …)` and no unencoded
// `?highlight=${…}` interpolation anywhere in src/ outside the
// safeActionUrl helper (src/utils/safeUrl.js), which is the only
// place either transformation may live.

import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SRC_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../src",
);

const PATTERNS = [
  { id: "admin-string-replace", regex: /\.replace\(\s*["']\/admin["']/ },
  { id: "unencoded-highlight-interpolation", regex: /\?highlight=\$\{/ },
  { id: "unencoded-highlight-concat", regex: /["']\?highlight=["']\s*\+/ },
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

describe("FE-04 actionUrl guard", () => {
  it("no actionUrl string surgery survives outside safeUrl.js", () => {
    const files = collectSourceFiles(SRC_ROOT);
    expect(files.length).toBeGreaterThan(100);
    const hits = [];
    for (const file of files) {
      const rel = path.relative(path.resolve(SRC_ROOT, ".."), file);
      if (rel === "src/utils/safeUrl.js") continue;
      readFileSync(file, "utf8")
        .split("\n")
        .forEach((line, i) => {
          for (const { id, regex } of PATTERNS) {
            if (regex.test(line))
              hits.push(`${rel}:${i + 1} [${id}] ${line.trim()}`);
          }
        });
    }
    expect(hits).toEqual([]);
  });
});
