// applyHead (Batch 3b): the existing SEO mechanism now takes its
// fallbacks from the site-settings bridge once settings have loaded,
// and from the original constants before that.
import { afterEach, describe, expect, it } from "vitest";
import { applyHead } from "../../src/seo/seo.js";
import {
  setSeoDefaultsFromSettings,
  __resetSeoDefaults,
} from "../../src/seo/settingsBridge.js";

afterEach(() => {
  __resetSeoDefaults();
  document.head.innerHTML = "";
  document.title = "";
});

describe("applyHead fallbacks", () => {
  it("uses the built-in constants before settings load", () => {
    applyHead({ path: "/some-page" });
    expect(document.title).toBe("Aura Interiors");
    expect(
      document.head.querySelector('meta[name="description"]').getAttribute("content"),
    ).toContain("made for Nepali homes");
    expect(
      document.head.querySelector('meta[property="og:image"]').getAttribute("content"),
    ).toBe("https://www.aurainteriors.live/promo-ad-banner.webp");
  });

  it("uses the admin's SEO defaults after settings load", () => {
    setSeoDefaultsFromSettings({
      defaultTitle: "Himalaya Living – Home",
      metaDescription: "Admin-written description",
      ogImage: "https://cdn.example/og.webp",
      twitterCard: "summary",
    });
    applyHead({ path: "/some-page" });
    expect(document.title).toBe("Himalaya Living – Home");
    expect(
      document.head.querySelector('meta[name="description"]').getAttribute("content"),
    ).toBe("Admin-written description");
    expect(
      document.head.querySelector('meta[property="og:image"]').getAttribute("content"),
    ).toBe("https://cdn.example/og.webp");
    expect(
      document.head.querySelector('meta[name="twitter:card"]').getAttribute("content"),
    ).toBe("summary");
  });

  it("substitutes {store_name} in the default title pattern", () => {
    setSeoDefaultsFromSettings(
      {
        defaultTitle: "{store_name} – Furniture for Nepali Homes",
        metaDescription: "Desc",
        ogImage: "",
      },
      "Himalaya Living",
    );
    applyHead({ path: "/p" });
    expect(document.title).toBe(
      "Himalaya Living – Furniture for Nepali Homes",
    );
  });

  it("openGraph / twitterCards feature gates suppress those tag groups", () => {
    setSeoDefaultsFromSettings({
      defaultTitle: "T",
      metaDescription: "D",
      ogImage: "https://cdn.example/og.webp",
      features: { openGraph: false, twitterCards: false },
    });
    applyHead({ path: "/p", title: "Page", description: "Page desc" });
    expect(
      document.head.querySelector('meta[property="og:title"]'),
    ).toBeNull();
    expect(
      document.head.querySelector('meta[name="twitter:card"]'),
    ).toBeNull();
    // The plain description meta is not part of either group.
    expect(
      document.head.querySelector('meta[name="description"]'),
    ).not.toBeNull();
  });

  it("autoGenerateMeta off: no fallback title/description is invented", () => {
    setSeoDefaultsFromSettings({
      defaultTitle: "Default Title",
      metaDescription: "Default description",
      ogImage: "",
      features: { autoGenerateMeta: false },
    });
    applyHead({ path: "/p" });
    expect(document.title).toBe("");
    expect(
      document.head.querySelector('meta[name="description"]'),
    ).toBeNull();
    // Explicit page values still apply.
    applyHead({ path: "/p", title: "Explicit", description: "Explicit desc" });
    expect(document.title).toBe("Explicit");
  });

  it("indexingEnabled false forces robots noindex, nofollow", () => {
    setSeoDefaultsFromSettings({
      defaultTitle: "T",
      metaDescription: "D",
      ogImage: "",
      indexingEnabled: false,
    });
    applyHead({ path: "/p" });
    expect(
      document.head
        .querySelector('meta[name="robots"]')
        .getAttribute("content"),
    ).toBe("noindex, nofollow");
  });

  it("noindexPages adds robots noindex on matching routes only", () => {
    setSeoDefaultsFromSettings({
      defaultTitle: "T",
      metaDescription: "D",
      ogImage: "",
      noindexPages: ["cart", "checkout"],
    });
    applyHead({ path: "/cart" });
    expect(
      document.head
        .querySelector('meta[name="robots"]')
        .getAttribute("content"),
    ).toBe("noindex, nofollow");
    applyHead({ path: "/shop" });
    expect(
      document.head
        .querySelector('meta[name="robots"]')
        .getAttribute("content"),
    ).toBe("index, follow");
  });

  it("canonicalUrl overrides the canonical base", () => {
    setSeoDefaultsFromSettings({
      defaultTitle: "T",
      metaDescription: "D",
      ogImage: "",
      canonicalUrl: "https://shop.example.com/",
    });
    applyHead({ path: "/some-page" });
    expect(
      document.head
        .querySelector('link[rel="canonical"]')
        .getAttribute("href"),
    ).toBe("https://shop.example.com/some-page");
  });

  it("productSchema / breadcrumbs gates filter runtime JSON-LD", () => {
    setSeoDefaultsFromSettings({
      defaultTitle: "T",
      metaDescription: "D",
      ogImage: "",
      features: { productSchema: false, breadcrumbs: false },
    });
    applyHead({
      path: "/product/x",
      jsonLd: [
        { "@type": "Product", name: "Sofa" },
        { "@type": "BreadcrumbList", itemListElement: [] },
        { "@type": "Organization", name: "Aura" },
      ],
    });
    const scripts = [
      ...document.head.querySelectorAll('script[type="application/ld+json"]'),
    ].map((s) => s.textContent);
    expect(scripts.some((t) => t.includes('"Product"'))).toBe(false);
    expect(scripts.some((t) => t.includes("BreadcrumbList"))).toBe(false);
    expect(scripts.some((t) => t.includes("Organization"))).toBe(true);
  });

  it("explicit page title/description always win over the defaults", () => {
    setSeoDefaultsFromSettings({
      defaultTitle: "Default Title",
      metaDescription: "Default description",
      ogImage: "",
      twitterCard: "",
    });
    applyHead({ title: "Page Title", description: "Page description", path: "/p" });
    expect(document.title).toBe("Page Title");
    expect(
      document.head.querySelector('meta[name="description"]').getAttribute("content"),
    ).toBe("Page description");
  });
});
