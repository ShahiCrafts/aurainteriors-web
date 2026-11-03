// SEO builders shared by the runtime <Seo> component (applyHead) and the
// build-time prerenderer (headHtml in scripts/prerender.mjs re-implements
// the same tag set in Node — keep the two in step when editing).
//
// Guardrails (from the 2026-11-02 research):
// - AggregateRating is emitted ONLY from real review data. The catalog
//   currently has none, so productJsonLd omits it unless genuine
//   rating.average/count values exist on the product.
// - No FAQPage / SearchAction schema: FAQ rich results were removed by
//   Google in May 2026 and the sitelinks searchbox in Nov 2024.
import {
  SITE_URL,
  SITE_NAME,
  SITE_DESCRIPTION,
  CONTACT,
  DEFAULT_OG_IMAGE,
  LOGO_URL,
  absoluteUrl,
} from "./site.js";

export const organizationJsonLd = () => ({
  "@context": "https://schema.org",
  "@type": "FurnitureStore",
  "@id": `${SITE_URL}/#organization`,
  name: SITE_NAME,
  url: SITE_URL,
  logo: LOGO_URL,
  description: SITE_DESCRIPTION,
  email: CONTACT.email,
  telephone: CONTACT.phoneInternational,
  address: {
    "@type": "PostalAddress",
    streetAddress: CONTACT.street,
    addressLocality: CONTACT.city,
    addressRegion: CONTACT.region,
    addressCountry: CONTACT.countryCode,
  },
  areaServed: { "@type": "Country", name: "Nepal" },
});

export const websiteJsonLd = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  name: SITE_NAME,
  url: SITE_URL,
  publisher: { "@id": `${SITE_URL}/#organization` },
});

export const breadcrumbJsonLd = (items) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: item.name,
    item: absoluteUrl(item.path),
  })),
});

export const itemListJsonLd = (products) => ({
  "@context": "https://schema.org",
  "@type": "ItemList",
  itemListElement: products.map((p, i) => ({
    "@type": "ListItem",
    position: i + 1,
    url: absoluteUrl(`/product/${encodeURIComponent(p.slug)}`),
    name: p.name,
  })),
});

export const productJsonLd = (product) => {
  const price = Number(product.priceFrom ?? product.price);
  const images = (product.images || []).map((img) =>
    typeof img === "string" ? img : img.url,
  ).filter(Boolean);
  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription || product.description || "",
    sku: product.sku || undefined,
    category: product.category?.name || undefined,
    image: images.length ? images : undefined,
    brand: { "@type": "Brand", name: SITE_NAME },
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/product/${encodeURIComponent(product.slug)}`),
      priceCurrency: "NPR",
      price: Number.isFinite(price) && price > 0 ? price : undefined,
      availability:
        Number(product.stock) > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@id": `${SITE_URL}/#organization` },
    },
  };
  // Real reviews only — never emit rating markup for unrated products.
  const rating = product.rating || {};
  if (Number(rating.count) > 0 && Number(rating.average) > 0) {
    data.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: Number(rating.average),
      reviewCount: Number(rating.count),
    };
  }
  const props = [];
  const d = product.dimensions || {};
  if (d.width && d.height && d.depth) {
    props.push({
      "@type": "PropertyValue",
      name: "Dimensions",
      value: `${d.width} × ${d.depth} × ${d.height} ${d.unit || "cm"} (W × D × H)`,
    });
  }
  if (Array.isArray(product.materials) && product.materials.length) {
    props.push({
      "@type": "PropertyValue",
      name: "Materials",
      value: product.materials.join(", "),
    });
  }
  if (props.length) data.additionalProperty = props;
  return data;
};

// Runtime head application for client-side navigation. Tags written here
// carry data-seo="runtime" so the next page can replace exactly its own.
export function applyHead({ title, description, path = "/", image, type = "website", noindex = false, jsonLd = [] }) {
  if (typeof document === "undefined") return;
  const url = absoluteUrl(path);
  document.title = title || SITE_NAME;

  const upsertMeta = (selector, attrs) => {
    let el = document.head.querySelector(selector);
    if (!el) {
      el = document.createElement("meta");
      document.head.appendChild(el);
    }
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    el.setAttribute("data-seo", "runtime");
  };
  upsertMeta('meta[name="description"]', { name: "description", content: description || SITE_DESCRIPTION });
  upsertMeta('meta[name="robots"]', { name: "robots", content: noindex ? "noindex, nofollow" : "index, follow" });
  upsertMeta('meta[property="og:title"]', { property: "og:title", content: title || SITE_NAME });
  upsertMeta('meta[property="og:description"]', { property: "og:description", content: description || SITE_DESCRIPTION });
  upsertMeta('meta[property="og:url"]', { property: "og:url", content: url });
  upsertMeta('meta[property="og:type"]', { property: "og:type", content: type });
  upsertMeta('meta[property="og:image"]', { property: "og:image", content: image || DEFAULT_OG_IMAGE });
  upsertMeta('meta[name="twitter:card"]', { name: "twitter:card", content: "summary_large_image" });
  upsertMeta('meta[name="twitter:title"]', { name: "twitter:title", content: title || SITE_NAME });
  upsertMeta('meta[name="twitter:description"]', { name: "twitter:description", content: description || SITE_DESCRIPTION });
  upsertMeta('meta[name="twitter:image"]', { name: "twitter:image", content: image || DEFAULT_OG_IMAGE });

  let canonical = document.head.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.setAttribute("rel", "canonical");
    document.head.appendChild(canonical);
  }
  canonical.setAttribute("href", url);
  canonical.setAttribute("data-seo", "runtime");

  document.head
    .querySelectorAll('script[type="application/ld+json"][data-seo="runtime"]')
    .forEach((el) => el.remove());
  jsonLd.filter(Boolean).forEach((obj) => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute("data-seo", "runtime");
    script.textContent = JSON.stringify(obj);
    document.head.appendChild(script);
  });
}
