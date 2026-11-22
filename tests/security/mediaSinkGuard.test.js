// FE-03 GUARD — static scan for raw media sinks in src/.
//
// What this covers (and fails on):
//  1. Passthrough idioms outside the helper modules (safeUrl.js /
//     imageUrl.js): startsWith('http…') shortcut returns, an
//     isExternalUrl helper, and CSS url('…') string interpolation of
//     a non-static value.
//  2. Every JSX src={…} / href={…} attribute whose expression is not
//     a string literal and does not evidently flow through the safe
//     helpers (validateMediaUrl / get*Url family / a variable those
//     helpers produced). Known pre-existing expressions that do not
//     flow through the helpers are enumerated in ALLOWLIST with a
//     reason — a NEW raw sink fails this test until it is either
//     migrated or explicitly allowlisted with evidence.
//
// What it does NOT cover: sinks built without JSX attributes
// (element.src assignments, setAttribute, native AR loader inputs —
// getModelUrl is covered by the battery instead), and the semantic
// safety of allowlisted expressions (each carries its reason below).

import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SRC_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../src",
);
const HELPER_FILES = new Set(["src/utils/safeUrl.js", "src/utils/imageUrl.js"]);

const PASSTHROUGH_PATTERNS = [
  { id: "http-prefix-passthrough", regex: /\.startsWith\(\s*["']https?:/ },
  {
    id: "http-prefix-passthrough-loose",
    regex: /\.startsWith\(\s*["']http["']\)/,
  },
  { id: "is-external-url-helper", regex: /isExternalUrl/ },
];

// Expressions that evidently flow through the safe helpers.
const SAFE_EXPRESSION =
  /validateMediaUrl|validateExternalUrl|validatedSourceLogo|validatedOriginalUrl|safeActionUrl|actionTarget|announcementImage|getImageUrl|getProductImageUrl|getAvatarUrl|getBlogImageUrl|getCategoryImageUrl|getChatImageUrl|getUserAvatar|getAuthorAvatar|getProductImage|safeSrc|fullUrl/;

// file (repo-relative) + substring of the sink expression + reason.
const ALLOWLIST = [
  {
    file: "src/components/ar/components/ProductCatalog.jsx",
    expr: "imageUrl",
    reason:
      "Local const assigned from getProductImage(product) (the imageUrl helper family) in the same file.",
  },
  {
    file: "src/components/shop/ProductCard.jsx",
    expr: "imageUrl",
    reason:
      "Local const from getProductImageUrl(product) via useMemo in the same file.",
  },
  {
    file: "src/components/fallbacks/ImageWithFallback.jsx",
    expr: "imgSrc",
    reason:
      "Presentational component: callers pass an already-built src prop; its own state only swaps to the caller-supplied fallback on error.",
  },
  {
    file: "src/pages/admin/categories/CategoryFormModal.jsx",
    expr: "imagePreview",
    reason:
      "Local file-picker preview (FileReader/object URL of a file the admin just chose), not a server field. (Phase 7: entry moved with the code from src/pages/admin/Categories.jsx.)",
  },
  {
    file: "src/pages/admin/products/ProductImageUploader.jsx",
    expr: "preview.url",
    reason:
      "Local image-preview state for files the admin just selected in the product form. (Phase 7: entry moved with the code from src/pages/admin/Products.jsx.)",
  },
  {
    file: "src/pages/shop/product-details/Gallery.jsx",
    expr: "arIcon",
    reason:
      "Bundled static icon import. (Phase 7: entry moved with the code from src/pages/shop/ProductDetailsPage.jsx.)",
  },
  {
    file: "src/components/sections/Hero.jsx",
    expr: "slides[",
    reason:
      "In-file static slide literals (bundled local WebP variant imports, Phase 2 self-hosted), not server data. FE-06-adjacent editorial content.",
  },
  {
    file: "src/components/sections/Hero.jsx",
    expr: "SlideSrc",
    reason:
      "Local consts (mainSlideSrc / sideSlideSrc / decorSlideSrc) built from bundled local WebP variant imports in the same file (Phase 2 self-hosted hero imagery); compile-time constants, not server data.",
  },
  {
    file: "src/components/sections/Testimonials.jsx",
    expr: "item.avatar",
    reason:
      "In-file static testimonial literals (DiceBear seeds are fictional names — audit-verified), not server data.",
  },
  {
    file: "src/components/sections/BrandMarquee.jsx",
    expr: "brand.logo",
    reason:
      "FE-06: in-file static literals pointing at SELF-HOSTED files under public/brands/ (fetched from the publishers' CDNs once, verified real images <100 KB); no third-party request at render time.",
  },
  {
    file: "src/components/common/InitialsAvatar.jsx",
    expr: "avatarUrl",
    reason:
      "FE-06 UserAvatar: local const assigned from getAvatarUrl(user) (a validateMediaUrl-checked URL or null) in the same file; renders InitialsAvatar when null or after an img error — there is no network fallback.",
  },
  {
    file: "src/components/chat/BotMarkdown.jsx",
    expr: "cleanHref",
    reason:
      "Markdown link renderer (moved from ChatMessage.jsx by FE-49's lazy split, config unchanged): href comes through react-markdown's URL sanitisation and a /product/ rewrite in the same function; covered by tests/security/markdownUrls.test.jsx.",
  },
  {
    file: "src/pages/admin/AdminLoginPage.jsx",
    expr: "s.image",
    reason:
      "CSS url() over CAROUSEL_SLIDES — in-file static bundled local asset imports (Phase 2 self-hosted), not server data (passthrough-pattern allowlist).",
    pattern: "css-url-interpolation",
  },
  {
    file: "src/components/common/PromoCard.jsx",
    expr: "safeHref",
    reason:
      "Local const assigned from safeActionUrl(ctaHref) in the same file — the project's safe-URL helper itself; a null result renders an inert span, never the anchor (pinned by tests/components/common/PromoCard.test.jsx).",
  },
  {
    file: "src/components/modals/AuthModal.jsx",
    expr: "authPremiumInteriors",
    reason:
      "Bundled static asset import (Phase 2 self-hosted photo), compile-time constant — same class as the arIcon bundled-icon entry.",
  },
  {
    file: "src/layouts/customer/Footer.jsx",
    expr: "promoNewsletterInspiration",
    reason:
      "CSS url() over a bundled static asset import (Phase 2 self-hosted newsletter photo), not server data.",
    pattern: "css-url-interpolation",
  },
  {
    file: "src/components/common/PromoCard.jsx",
    expr: "image.src",
    reason:
      "PromoCard's image prop is supplied by the calling sections with bundled static asset imports (Vite-emitted /assets URLs, compile-time constants) per the component contract — not a server field. Same class as the arIcon bundled-icon entry.",
  },
  {
    file: "src/layouts/customer/Footer.jsx",
    expr: "esewaLogo",
    reason:
      "Bundled static import of the official eSewa logo (src/assets/images/payments/, self-hosted 2026-11-03 to replace the hot-linked favpng JPG), compile-time constant — same class as the arIcon bundled-icon entry.",
  },
  {
    file: "src/layouts/customer/Footer.jsx",
    expr: "khaltiLogo",
    reason:
      "Bundled static import of the official Khalti logo (src/assets/images/payments/, from Khalti's official docs; replaced the khaltibyime hot-link that now 404s), compile-time constant — same class as the arIcon entry.",
  },
  {
    file: "src/layouts/customer/Footer.jsx",
    expr: "mastercardLogo",
    reason:
      "Bundled static import of the official Mastercard logo (src/assets/images/payments/, as published from brand.mastercard.com), compile-time constant — same class as the arIcon entry.",
  },
  {
    file: "src/layouts/customer/Footer.jsx",
    expr: "visaLogo",
    reason:
      "Bundled static import of the official Visa logo (src/assets/images/payments/, as published from visa.com; replaces the previous styled-text 'VISA' span), compile-time constant — same class as the arIcon entry.",
  },
  // Batch 3b (site settings): the expressions below render
  // admin-entered settings values, each sanitised in-file first.
  {
    file: "src/components/sections/Hero.jsx",
    expr: "mainImg.src",
    reason:
      "Batch 3b: local const from resolveHeroImage in the same file — a bundled variant import, or a settings URL passed through validateMediaUrl, or the bundled fallback when validation rejects it.",
  },
  {
    file: "src/components/sections/Hero.jsx",
    expr: "sideImg.src",
    reason:
      "Batch 3b: same resolveHeroImage provenance as mainImg.src above.",
  },
  {
    file: "src/components/sections/Hero.jsx",
    expr: "promoImg.src",
    reason:
      "Batch 3b: same resolveHeroImage provenance as mainImg.src above.",
  },
  {
    file: "src/layouts/customer/Navbar.jsx",
    expr: "safeLogoUrl",
    reason:
      "Batch 3b: local const assigned from validateMediaUrl(settings identity.logoUrl) in the same file, falling back to the bundled /logo-aura-interiors.webp path.",
  },
  {
    file: "src/layouts/customer/Footer.jsx",
    expr: "logoSrc",
    reason:
      "Batch 3b: local const assigned from validateMediaUrl(settings identity.logoUrl) in the same file, falling back to the bundled /logo-aura-interiors.webp path.",
  },
  {
    file: "src/layouts/admin/AdminSidebar.jsx",
    expr: "safeLogoUrl",
    reason:
      "Admin theme fix: local const assigned from validateMediaUrl(settings identity.logoUrl) in the same file, falling back to the bundled /logo-aura-interiors.webp path — same pattern as the Navbar/Footer entries above.",
  },
  {
    file: "src/layouts/customer/Footer.jsx",
    expr: "safeSocialHref",
    reason:
      "Batch 3b: in-file helper that returns the settings social URL only when URL-parsing yields an http:/https: protocol, otherwise the historical '#' placeholder.",
  },
  {
    file: "src/pages/info/MaintenancePage.jsx",
    expr: "mailto:",
    reason:
      "Batch 5: mailto: composed by a template literal whose scheme is fixed in the source; the interpolated value is the admin-set support email (plain text, React-escaped as an attribute value) and cannot introduce a different scheme. Same class as the ContentPage supportEmail entry.",
  },
  {
    file: "src/pages/info/MaintenancePage.jsx",
    expr: "tel:",
    reason:
      "Batch 5: tel: composed by a template literal whose scheme is fixed in the source; the interpolated value is the admin-set contact phone with whitespace stripped, React-escaped as an attribute value, and cannot introduce a different scheme.",
  },
  {
    file: "src/pages/info/ContentPage.jsx",
    expr: "supportEmail",
    reason:
      "Batch 3b: mailto: composed by a template literal whose scheme is fixed in the source; the interpolated value is the admin-set support email (plain text, React-escaped as an attribute value) and cannot introduce a different scheme.",
  },
  // Batch 3d (admin Settings redesign): the expressions below are
  // previews INSIDE the admin panel of values the signed-in admin
  // themselves entered or uploaded through the settings API (their
  // own store's logo / hero / share images and map embed). They are
  // never rendered on the public storefront from these components —
  // the storefront consumers of the same fields (Navbar, Footer,
  // Hero) pass them through validateMediaUrl (allowlisted above).
  // Same trust class as the CategoryFormModal / ProductImageUploader
  // local-preview entries.
  {
    file: "src/components/admin/settings/StorePreview.jsx",
    expr: "logoSrc",
    reason:
      "Batch 3d: admin Settings mini-preview; logoSrc is the admin-entered identity logo URL (light/dark variant) shown back to the admin in the admin panel only.",
  },
  {
    file: "src/components/admin/settings/StorePreview.jsx",
    expr: "heroImage",
    reason:
      "Batch 3d: admin Settings mini-preview; heroImage is the first enabled hero slide image URL from the admin's own homepage settings, admin panel only.",
  },
  {
    file: "src/components/admin/settings/tabs/IdentityTab.jsx",
    expr: "value",
    reason:
      "Batch 3d: LogoUploadCard preview img; value is the logo URL the admin typed or just uploaded via the settings image endpoint, admin panel only.",
  },
  {
    file: "src/components/admin/settings/tabs/IdentityTab.jsx",
    expr: "identity.faviconUrl",
    reason:
      "Batch 3d: favicon preview img of the admin-entered favicon URL, admin panel only.",
  },
  {
    file: "src/components/admin/settings/tabs/SeoTab.jsx",
    expr: "seo.ogImage",
    reason:
      "Batch 3d: share-image preview thumbnail of the admin-entered/uploaded OG image URL, admin panel only.",
  },
  {
    file: "src/components/admin/settings/tabs/SeoTab.jsx",
    expr: "identity.faviconUrl",
    reason:
      "Batch 3d: Google-result SEO preview favicon of the admin-entered favicon URL, admin panel only.",
  },
  {
    file: "src/components/admin/settings/tabs/HomepageTab.jsx",
    expr: "src",
    reason:
      "Batch 3d: SlideThumb preview img; src is the hero/promo image URL from the admin's own homepage settings, admin panel only.",
  },
  {
    file: "src/components/admin/settings/tabs/HomepageTab.jsx",
    expr: "slide.imageUrl",
    reason:
      "Batch 3d: SlideThumb src prop passed the admin's own hero slide image URL, admin panel only.",
  },
  {
    file: "src/components/admin/settings/tabs/HomepageTab.jsx",
    expr: "homepage.promoBanner.imageUrl",
    reason:
      "Batch 3d: SlideThumb src prop passed the admin's own promo banner image URL, admin panel only.",
  },
  {
    file: "src/components/admin/settings/tabs/ContactTab.jsx",
    expr: "contact.mapUrl",
    reason:
      "Batch 3d: Store Location preview iframe; renders only when the admin-entered mapUrl contains google + embed/maps (in-file isMapEmbed check), admin panel only.",
  },
  {
    file: "src/components/chat/ChatInput.jsx",
    expr: "entry.blobUrl",
    reason:
      "Local optimistic attachment preview: blobUrl is minted in the same file by URL.createObjectURL(file) for a file the user just picked (line ~171) and revoked on remove/send; a server payload cannot supply it. Same class as the CategoryFormModal file-picker preview entry.",
  },
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

describe("FE-03 media sink guard", () => {
  const files = collectSourceFiles(SRC_ROOT);
  const rel = (f) => path.relative(path.resolve(SRC_ROOT, ".."), f);

  it("no http-prefix passthrough idiom survives outside the helpers", () => {
    const hits = [];
    for (const file of files) {
      if (HELPER_FILES.has(rel(file))) continue;
      readFileSync(file, "utf8")
        .split("\n")
        .forEach((line, i) => {
          for (const { id, regex } of PASSTHROUGH_PATTERNS) {
            if (regex.test(line))
              hits.push(`${rel(file)}:${i + 1} [${id}] ${line.trim()}`);
          }
        });
    }
    expect(hits).toEqual([]);
  });

  it("no CSS url('…') interpolation outside the validated magnifier / static slides", () => {
    const hits = [];
    for (const file of files) {
      readFileSync(file, "utf8")
        .split("\n")
        .forEach((line, i) => {
          if (/url\('\$\{|url\("\$\{|url\(`\$\{/.test(line)) {
            const allowed =
              rel(file) === "src/components/shop/ImageMagnifier.jsx" || // interpolates safeSrc (validated)
              ALLOWLIST.some(
                (a) =>
                  a.file === rel(file) && a.pattern === "css-url-interpolation",
              );
            if (!allowed) hits.push(`${rel(file)}:${i + 1} ${line.trim()}`);
          }
        });
    }
    expect(hits).toEqual([]);
  });

  it("every JSX src/href expression flows through a safe helper or is allowlisted", () => {
    expect(files.length).toBeGreaterThan(100);
    const hits = [];
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      const lines = text.split("\n");
      lines.forEach((line, i) => {
        const m = line.match(/(?:src|href)=\{([^}]*)\}/);
        if (!m) return;
        const expr = m[1].trim();
        if (/^["']/.test(expr)) return; // string literal
        if (SAFE_EXPRESSION.test(expr)) return;
        const allowed = ALLOWLIST.some(
          (a) => a.file === rel(file) && expr.includes(a.expr),
        );
        if (!allowed) hits.push(`${rel(file)}:${i + 1} ${line.trim()}`);
      });
    }
    expect(hits).toEqual([]);
  });
});
