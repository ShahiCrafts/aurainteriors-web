#!/usr/bin/env node
/**
 * SEC-004 (remediation): fail if package-lock.json contains a dependency
 * resolved from a non-registry source outside the allow-list.
 * Allowed: registry.npmjs.org tarballs, and local file: vendor tarballs
 * (vendored, integrity-hashed — e.g. vendor/capacitor-arcore-*.tgz).
 * Anything else (git+..., http(s):// tarballs from CDNs, etc.) fails.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const lock = JSON.parse(readFileSync(join(root, "package-lock.json"), "utf8"));
const bad = [];
for (const [path, pkg] of Object.entries(lock.packages || {})) {
  const r = pkg.resolved;
  if (!r) continue;
  if (r.startsWith("https://registry.npmjs.org/")) continue;
  if (r.startsWith("file:vendor/")) continue;
  bad.push(`${path || "(root)"}: ${r}`);
}
if (bad.length) {
  console.error("check-dependency-sources: non-registry/non-vendored resolutions found:");
  for (const b of bad) console.error(`  ${b}`);
  process.exit(1);
}
console.log("check-dependency-sources: all resolutions are registry or vendored file: tarballs.");
