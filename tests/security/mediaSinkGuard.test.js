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

const SRC_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../src");
const HELPER_FILES = new Set(["src/utils/safeUrl.js", "src/utils/imageUrl.js"]);

const PASSTHROUGH_PATTERNS = [
  { id: "http-prefix-passthrough", regex: /\.startsWith\(\s*["']https?:/ },
  { id: "http-prefix-passthrough-loose", regex: /\.startsWith\(\s*["']http["']\)/ },
  { id: "is-external-url-helper", regex: /isExternalUrl/ },
];

// Expressions that evidently flow through the safe helpers.
const SAFE_EXPRESSION = /validateMediaUrl|validateExternalUrl|validatedSourceLogo|validatedOriginalUrl|safeActionUrl|actionTarget|announcementImage|getImageUrl|getProductImageUrl|getAvatarUrl|getBlogImageUrl|getCategoryImageUrl|getChatImageUrl|getUserAvatar|getAuthorAvatar|getProductImage|safeSrc|fullUrl/;

// file (repo-relative) + substring of the sink expression + reason.
const ALLOWLIST = [
  { file: "src/components/ar/components/ProductCatalog.jsx", expr: "imageUrl", reason: "Local const assigned from getProductImage(product) (the imageUrl helper family) in the same file." },
  { file: "src/components/shop/ProductCard.jsx", expr: "imageUrl", reason: "Local const from getProductImageUrl(product) via useMemo in the same file." },
  { file: "src/components/fallbacks/ImageWithFallback.jsx", expr: "imgSrc", reason: "Presentational component: callers pass an already-built src prop; its own state only swaps to the caller-supplied fallback on error." },
  { file: "src/pages/admin/categories/CategoryFormModal.jsx", expr: "imagePreview", reason: "Local file-picker preview (FileReader/object URL of a file the admin just chose), not a server field. (Phase 7: entry moved with the code from src/pages/admin/Categories.jsx.)" },
  { file: "src/pages/admin/products/ProductImageUploader.jsx", expr: "preview.url", reason: "Local image-preview state for files the admin just selected in the product form. (Phase 7: entry moved with the code from src/pages/admin/Products.jsx.)" },
  { file: "src/pages/shop/product-details/Gallery.jsx", expr: "arIcon", reason: "Bundled static icon import. (Phase 7: entry moved with the code from src/pages/shop/ProductDetailsPage.jsx.)" },
  { file: "src/components/sections/Hero.jsx", expr: "slides[", reason: "In-file static slide literals (Unsplash URLs hardcoded in the component), not server data. FE-06-adjacent editorial content." },
  { file: "src/components/sections/Hero.jsx", expr: "SlideSrc", reason: "Local consts (mainSlideSrc / sideSlideSrc / decorSlideSrc) assigned from getSizedImageUrl in utils/imageUrl over the same in-file static slide literals: getSizedImageUrl resolves through getImageUrl, so every value is validateMediaUrl-checked (FE-03) before the FE-54 WebP/size transform is applied." },
  { file: "src/components/sections/Testimonials.jsx", expr: "item.avatar", reason: "In-file static testimonial literals (DiceBear seeds are fictional names — audit-verified), not server data." },
  { file: "src/components/sections/BrandMarquee.jsx", expr: "brand.logo", reason: "FE-06: in-file static literals pointing at SELF-HOSTED files under public/brands/ (fetched from the publishers' CDNs once, verified real images <100 KB); no third-party request at render time." },
  { file: "src/components/common/InitialsAvatar.jsx", expr: "avatarUrl", reason: "FE-06 UserAvatar: local const assigned from getAvatarUrl(user) (a validateMediaUrl-checked URL or null) in the same file; renders InitialsAvatar when null or after an img error — there is no network fallback." },
  { file: "src/components/sections/BlogSection.jsx", expr: "post.author.avatarUri", reason: "Blog author avatar fields — this surface does not use getAvatarUrl and never used the external placeholder service (FE-06 census); its raw fields remain as flagged in the FE-03 report." },
  { file: "src/components/chat/BotMarkdown.jsx", expr: "cleanHref", reason: "Markdown link renderer (moved from ChatMessage.jsx by FE-49's lazy split, config unchanged): href comes through react-markdown's URL sanitisation and a /product/ rewrite in the same function; covered by tests/security/markdownUrls.test.jsx." },
  { file: "src/pages/blog/BlogDetailsPage.jsx", expr: "validatedSourceLogo", reason: "FE-04 sibling: local const assigned from validateExternalUrl(blog.source.logo) in the same file — scheme-validated (https only; any publisher host is by-design attribution). The RAW blog.source.logo expression is deliberately no longer allowlisted: a regression to raw usage fails this guard." },
  { file: "src/pages/blog/BlogDetailsPage.jsx", expr: "validatedOriginalUrl", reason: "FE-04 sibling: local const assigned from validateExternalUrl(blog.originalUrl) in the same file — scheme-validated (https only; arbitrary publisher host is the feature). The RAW blog.originalUrl expression is deliberately no longer allowlisted: a regression to raw usage fails this guard." },
  { file: "src/pages/admin/AdminLoginPage.jsx", expr: "s.image", reason: "CSS url() over CAROUSEL_SLIDES — in-file static Unsplash literals, not server data (passthrough-pattern allowlist).", pattern: "css-url-interpolation" },
  { file: "src/pages/blog/BlogDetailsPage.jsx", expr: "section.id", reason: "FE-67: TOC anchor href={`#${section.id}`} — a same-page FRAGMENT built only from page-generated ids (section-1, section-2, … assigned by src/utils/blogToc.js to headings in the SANITIZED DOM). section.id never carries author/server data (proven by tests/pages/blog/BlogDetailsPage.toc.fe67.test.jsx, including author-id and __proto__ pen tests), and a fragment href cannot navigate off-page or carry a scheme." },
  { file: "src/components/common/PromoCard.jsx", expr: "safeHref", reason: "Local const assigned from safeActionUrl(ctaHref) in the same file — the project's safe-URL helper itself; a null result renders an inert span, never the anchor (pinned by tests/components/common/PromoCard.test.jsx)." },
  { file: "src/components/ui/Breadcrumbs.jsx", expr: "safeHref", reason: "Phase 4 primitive, same pattern as PromoCard: local const assigned from safeActionUrl(item.href) in the same file — the project's safe-URL helper itself; a null result renders inert text, never the anchor (pinned by tests/components/ui/Breadcrumbs.test.jsx, including a javascript: href case)." },
  { file: "src/components/common/PromoCard.jsx", expr: "image.src", reason: "PromoCard's image prop is supplied by the calling sections with bundled static asset imports (Vite-emitted /assets URLs, compile-time constants) per the component contract — not a server field. Same class as the arIcon bundled-icon entry." },

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
      readFileSync(file, "utf8").split("\n").forEach((line, i) => {
        for (const { id, regex } of PASSTHROUGH_PATTERNS) {
          if (regex.test(line)) hits.push(`${rel(file)}:${i + 1} [${id}] ${line.trim()}`);
        }
      });
    }
    expect(hits).toEqual([]);
  });

  it("no CSS url('…') interpolation outside the validated magnifier / static slides", () => {
    const hits = [];
    for (const file of files) {
      readFileSync(file, "utf8").split("\n").forEach((line, i) => {
        if (/url\('\$\{|url\("\$\{|url\(`\$\{/.test(line)) {
          const allowed =
            rel(file) === "src/components/shop/ImageMagnifier.jsx" || // interpolates safeSrc (validated)
            ALLOWLIST.some((a) => a.file === rel(file) && a.pattern === "css-url-interpolation");
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
          (a) => a.file === rel(file) && expr.includes(a.expr)
        );
        if (!allowed) hits.push(`${rel(file)}:${i + 1} ${line.trim()}`);
      });
    }
    expect(hits).toEqual([]);
  });
});
