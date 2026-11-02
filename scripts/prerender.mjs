// Build-time prerenderer for the customer storefront.
//
// WHY: the app is a client-rendered SPA. AI crawlers (ChatGPT,
// Perplexity, Claude) do not execute JavaScript at all, and Google
// renders CSR pages in a deferred second wave — so without this step
// the catalog is effectively invisible. This script runs after
// `vite build` and writes a real HTML file per indexable route into
// dist/customer/, each with its own title, description, canonical,
// Open Graph tags, JSON-LD and a semantic content block (the same
// facts the page itself shows) inside #root. React replaces that
// content on load (createRoot render), so users get the normal app.
//
// Data comes from the LIVE API at build time (Vercel builds can reach
// it). If the API is unreachable the build FAILS on purpose — shipping
// empty prerendered pages would be worse than a failed deploy.
//
// It also generates sitemap.xml, robots.txt and llms.txt into dist.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { SITE_URL, SITE_NAME, CONTACT, formatNPR } from "../src/seo/site.js";
import {
  organizationJsonLd,
  websiteJsonLd,
  breadcrumbJsonLd,
  itemListJsonLd,
  productJsonLd,
} from "../src/seo/seo.js";
import { faqData } from "../src/data/faqData.js";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(rootDir, "..", "dist", "customer");
const API_BASE = (
  process.env.VITE_API_BASE_URL || "https://backend.aurainteriors.live"
).replace(/\/$/, "");
const API = `${API_BASE}/api/v1`;
const BUILD_DATE = new Date().toISOString().slice(0, 10);

const esc = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

async function fetchJson(url, attempts = 3) {
  let lastError;
  for (let i = 0; i < attempts; i += 1) {
    try {
      const res = await fetch(url, { headers: { accept: "application/json" } });
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      return await res.json();
    } catch (err) {
      lastError = err;
      await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
    }
  }
  throw lastError;
}

async function fetchAllProducts() {
  const products = [];
  let page = 1;
  let pages = 1;
  do {
    const json = await fetchJson(`${API}/products?status=active&limit=100&page=${page}`);
    const batch = json?.data?.products || [];
    products.push(...batch);
    pages = json?.data?.pagination?.pages || 1;
    page += 1;
  } while (page <= pages);
  return products;
}

async function fetchCategories() {
  const json = await fetchJson(`${API}/categories?limit=500`);
  return json?.data?.categories || [];
}

const headHtml = ({ title, description, path: routePath, image, type = "website", jsonLd = [] }) => {
  const url = `${SITE_URL}${routePath}`;
  const tags = [
    `<link rel="canonical" href="${esc(url)}" />`,
    `<meta name="robots" content="index, follow" />`,
    `<meta property="og:site_name" content="${esc(SITE_NAME)}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:type" content="${esc(type)}" />`,
    `<meta property="og:image" content="${esc(image || `${SITE_URL}/promo-ad-banner.webp`)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(description)}" />`,
    `<meta name="twitter:image" content="${esc(image || `${SITE_URL}/promo-ad-banner.webp`)}" />`,
    ...jsonLd
      .filter(Boolean)
      .map((obj) => `<script type="application/ld+json">${JSON.stringify(obj)}</script>`),
  ];
  return tags.join("\n    ");
};

function renderPage(template, page) {
  let html = template;
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(page.title)}</title>`);
  html = html.replace(
    /(<meta\s+name="description"\s+content=")[^"]*(")/,
    `$1${esc(page.description)}$2`,
  );
  html = html.replace("</head>", `    ${headHtml(page)}\n  </head>`);
  html = html.replace(
    '<div id="root"></div>',
    `<div id="root">\n${page.body}\n</div>`,
  );
  return html;
}

const crumbNav = (items) =>
  `<nav aria-label="Breadcrumb"><ol>${items
    .map(
      (item, i) =>
        `<li>${i < items.length - 1 ? `<a href="${esc(item.path)}">${esc(item.name)}</a>` : `<span aria-current="page">${esc(item.name)}</span>`}</li>`,
    )
    .join("")}</ol></nav>`;

const productCard = (p) => {
  const img = (p.images || []).find((i) => i?.url);
  return `<article>
    ${img ? `<img src="${esc(img.url)}" alt="${esc(img.alt || p.name)}" loading="lazy" />` : ""}
    <h3><a href="/product/${esc(p.slug)}">${esc(p.name)}</a></h3>
    <p>${esc(formatNPR(p.priceFrom ?? p.price))}${Number(p.stock) > 0 ? " – In stock" : " – Out of stock"}</p>
  </article>`;
};

const productGrid = (products) =>
  `<section>${products.map(productCard).join("\n")}</section>`;

async function main() {
  console.log(`[prerender] API: ${API}`);
  let products;
  let categories;
  let rooms;
  let collections;
  try {
    [products, categories] = await Promise.all([fetchAllProducts(), fetchCategories()]);
    const roomsJson = await fetchJson(`${API}/catalog/rooms`);
    rooms = roomsJson?.data?.rooms || [];
    const colJson = await fetchJson(`${API}/catalog/collections`);
    collections = colJson?.data?.collections || [];
  } catch (err) {
    console.error(
      `[prerender] FAILED to reach the API (${err.message}). Refusing to ship empty prerendered pages — fix API reachability and rebuild.`,
    );
    process.exit(1);
  }
  console.log(
    `[prerender] catalog: ${products.length} products, ${categories.length} categories, ${rooms.length} rooms, ${collections.length} collections`,
  );

  const template = await readFile(path.join(distDir, "index.html"), "utf8");
  const pages = []; // { path, title, description, ... , lastmod, priority }
  const baseLd = [organizationJsonLd(), websiteJsonLd()];

  // ---- Category rollups (a parent category page lists descendants' products)
  const catById = new Map(categories.map((c) => [String(c._id), c]));
  const catStats = new Map(); // id -> {count, min, max}
  const catProducts = new Map(); // id -> product[]
  const addToCat = (id, p) => {
    const key = String(id);
    const stats = catStats.get(key) || { count: 0, min: Infinity, max: 0 };
    stats.count += 1;
    const price = Number(p.priceFrom ?? p.price) || 0;
    if (price > 0) {
      stats.min = Math.min(stats.min, price);
      stats.max = Math.max(stats.max, price);
    }
    catStats.set(key, stats);
    if (!catProducts.has(key)) catProducts.set(key, []);
    catProducts.get(key).push(p);
  };
  for (const p of products) {
    const catId = p.category?._id;
    if (!catId) continue;
    addToCat(catId, p);
    const cat = catById.get(String(catId));
    for (const ancestorId of cat?.ancestors || []) addToCat(ancestorId, p);
  }
  const indexedCategories = categories.filter(
    (c) => (catStats.get(String(c._id))?.count || 0) > 0,
  );

  const categoryCrumbs = (cat) => {
    const items = [
      { name: "Home", path: "/" },
      { name: "Shop", path: "/shop" },
    ];
    const chain = (cat.ancestors || [])
      .map((id) => catById.get(String(id)))
      .filter(Boolean);
    for (const ancestor of chain) {
      items.push({ name: ancestor.name, path: `/shop/${ancestor.slug}` });
    }
    items.push({ name: cat.name, path: `/shop/${cat.slug}` });
    return items;
  };

  // ---- Home
  const topCategories = indexedCategories.filter((c) => !c.parent || !catById.has(String(c.parent)));
  const featured = [...products]
    .filter((p) => p.isFeatured)
    .concat(products.filter((p) => p.isNewArrival))
    .filter((p, i, arr) => arr.indexOf(p) === i)
    .slice(0, 12);
  pages.push({
    path: "/",
    title: "Furniture in Nepal – Buy Furniture Online | Aura Interiors",
    description:
      "Shop furniture online in Nepal: sofas, beds, dining sets, wardrobes, lighting and décor from Aura Interiors, Lalitpur – with delivery across Nepal.",
    jsonLd: baseLd,
    priority: "1.0",
    body: `<main>
      <h1>Furniture in Nepal – Aura Interiors</h1>
      <p>${esc(SITE_NAME)} is a furniture and home décor store based in ${esc(CONTACT.city)}, ${esc(CONTACT.country)}. Shop sofas, beds, dining sets, wardrobes, lighting and décor online, with delivery across Nepal. Call ${esc(CONTACT.phoneDisplay)} or email ${esc(CONTACT.email)}.</p>
      <h2>Shop by category</h2>
      <ul>${topCategories.map((c) => `<li><a href="/shop/${esc(c.slug)}">${esc(c.name)}</a> (${catStats.get(String(c._id)).count})</li>`).join("")}</ul>
      <h2>Shop by room</h2>
      <ul>${rooms.map((r) => `<li><a href="/rooms/${esc(r.slug)}">${esc(r.label)}</a></li>`).join("")}</ul>
      <h2>Featured products</h2>
      ${productGrid(featured)}
    </main>`,
  });

  // ---- Shop root
  pages.push({
    path: "/shop",
    title: "Buy Furniture Online in Nepal – Sofas, Beds, Dining & More | Aura Interiors",
    description:
      "Browse the full Aura Interiors collection: sofas, beds, dining sets, wardrobes, lighting and décor with prices in NPR and delivery across Nepal.",
    jsonLd: [
      ...baseLd,
      breadcrumbJsonLd([
        { name: "Home", path: "/" },
        { name: "Shop", path: "/shop" },
      ]),
      itemListJsonLd(products.slice(0, 24)),
    ],
    priority: "0.9",
    body: `<main>
      ${crumbNav([{ name: "Home", path: "/" }, { name: "Shop", path: "/shop" }])}
      <h1>Buy Furniture Online in Nepal</h1>
      <p>${products.length} products across ${indexedCategories.length} categories, with prices in Nepali Rupees and delivery across Nepal.</p>
      <h2>Categories</h2>
      <ul>${indexedCategories.map((c) => `<li><a href="/shop/${esc(c.slug)}">${esc(c.name)}</a> (${catStats.get(String(c._id)).count})</li>`).join("")}</ul>
      ${productGrid(products.slice(0, 24))}
    </main>`,
  });

  // ---- Category pages
  for (const cat of indexedCategories) {
    const stats = catStats.get(String(cat._id));
    const list = (catProducts.get(String(cat._id)) || []).slice(0, 48);
    const children = indexedCategories.filter((c) => String(c.parent) === String(cat._id));
    const crumbs = categoryCrumbs(cat);
    pages.push({
      path: `/shop/${cat.slug}`,
      title: `${cat.name} Price in Nepal | Buy ${cat.name} Online – Aura Interiors`,
      description:
        `${(cat.description || "").trim()} ${stats.count} designs from ${formatNPR(stats.min === Infinity ? 0 : stats.min)} to ${formatNPR(stats.max)}. Delivery across Nepal from Aura Interiors, Lalitpur.`.trim(),
      image: cat.image || undefined,
      lastmod: (cat.updatedAt || "").slice(0, 10) || undefined,
      priority: "0.8",
      jsonLd: [...baseLd, breadcrumbJsonLd(crumbs), itemListJsonLd(list)],
      body: `<main>
        ${crumbNav(crumbs)}
        <h1>${esc(cat.name)}</h1>
        ${cat.description ? `<p>${esc(cat.description)}</p>` : ""}
        <p>${stats.count} products · Prices from ${esc(formatNPR(stats.min === Infinity ? 0 : stats.min))} to ${esc(formatNPR(stats.max))} · Delivery across Nepal</p>
        ${children.length ? `<h2>Subcategories</h2><ul>${children.map((c) => `<li><a href="/shop/${esc(c.slug)}">${esc(c.name)}</a></li>`).join("")}</ul>` : ""}
        ${productGrid(list)}
      </main>`,
    });
  }

  // ---- Product pages
  for (const p of products) {
    const cat = p.category?.slug ? catById.get(String(p.category._id)) : null;
    const crumbs = [
      { name: "Home", path: "/" },
      { name: "Shop", path: "/shop" },
      ...(cat ? [{ name: cat.name, path: `/shop/${cat.slug}` }] : []),
      { name: p.name, path: `/product/${p.slug}` },
    ];
    const img = (p.images || []).find((i) => i?.url);
    const related = cat
      ? (catProducts.get(String(cat._id)) || []).filter((r) => r._id !== p._id).slice(0, 8)
      : [];
    const dims = p.dimensions || {};
    const specs = [
      dims.width && dims.height && dims.depth
        ? `Dimensions: ${dims.width} × ${dims.depth} × ${dims.height} ${dims.unit || "cm"} (W × D × H)`
        : null,
      p.weight?.value ? `Weight: ${p.weight.value} ${p.weight.unit || "kg"}` : null,
      p.materials?.length ? `Materials: ${p.materials.join(", ")}` : null,
      p.colors?.filter((c) => !String(c).startsWith("#")).length
        ? `Colours: ${p.colors.filter((c) => !String(c).startsWith("#")).join(", ")}`
        : null,
      p.style ? `Style: ${p.style}` : null,
      p.sku ? `SKU: ${p.sku}` : null,
    ].filter(Boolean);
    pages.push({
      path: `/product/${p.slug}`,
      title: `${p.metaTitle || p.name} | Aura Interiors`,
      description:
        p.metaDescription ||
        `${p.name} – ${formatNPR(p.priceFrom ?? p.price)} at Aura Interiors, Nepal. ${p.shortDescription || ""}`.trim(),
      type: "product",
      image: img?.url,
      lastmod: (p.updatedAt || "").slice(0, 10) || undefined,
      priority: "0.7",
      jsonLd: [...baseLd, productJsonLd(p), breadcrumbJsonLd(crumbs)],
      body: `<main>
        ${crumbNav(crumbs)}
        <h1>${esc(p.name)}</h1>
        ${img ? `<img src="${esc(img.url)}" alt="${esc(img.alt || p.name)}" />` : ""}
        <p><strong>${esc(formatNPR(p.priceFrom ?? p.price))}</strong>${p.originalPrice && Number(p.originalPrice) > Number(p.price) ? ` <s>${esc(formatNPR(p.originalPrice))}</s>` : ""} · ${Number(p.stock) > 0 ? "In stock" : "Out of stock"}</p>
        ${p.description ? `<p>${esc(p.description)}</p>` : ""}
        ${specs.length ? `<h2>Specifications</h2><ul>${specs.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>` : ""}
        ${related.length ? `<h2>More in ${esc(cat.name)}</h2>${productGrid(related)}` : ""}
      </main>`,
    });
  }

  // ---- Rooms
  for (const room of rooms) {
    const list = products.filter((p) => (p.roomSlugs || []).includes(room.slug)).slice(0, 48);
    if (!list.length) continue;
    const crumbs = [
      { name: "Home", path: "/" },
      { name: room.label, path: `/rooms/${room.slug}` },
    ];
    pages.push({
      path: `/rooms/${room.slug}`,
      title: `${room.label} Furniture in Nepal | Aura Interiors`,
      description:
        room.description ||
        `Shop ${room.label.toLowerCase()} furniture online in Nepal – delivery across Nepal from Aura Interiors, Lalitpur.`,
      priority: "0.7",
      jsonLd: [...baseLd, breadcrumbJsonLd(crumbs), itemListJsonLd(list)],
      body: `<main>
        ${crumbNav(crumbs)}
        <h1>${esc(room.label)} Furniture</h1>
        ${room.description ? `<p>${esc(room.description)}</p>` : ""}
        ${productGrid(list)}
      </main>`,
    });
  }

  // ---- Collections
  for (const col of collections) {
    const label = col.label || col.name || col.slug;
    const crumbs = [
      { name: "Home", path: "/" },
      { name: label, path: `/collections/${col.slug}` },
    ];
    pages.push({
      path: `/collections/${col.slug}`,
      title: `${label} | Aura Interiors Nepal`,
      description:
        col.description ||
        `Explore the ${label} collection at Aura Interiors – furniture and décor with delivery across Nepal.`,
      priority: "0.6",
      jsonLd: [...baseLd, breadcrumbJsonLd(crumbs)],
      body: `<main>
        ${crumbNav(crumbs)}
        <h1>${esc(label)}</h1>
        ${col.description ? `<p>${esc(col.description)}</p>` : ""}
        <p>Browse this collection in the <a href="/shop">Aura Interiors shop</a>.</p>
      </main>`,
    });
  }

  // ---- FAQ (content from the same faqData the page renders)
  pages.push({
    path: "/faq",
    title: "FAQs – Delivery, Returns & Warranty | Aura Interiors Nepal",
    description:
      "Answers about ordering furniture online from Aura Interiors: delivery across Nepal, returns, payment options and the AR View in Room feature.",
    priority: "0.5",
    jsonLd: baseLd,
    body: `<main>
      <h1>Frequently Asked Questions</h1>
      ${faqData
        .map(
          (section) => `<h2>${esc(section.category)}</h2>${section.questions
            .map((item) => `<h3>${esc(item.q)}</h3><p>${esc(item.a)}</p>`)
            .join("")}`,
        )
        .join("")}
    </main>`,
  });

  // ---- Contact (entity page)
  pages.push({
    path: "/contact",
    title: "Contact Aura Interiors – Furniture Store in Lalitpur, Nepal",
    description: `Contact Aura Interiors, Lalitpur: call ${CONTACT.phoneDisplay} or email ${CONTACT.email} for furniture enquiries, orders and delivery across Nepal.`,
    priority: "0.5",
    jsonLd: baseLd,
    body: `<main>
      <h1>Contact Aura Interiors</h1>
      <p>${esc(SITE_NAME)} is a furniture store based in ${esc(CONTACT.city)}, ${esc(CONTACT.country)}.</p>
      <ul>
        <li>Phone: <a href="tel:${esc(CONTACT.phoneInternational)}">${esc(CONTACT.phoneDisplay)}</a></li>
        <li>Email: <a href="mailto:${esc(CONTACT.email)}">${esc(CONTACT.email)}</a></li>
        <li>Location: ${esc(CONTACT.city)}, ${esc(CONTACT.region)}, ${esc(CONTACT.country)}</li>
      </ul>
    </main>`,
  });

  // ---- Write pages
  let written = 0;
  for (const page of pages) {
    const html = renderPage(template, page);
    const outPath =
      page.path === "/"
        ? path.join(distDir, "index.html")
        : path.join(distDir, `${page.path.slice(1)}.html`);
    await mkdir(path.dirname(outPath), { recursive: true });
    await writeFile(outPath, html);
    written += 1;
  }

  // ---- Sitemap
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .map(
    (p) => `  <url>
    <loc>${SITE_URL}${p.path}</loc>
    <lastmod>${p.lastmod || BUILD_DATE}</lastmod>
    <priority>${p.priority}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>
`;
  await writeFile(path.join(distDir, "sitemap.xml"), sitemap);

  // ---- robots.txt
  const robots = `# Aura Interiors – robots.txt (generated at build by scripts/prerender.mjs)
User-agent: *
Allow: /
Disallow: /checkout
Disallow: /profile
Disallow: /notifications
Disallow: /auth/
Disallow: /order-confirmation
Disallow: /ar/
Disallow: /native-ar
# Faceted/filter URLs are crawl traps; canonical category pages have no query string.
Disallow: /*?

# AI search crawlers are explicitly welcome (blocking OAI-SearchBot removes
# the site from ChatGPT search results).
User-agent: OAI-SearchBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Claude-SearchBot
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;
  await writeFile(path.join(distDir, "robots.txt"), robots);

  // ---- llms.txt (zero-expectation freebie; no major engine uses it yet)
  const llms = `# ${SITE_NAME}

> ${SITE_NAME} is an online furniture and home décor store based in ${CONTACT.city}, ${CONTACT.country}. It sells sofas, beds, dining sets, wardrobes, lighting and décor with prices in Nepali Rupees (NPR) and delivery across Nepal. Many products can be previewed in augmented reality (View in Room).

- Store: ${SITE_URL}/
- Shop all furniture: ${SITE_URL}/shop
- Contact: ${SITE_URL}/contact (phone ${CONTACT.phoneDisplay}, email ${CONTACT.email})
- FAQs: ${SITE_URL}/faq

## Categories
${indexedCategories.map((c) => `- ${c.name}: ${SITE_URL}/shop/${c.slug}`).join("\n")}

## Rooms
${rooms.map((r) => `- ${r.label}: ${SITE_URL}/rooms/${r.slug}`).join("\n")}
`;
  await writeFile(path.join(distDir, "llms.txt"), llms);

  console.log(
    `[prerender] wrote ${written} pages, sitemap (${pages.length} URLs), robots.txt, llms.txt → dist/customer/`,
  );
}

main().catch((err) => {
  console.error("[prerender] unexpected failure:", err);
  process.exit(1);
});
