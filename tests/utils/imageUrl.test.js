// FE-54 (a) — responsive image transforms in src/utils/imageUrl.js.
//
// Pre-fix: no size/quality transform was ever appended for
// uploaded/external images — a 4000-px original was served into
// 300-px card slots at ~50 call sites (only the fallback
// constants carried w=800). The fix adds sized variants ONLY where
// the host has a known transform scheme (Cloudinary's transformation
// segment; imgix-style width params on the former external photo host). URLs on hosts with no known
// scheme are returned byte-identical, and every FE-03 safe-URL
// behaviour (allowlist, hostile-value rejection to the fallback)
// is unchanged — these tests pin both halves.

import { describe, it, expect } from "vitest";
import {
  getImageUrl,
  getProductImageUrl,
  getCategoryImageUrl,
  getSizedImageUrl,
  buildImageSrcSet,
  getProductImageSrcSet,
  FALLBACK_IMAGES,
} from "../../src/utils/imageUrl.js";

const CLOUDINARY =
  "https://res.cloudinary.com/demo/image/upload/v1234/sofa.jpg";
const S3 = "https://fabritor.s3.ap-southeast-1.amazonaws.com/models/chair.jpg";

describe("getSizedImageUrl (FE-54)", () => {
  it("a Cloudinary URL gains the standard width + auto quality/format segment", () => {
    expect(getSizedImageUrl(CLOUDINARY, 400)).toBe(
      "https://res.cloudinary.com/demo/image/upload/w_400,q_auto,f_webp/v1234/sofa.jpg",
    );
    expect(getSizedImageUrl(CLOUDINARY, 1200)).toBe(
      "https://res.cloudinary.com/demo/image/upload/w_1200,q_auto,f_webp/v1234/sofa.jpg",
    );
  });

  it("a Cloudinary URL without a version segment is transformed too", () => {
    expect(
      getSizedImageUrl(
        "https://res.cloudinary.com/demo/image/upload/sofa.jpg",
        320,
      ),
    ).toBe(
      "https://res.cloudinary.com/demo/image/upload/w_320,q_auto,f_webp/sofa.jpg",
    );
  });

  it("an already-transformed Cloudinary URL has its size/format params replaced (never a stale single variant)", () => {
    const already =
      "https://res.cloudinary.com/demo/image/upload/w_800,q_auto,f_webp/v1/sofa.jpg";
    expect(getSizedImageUrl(already, 400)).toBe(
      "https://res.cloudinary.com/demo/image/upload/w_400,q_auto,f_webp/v1/sofa.jpg",
    );
  });

  it("non-size params of an existing Cloudinary transform (crop, gravity) survive the resize", () => {
    expect(
      getSizedImageUrl(
        "https://res.cloudinary.com/demo/image/upload/c_fill,g_auto,w_800/v1/sofa.jpg",
        600,
      ),
    ).toBe(
      "https://res.cloudinary.com/demo/image/upload/w_600,q_auto,f_webp,c_fill,g_auto/v1/sofa.jpg",
    );
  });

  it("the standard widths produce three genuinely different variants even for a pre-transformed URL", () => {
    const already =
      "https://res.cloudinary.com/demo/image/upload/w_800,q_auto,f_webp/v1/sofa.jpg";
    const srcSet = buildImageSrcSet(already, [600, 1200, 1920]);
    expect(srcSet).toContain("w_600,q_auto,f_webp");
    expect(srcSet).toContain("600w");
    expect(srcSet).toContain("w_1200,q_auto,f_webp");
    expect(srcSet).toContain("1200w");
    expect(srcSet).toContain("w_1920,q_auto,f_webp");
    expect(srcSet).toContain("1920w");
  });

  it("a non-allowlisted external photo URL resolves to the local fallback, untransformed (Phase 2)", () => {
    const sized = getSizedImageUrl(
      "https://cdn.example/photo-123?w=800&auto=format&fit=crop",
      1200,
    );
    expect(sized).toBe(FALLBACK_IMAGES.product);
  });

  it("getProductImageSrcSet defaults to the standard widths (600/1200/1920)", () => {
    const product = { images: [{ url: CLOUDINARY, isPrimary: true }] };
    const srcSet = getProductImageSrcSet(product);
    expect(srcSet).toContain("600w");
    expect(srcSet).toContain("1200w");
    expect(srcSet).toContain("1920w");
  });

  it("an unknown-host URL is returned byte-identical (no transform scheme, no corruption)", () => {
    expect(getSizedImageUrl(S3, 400)).toBe(S3);
  });

  it("the local fallback asset has no transform scheme: sized requests return it unchanged (Phase 2)", () => {
    expect(getSizedImageUrl(FALLBACK_IMAGES.product, 400)).toBe(
      FALLBACK_IMAGES.product,
    );
  });

  it("invalid widths leave the resolved URL unchanged", () => {
    expect(getSizedImageUrl(CLOUDINARY, 0)).toBe(CLOUDINARY);
    expect(getSizedImageUrl(CLOUDINARY, NaN)).toBe(CLOUDINARY);
    expect(getSizedImageUrl(CLOUDINARY, -50)).toBe(CLOUDINARY);
  });

  it("FE-03 hostile behaviour is unchanged: rejected values resolve to the local fallback, never a transform of the raw value", () => {
    for (const hostile of [
      "javascript:alert(1)",
      "https://res.cloudinary.com.evil.com/x.jpg",
      "https://evil.example/x.jpg",
    ]) {
      const resolved = getSizedImageUrl(hostile, 400);
      // The raw value never survives; what renders is the local
      // self-hosted fallback image (Phase 2: a bundled WebP asset,
      // returned unchanged — local assets have no transform scheme).
      expect(resolved).toBe(FALLBACK_IMAGES.product);
      expect(resolved).not.toContain("javascript:");
      expect(resolved).not.toContain("evil");
      expect(FALLBACK_IMAGES.product.endsWith(".webp")).toBe(true);
    }
  });
});

describe("buildImageSrcSet (FE-54)", () => {
  it("builds width-descriptor entries from the sized Cloudinary variants", () => {
    expect(buildImageSrcSet(CLOUDINARY, [400, 800])).toBe(
      "https://res.cloudinary.com/demo/image/upload/w_400,q_auto,f_webp/v1234/sofa.jpg 400w, " +
        "https://res.cloudinary.com/demo/image/upload/w_800,q_auto,f_webp/v1234/sofa.jpg 800w",
    );
  });

  it("returns undefined for a host with no transform scheme (a srcSet of identical URLs would lie to the browser)", () => {
    expect(buildImageSrcSet(S3, [400, 800])).toBeUndefined();
  });

  it("getProductImageSrcSet builds variants for the product's primary image", () => {
    const product = { images: [{ url: CLOUDINARY, isPrimary: true }] };
    const srcSet = getProductImageSrcSet(product, [400, 800]);
    expect(srcSet).toContain("w_400,q_auto,f_webp");
    expect(srcSet).toContain("400w");
    expect(srcSet).toContain("800w");
  });
});

describe("getImageUrl — web-public seed paths (Phase 6 regression)", () => {
  it("returns a site-relative /images/seed/ path unchanged, never joined onto the uploads origin", () => {
    expect(getImageUrl("/images/seed/seed-luxury-living-room.webp", "products")).toBe(
      "/images/seed/seed-luxury-living-room.webp",
    );
  });

  it("resolves seeded product and category images to the web origin path", () => {
    const product = {
      images: [{ url: "/images/seed/seed-bedroom-bed-linen.webp", isPrimary: true }],
    };
    expect(getProductImageUrl(product)).toBe("/images/seed/seed-bedroom-bed-linen.webp");
    expect(getCategoryImageUrl("/images/seed/seed-house-exterior-evening.webp")).toBe(
      "/images/seed/seed-house-exterior-evening.webp",
    );
  });

  it("builds no srcSet for seed paths (no transform scheme — identical variants would lie)", () => {
    expect(
      buildImageSrcSet("/images/seed/seed-luxury-living-room.webp", [600, 1200]),
    ).toBeUndefined();
  });

  it("still joins a bare upload filename onto the uploads origin", () => {
    expect(getImageUrl("sofa-123.jpg", "products")).toMatch(
      /\/uploads\/products\/sofa-123\.jpg$/,
    );
  });
});
