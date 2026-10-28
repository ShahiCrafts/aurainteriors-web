// FE-07 GUARD — the chat empty-state animation must never again pull
// a runtime from a third-party CDN.
//
// History: @lottiefiles/dotlottie-web resolved its WASM runtime from
// the unpkg CDN at runtime, and its installed loader (0.76.0) keeps
// that URL as an immutable backup even when setWasmUrl() points the
// primary at a local asset — so the player was dropped for a CSS/SVG
// animation (see src/components/chat/DotLottieAnimation.jsx). This
// static scan fails if any src file imports a @lottiefiles package
// again or mentions the CDN domain, so re-adding the player (in any
// file, not just the chat widget) trips the suite instead of
// silently re-introducing FE-07. The built-bundle side of the same
// guarantee is verified by grepping dist for the CDN domain after
// each release build (see the FE-07 commit body).

import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SRC_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../src",
);

function collectSourceFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...collectSourceFiles(full));
    else if (/\.(js|jsx)$/.test(entry)) out.push(full);
  }
  return out;
}

describe("FE-07 dotlottie CDN guard", () => {
  const files = collectSourceFiles(SRC_ROOT);
  const rel = (f) => path.relative(path.resolve(SRC_ROOT, ".."), f);

  it("no src file imports a @lottiefiles package", () => {
    const hits = [];
    for (const file of files) {
      readFileSync(file, "utf8")
        .split("\n")
        .forEach((line, i) => {
          if (
            /from\s+["']@lottiefiles\/|import\(\s*["']@lottiefiles\/|require\(\s*["']@lottiefiles\//.test(
              line,
            )
          ) {
            hits.push(`${rel(file)}:${i + 1} ${line.trim()}`);
          }
        });
    }
    expect(hits).toEqual([]);
  });

  it("no src file references the unpkg CDN domain", () => {
    const hits = [];
    for (const file of files) {
      readFileSync(file, "utf8")
        .split("\n")
        .forEach((line, i) => {
          if (/unpkg\.com/.test(line))
            hits.push(`${rel(file)}:${i + 1} ${line.trim()}`);
        });
    }
    expect(hits).toEqual([]);
  });
});
