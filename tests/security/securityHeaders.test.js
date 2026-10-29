// SEC-001 / SEC-002 (remediation): the ENFORCING Content-Security-Policy
// in vercel.json must be the tight allowlist — no bare `https:` wildcard
// in the network/media directives, no Unsplash host anywhere — and HSTS
// must be present. nginx.conf must carry the identical enforcing policy.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const vercel = JSON.parse(readFileSync(join(root, "vercel.json"), "utf8"));
const nginx = readFileSync(join(root, "nginx.conf"), "utf8");

function headerValue(name) {
  for (const block of vercel.headers) {
    for (const h of block.headers) if (h.key === name) return h.value;
  }
  return null;
}

function directive(csp, name) {
  const part = csp
    .split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith(`${name} `));
  return part ? part.slice(name.length).trim().split(/\s+/) : [];
}

describe("security headers (SEC-001/SEC-002)", () => {
  const csp = headerValue("Content-Security-Policy");

  it("should have an enforcing CSP in vercel.json", () => {
    expect(csp).toBeTruthy();
  });

  it.each(["img-src", "connect-src", "media-src", "frame-src"])(
    "should not allow a bare https: wildcard in %s",
    (name) => {
      expect(directive(csp, name)).not.toContain("https:");
      expect(directive(csp, name)).not.toContain("http:");
    },
  );

  it("should keep script-src 'self' only", () => {
    expect(directive(csp, "script-src")).toEqual(["'self'"]);
  });

  it("should not reference Unsplash anywhere in vercel.json or nginx.conf", () => {
    expect(JSON.stringify(vercel).toLowerCase()).not.toContain("unsplash");
    expect(nginx.toLowerCase()).not.toContain("unsplash");
  });

  it("should send HSTS without preload in vercel.json", () => {
    const hsts = headerValue("Strict-Transport-Security");
    expect(hsts).toContain("max-age=31536000");
    expect(hsts).toContain("includeSubDomains");
    expect(hsts).not.toContain("preload");
  });

  it("should carry the identical enforcing CSP in nginx.conf, including in /assets/", () => {
    const occurrences = nginx.split(`add_header Content-Security-Policy "${csp}" always;`).length - 1;
    expect(occurrences).toBe(2);
    expect(nginx).toContain(
      'add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;',
    );
  });
});
