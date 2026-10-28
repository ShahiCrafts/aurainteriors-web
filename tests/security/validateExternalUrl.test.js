// FE-04 (sibling) PEN-TEST BATTERY — validateExternalUrl.
//
// BlogDetailsPage renders two server-controlled fields whose whole
// purpose is to point OFF-site: blog.originalUrl ("Read Original"
// attribution link) and blog.source.logo (publisher logo). A host
// allowlist would break the feature — any publisher host is
// legitimate — but a non-https scheme in either field must never
// survive: a `javascript:` href executes on click, and a `data:` /
// `javascript:` img src is the same class of stored-value abuse.
// validateExternalUrl therefore pins the SCHEME only (https:),
// cleans control characters before parsing (browsers ignore
// \t \n \r inside a scheme), and returns the parser-normalised
// href or null.

import { describe, it, expect } from "vitest";
import { validateExternalUrl } from "../../src/utils/safeUrl";

describe("FE-04 validateExternalUrl — attack battery", () => {
  const ATTACKS = [
    ["javascript:", "javascript:alert(1)"],
    ["mixed-case javascript:", "JaVaScRiPt:alert(1)"],
    [
      "data: html",
      "data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==",
    ],
    [
      "data: image with script payload",
      "data:image/svg+xml;base64,PHN2Zz48c2NyaXB0PmFsZXJ0KDEpPC9zY3JpcHQ+PC9zdmc+",
    ],
    ["vbscript:", "vbscript:msgbox(1)"],
    ["control-char-embedded scheme (tab)", "java\tscript:alert(1)"],
    ["control-char-embedded scheme (newline)", "jav\nascript:alert(1)"],
    ["control-char-embedded scheme (NUL)", "java\x00script:alert(1)"],
    ["leading spaces before javascript:", "   javascript:alert(1)"],
    ["leading control char before javascript:", "\x01javascript:alert(1)"],
    ["protocol-relative", "//publisher.example/article"],
    ["protocol-relative with backslash", "/\\publisher.example/article"],
    ["http: is not accepted (https only)", "http://publisher.example/article"],
    ["http: publisher logo", "http://publisher.example/logo.png"],
    ["ftp:", "ftp://publisher.example/logo.png"],
    ["blob:", "blob:https://publisher.example/550e8400"],
    ["scheme-less host", "publisher.example/article"],
    ["site-relative path", "/blog/local-post"],
    ["empty string", ""],
    ["whitespace only", "   "],
  ];
  for (const [name, payload] of ATTACKS) {
    it(`rejects: ${name}`, () => {
      expect(validateExternalUrl(payload)).toBeNull();
    });
  }

  it("rejects non-strings", () => {
    for (const v of [null, undefined, 42, {}, [], true]) {
      expect(validateExternalUrl(v)).toBeNull();
    }
  });
});

describe("FE-04 validateExternalUrl — positive controls", () => {
  it("accepts a legit https publisher article URL, returned normalised", () => {
    expect(
      validateExternalUrl("https://www.example-publisher.com/story/123"),
    ).toBe("https://www.example-publisher.com/story/123");
  });

  it("accepts a legit https publisher logo URL with a query string", () => {
    expect(
      validateExternalUrl("https://cdn.publisher.example/logo.svg?v=2"),
    ).toBe("https://cdn.publisher.example/logo.svg?v=2");
  });

  it("normalises scheme/host casing and surrounding whitespace", () => {
    expect(validateExternalUrl("  HTTPS://Publisher.Example/Article  ")).toBe(
      "https://publisher.example/Article",
    );
  });

  it("accepts any https host (attribution is the feature — no host allowlist)", () => {
    expect(validateExternalUrl("https://ekantipur.com/news/story")).toBe(
      "https://ekantipur.com/news/story",
    );
    expect(
      validateExternalUrl("https://some-brand-new-outlet.example/x.png"),
    ).toBe("https://some-brand-new-outlet.example/x.png");
  });
});
