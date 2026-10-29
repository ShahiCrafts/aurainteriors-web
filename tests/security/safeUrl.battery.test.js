// FE-03 PEN-TEST BATTERY — validateMediaUrl + the imageUrl.js wrappers.
//
// Every attack case is a permanent regression test: the value must
// resolve to the fallback (helper) / type fallback (getImageUrl) /
// null (getModelUrl), NEVER to the raw value or a URL on the
// attacker's host. Positive controls pin the legitimate flows the
// audit's W11 behaviour table documented (Cloudinary, S3 GLBs,
// API-origin uploads, relative paths, legacy photo-ids, fallbacks).
//
// Test env config: VITE_API_BASE_URL=http://localhost:3001, so the
// app's own configured origin is http://localhost:3001 (dev-style) —
// http is accepted for THAT origin only.

import { describe, it, expect } from "vitest";
import { validateMediaUrl } from "../../src/utils/safeUrl";
import {
  getImageUrl,
  getProductImageUrl,
  getModelUrl,
  FALLBACK_IMAGES,
} from "../../src/utils/imageUrl";

const FB = "FALLBACK";

const ATTACKS = [
  ["javascript: scheme", "javascript:alert(1)"],
  ["mixed-case scheme", "JaVaScRiPt:alert(1)"],
  ["data: html", "data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg=="],
  ["vbscript:", "vbscript:msgbox(1)"],
  ["leading spaces before javascript:", "  javascript:alert(1)"],
  ["tab/newline inside scheme", "\tjava\nscript:alert(1)"],
  ["control char before legit-looking https", "\x01https://evil.com/x.png"],
  ["protocol-relative evil host", "//evil.com/x.png"],
  ["backslash protocol-relative", "\\/evil.com/x.png"],
  ["double-backslash host", "https:\\\\evil.com/x.png"],
  ["slash-backslash host", "https:/\\evil.com/x.png"],
  [
    "userinfo: cloudinary is the username, evil.com the host",
    "https://res.cloudinary.com@evil.com/x.png",
  ],
  ["userinfo: own host as username", "https://localhost:3001@evil.com/x.png"],
  ["percent-encoded scheme", "%6aavascript:alert(1)"],
  ["percent-encoded letter inside scheme", "java%73cript:alert(1)"],
  ["double-encoded slashes", "%252f%252fevil.com/x.png"],
  ["punycode lookalike host", "https://xn--rescloudinary-9we.com/x.png"],
  ["cyrillic lookalike host", "https://res.cloudin\u0430ry.com/x.png"],
  [
    "evil host, cloudinary-looking path",
    "https://evil.com/res.cloudinary.com/x.png",
  ],
  ["cloudinary subdomain trick", "https://res.cloudinary.com.evil.com/x.png"],
  ["cloudinary prefix trick", "https://evilres.cloudinary.com/x.png"],
  ["plain evil host", "https://evil.com/x.png"],
  ["http downgrade of a fixed https host", "http://res.cloudinary.com/x.png"],
  ["http evil host", "http://evil.com/x.png"],
  ["scheme without authority slashes", "https:evil.com/x.png"],
  ["own host, wrong port", "//localhost:3002/x.png"],
  ["own host, wrong port absolute", "http://localhost:3002/uploads/x.png"],
  ["dicebear subdomain trick", "https://api.dicebear.com.evil.com/x.png"],
  [
    "s3 lookalike suffix",
    "https://fabritor.s3.ap-southeast-1.amazonaws.com.evil.com/x.glb",
  ],
  ["ftp scheme on an allowlisted host", "ftp://res.cloudinary.com/x.png"],
  // FE-06: the avatar-placeholder host was removed from the allowlist
  // entirely — even the shape getAvatarUrl used to generate is now
  // rejected like any other non-allowlisted host.
  [
    "avatar placeholder service (FE-06 removed)",
    "https://ui-avatars.com/api/?name=A%20B&background=109383&color=fff",
  ],
];

describe("FE-03 validateMediaUrl — attack battery", () => {
  for (const [name, payload] of ATTACKS) {
    it(`rejects: ${name}`, () => {
      expect(validateMediaUrl(payload, { fallback: FB })).toBe(FB);
    });
  }

  it("rejects the CSS quote-breakout payload", () => {
    expect(
      validateMediaUrl("x');background:url(javascript:alert(1))", {
        fallback: FB,
      }),
    ).toBe(FB);
    expect(
      validateMediaUrl(
        "https://res.cloudinary.com/x.png');background:url(https://evil.com/x)",
        { fallback: FB },
      ),
    ).toBe(FB);
  });

  it("rejects a server-supplied blob: URL by default", () => {
    expect(
      validateMediaUrl(
        "blob:http://localhost:3001/550e8400-e29b-41d4-a716-446655440000",
        { fallback: FB },
      ),
    ).toBe(FB);
  });

  it("rejects non-strings and empties", () => {
    for (const v of [null, undefined, 42, {}, "", "   "]) {
      expect(validateMediaUrl(v, { fallback: FB })).toBe(FB);
    }
  });
});

describe("FE-03 validateMediaUrl — positive controls", () => {
  const POSITIVES = [
    [
      "cloudinary https image",
      "https://res.cloudinary.com/demo/image/upload/v1/sofa.jpg",
    ],
    [
      "S3 GLB on the evidenced host",
      "https://fabritor.s3.ap-southeast-1.amazonaws.com/models/sofa_chair.glb",
    ],
    [
      "S3 GLB on a bucket-pattern host",
      "https://aura-models.s3.eu-west-1.amazonaws.com/models/chair.glb",
    ],
    [
      "API-origin uploads over configured http (dev)",
      "http://localhost:3001/uploads/products/a.jpg",
    ],
    [
      "API-origin over https (upgrade of own host)",
      "https://localhost:3001/uploads/products/a.jpg",
    ],
    ["fallback constant", FALLBACK_IMAGES.product],
  ];
  for (const [name, url] of POSITIVES) {
    it(`accepts: ${name}`, () => {
      expect(validateMediaUrl(url, { fallback: FB })).toBe(url);
    });
  }

  it("accepts a protocol-relative cloudinary URL, normalised to https", () => {
    expect(
      validateMediaUrl("//res.cloudinary.com/demo/x.jpg", { fallback: FB }),
    ).toBe("https://res.cloudinary.com/demo/x.jpg");
  });

  it("passes site-relative and bare relative paths through unchanged", () => {
    expect(validateMediaUrl("/uploads/products/a.jpg", { fallback: FB })).toBe(
      "/uploads/products/a.jpg",
    );
    expect(validateMediaUrl("uploads/products/a.jpg", { fallback: FB })).toBe(
      "uploads/products/a.jpg",
    );
  });

  it("accepts blob: only when allowBlob is set (optimistic preview)", () => {
    const blob =
      "blob:http://localhost:3001/550e8400-e29b-41d4-a716-446655440000";
    expect(validateMediaUrl(blob, { fallback: FB, allowBlob: true })).toBe(
      blob,
    );
  });

  it("chat restriction: external-photo/S3 hosts are NOT allowed when allowedHosts is set", () => {
    const chat = { fallback: FB, allowedHosts: ["res.cloudinary.com"] };
    expect(validateMediaUrl("https://api.dicebear.com/x.jpg", chat)).toBe(
      FB,
    );
    expect(
      validateMediaUrl(
        "https://fabritor.s3.ap-southeast-1.amazonaws.com/x.glb",
        chat,
      ),
    ).toBe(FB);
    expect(validateMediaUrl("https://res.cloudinary.com/x.jpg", chat)).toBe(
      "https://res.cloudinary.com/x.jpg",
    );
    expect(
      validateMediaUrl("http://localhost:3001/uploads/chat/x.jpg", chat),
    ).toBe("http://localhost:3001/uploads/chat/x.jpg");
  });
});

describe("FE-03 getImageUrl — W11 behaviour table, hardened rows", () => {
  it("row 2: arbitrary http(s) hosts no longer pass verbatim → product fallback", () => {
    expect(getImageUrl("https://evil.com/x.jpg", "products")).toBe(
      FALLBACK_IMAGES.product,
    );
    expect(getImageUrl("http://evil.com/x.jpg", "products")).toBe(
      FALLBACK_IMAGES.product,
    );
  });

  it("row 6: protocol-relative evil host → fallback, not a passthrough", () => {
    expect(getImageUrl("//evil.com/x.jpg", "products")).toBe(
      FALLBACK_IMAGES.product,
    );
  });

  it("row 7: schemeless cloudinary still resolves, substring tricks do not", () => {
    expect(getImageUrl("res.cloudinary.com/demo/x.jpg", "products")).toBe(
      "https://res.cloudinary.com/demo/x.jpg",
    );
    expect(getImageUrl("//res.cloudinary.com/demo/x.jpg", "products")).toBe(
      "https://res.cloudinary.com/demo/x.jpg",
    );
    expect(
      getImageUrl("evil.example/res.cloudinary.com/x.jpg", "products"),
    ).toBe(FALLBACK_IMAGES.product);
    expect(
      getImageUrl("res.cloudinary.com.evil.example/x.jpg", "products"),
    ).toBe(FALLBACK_IMAGES.product);
  });

  it("rows 8/10/11/12: legitimate flows unchanged", () => {
    // Phase 2: bare legacy photo IDs no longer expand to an external
    // host — they resolve to the local fallback.
    expect(getImageUrl("photo-1555041469-a586c61ea9bc", "products")).toBe(
      FALLBACK_IMAGES.product,
    );
    expect(getImageUrl("uploads/foo.jpg", "products")).toBe(
      "http://localhost:3001/uploads/foo.jpg",
    );
    expect(getImageUrl("products/foo.jpg", "products")).toBe(
      "http://localhost:3001/uploads/products/foo.jpg",
    );
    expect(getImageUrl("foo.jpg", "products")).toBe(
      "http://localhost:3001/uploads/products/foo.jpg",
    );
    expect(
      getImageUrl("https://res.cloudinary.com/demo/x.jpg", "products"),
    ).toBe("https://res.cloudinary.com/demo/x.jpg");
    expect(
      getImageUrl("http://localhost:3001/uploads/products/a.jpg", "products"),
    ).toBe("http://localhost:3001/uploads/products/a.jpg");
  });

  it("rows 4/5: javascript:/data: never reach a sink as such", () => {
    for (const payload of [
      "javascript:alert(1)",
      "data:text/html;base64,PHNjcmlwdD4=",
    ]) {
      const out = getImageUrl(payload, "products");
      expect(out).not.toContain("javascript:");
      expect(out.startsWith("data:")).toBe(false);
      expect(out).toBe(FALLBACK_IMAGES.product);
    }
  });
});

describe("FE-03 getProductImageUrl / getModelUrl", () => {
  it("product image on an evil host → fallback; cloudinary → kept", () => {
    expect(getProductImageUrl({ image: "https://evil.com/x.jpg" })).toBe(
      FALLBACK_IMAGES.product,
    );
    expect(
      getProductImageUrl({
        images: [{ url: "https://res.cloudinary.com/demo/x.jpg" }],
      }),
    ).toBe("https://res.cloudinary.com/demo/x.jpg");
    expect(getProductImageUrl({ image: "uploads/p.jpg" })).toBe(
      "http://localhost:3001/uploads/p.jpg",
    );
  });

  it("model URL on the evidenced S3 host → kept; evil host → null (not a JPEG fallback)", () => {
    const glb =
      "https://fabritor.s3.ap-southeast-1.amazonaws.com/models/sofa_chair.glb";
    expect(getModelUrl({ modelUrl: glb })).toBe(glb);
    expect(getModelUrl({ modelUrl: "https://evil.com/x.glb" })).toBeNull();
    expect(
      getModelUrl({
        modelFiles: [
          { format: "glb", url: "https://evil.com/x.glb", isExternal: true },
        ],
      }),
    ).toBeNull();
    expect(
      getModelUrl({
        modelFiles: [{ format: "glb", url: glb, isExternal: true }],
      }),
    ).toBe(glb);
  });
});
