// Leaf bridge between the site-settings store and the SEO module.
//
// Why a bridge: scripts/prerender.mjs imports src/seo/seo.js in plain
// Node at build time, so seo.js must never import the zustand store or
// the axios api layer. This module has zero imports — the settings
// store pushes the server-provided SEO defaults in here after a
// successful load, and applyHead (seo.js) reads them as fallbacks.
// Until a load happens (or if it fails) the holder stays null and
// applyHead uses exactly the constants it has always used.

let seoDefaults = null;

// The admin's Default Title Pattern may contain {store_name}, which
// is substituted with the store name at bridge time so applyHead and
// the head-alignment effect both see the final string. Patterns
// without the token pass through untouched (the shipped default has
// none, so nothing changes).
export const substituteStoreName = (pattern, storeName) => {
  if (!pattern) return "";
  if (!storeName) return pattern;
  return pattern.split("{store_name}").join(storeName);
};

export const setSeoDefaultsFromSettings = (seo, storeName) => {
  if (!seo || typeof seo !== "object") {
    seoDefaults = null;
    return;
  }
  seoDefaults = {
    defaultTitle: substituteStoreName(seo.defaultTitle || "", storeName),
    metaDescription: seo.metaDescription || "",
    ogImage: seo.ogImage || "",
    twitterCard: seo.twitterCard || "",
    // Batch 3d: runtime-head gates + canonical/language controls.
    // Missing values fall back to current behaviour (all features
    // on, per-page canonical, indexable, no forced noindex).
    features: {
      productSchema: seo.features?.productSchema !== false,
      breadcrumbs: seo.features?.breadcrumbs !== false,
      openGraph: seo.features?.openGraph !== false,
      twitterCards: seo.features?.twitterCards !== false,
      autoGenerateMeta: seo.features?.autoGenerateMeta !== false,
    },
    canonicalUrl: seo.canonicalUrl || "",
    defaultLanguage: seo.defaultLanguage || "",
    indexingEnabled: seo.indexingEnabled !== false,
    noindexPages: Array.isArray(seo.noindexPages) ? seo.noindexPages : [],
  };
};

export const getSeoDefaults = () => seoDefaults;

// Test-only reset so suites can isolate the module-level holder.
export const __resetSeoDefaults = () => {
  seoDefaults = null;
};
