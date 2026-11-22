// Loads every Markdown file from ../../docs and exposes it by slug.
// Slug "" is the docs/README.md index; "features/payments" maps to
// docs/features/payments.md.
const modules = import.meta.glob("../../docs/**/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
});

export const pages = {};
for (const [key, content] of Object.entries(modules)) {
  const rel = key.replace("../../docs/", "").replace(/\.md$/, "");
  const slug = rel === "README" ? "" : rel;
  pages[slug] = content;
}

export function titleOf(slug, content) {
  const m = content.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : slug;
}

// Sidebar structure — mirrors docs/README.md.
export const NAV = [
  { group: "Getting Started", items: ["getting-started/introduction", "getting-started/quick-start", "getting-started/installation", "getting-started/project-structure"] },
  { group: "Development", items: ["development/architecture", "development/frontend-architecture", "development/styling-and-theming", "development/routing-and-seo", "development/testing"] },
  { group: "Features", items: ["features/storefront-and-catalog", "features/cart-checkout-and-orders", "features/payments", "features/accounts-and-auth", "features/admin-panel", "features/store-settings-and-integrations", "features/ai-support-chat", "features/ar-experience"] },
  { group: "API Reference", items: ["api/overview", "api/endpoints", "api/data-models"] },
  { group: "Deployment", items: ["deployment/environment-variables", "deployment/deployment-guide", "deployment/operations-and-troubleshooting", "deployment/backup-and-restore"] },
  { group: "Handover", items: ["handover/asset-inventory-and-transfer", "handover/known-limitations", "handover/licenses"] },
  { group: "Owner & Support", items: ["owner/owner-handbook", "support/faq"] },
];

export const FLAT = ["", ...NAV.flatMap((g) => g.items)];

export function resolveMdLink(currentSlug, href) {
  if (!href || href.startsWith("http") || href.startsWith("#") || href.startsWith("mailto:")) return null;
  const clean = href.split("#")[0];
  if (!clean.endsWith(".md")) return null;
  const base = currentSlug.split("/").slice(0, -1);
  for (const part of clean.split("/")) {
    if (part === "..") base.pop();
    else if (part !== "." && part !== "") base.push(part);
  }
  let slug = base.join("/").replace(/\.md$/, "");
  if (slug === "README") slug = "";
  return "/" + slug;
}
