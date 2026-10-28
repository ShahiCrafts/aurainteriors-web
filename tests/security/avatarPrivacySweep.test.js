// FE-06 PEN-TEST GATE — no user name may leave for a placeholder /
// avatar service, ever again.
//
// FE-06's root cause: getAvatarUrl built
// `https://ui-avatars.com/api/?name=<full name>&…` for every
// avatar-less user, and five chat components rebuilt the same URL
// inline as <img> onError fallbacks — customer PII in a third-party
// request on every render. The fix renders initials locally
// (InitialsAvatar / UserAvatar) and getAvatarUrl returns only a real
// validated avatar URL or null.
//
// This sweep is the permanent regression net for the CLASS: the
// literal service host may not appear anywhere in src/ — not in code,
// not in a comment, and not in the safeUrl media allowlist (which
// only ever allowed it because getAvatarUrl generated those URLs).

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

describe("FE-06 avatar privacy sweep (pen-test gate)", () => {
  it("no file in src/ references the external avatar service", () => {
    const files = collectSourceFiles(SRC_ROOT);
    expect(files.length).toBeGreaterThan(100); // the sweep really ran

    const hits = [];
    for (const file of files) {
      const rel = path.relative(path.resolve(SRC_ROOT, ".."), file);
      readFileSync(file, "utf8")
        .split("\n")
        .forEach((line, i) => {
          if (line.includes("ui-avatars.com")) {
            hits.push(`${rel}:${i + 1} ${line.trim()}`);
          }
        });
    }
    expect(hits).toEqual([]);
  });

  it("the safeUrl media allowlist no longer contains the avatar service", () => {
    const safeUrlSource = readFileSync(
      path.join(SRC_ROOT, "utils/safeUrl.js"),
      "utf8",
    );
    expect(safeUrlSource).not.toContain("ui-avatars.com");
  });

  it("no src/ file builds a URL from a name (no name= construction, no interpolated DiceBear seed)", () => {
    // The pen-test framing: a name containing URL-hostile characters
    // ('A & B ?x=', quotes, emoji) must have NO code path that can
    // turn it into a request. Post-fix there is no avatar/placeholder
    // URL construction from a name at all. Testimonials.jsx keeps
    // STATIC DiceBear URLs whose seeds are in-file fictional
    // editorial literals (audit-verified, not user data) — only an
    // INTERPOLATED seed would be a hit, and the literal URLs contain
    // no "seed=${".
    const files = collectSourceFiles(SRC_ROOT);
    const hits = [];
    for (const file of files) {
      const rel = path.relative(path.resolve(SRC_ROOT, ".."), file);
      readFileSync(file, "utf8")
        .split("\n")
        .forEach((line, i) => {
          if (/api\/\?name=/.test(line)) {
            hits.push(
              `${rel}:${i + 1} [name= URL construction] ${line.trim()}`,
            );
          }
          if (/seed=\$\{/.test(line)) {
            hits.push(`${rel}:${i + 1} [interpolated seed] ${line.trim()}`);
          }
        });
    }
    expect(hits).toEqual([]);
  });
});
