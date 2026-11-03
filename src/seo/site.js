// Single source of truth for the site's public identity — used by the
// runtime <Seo> component and by scripts/prerender.mjs so the two can
// never drift. If the preferred host ever becomes www, change SITE_URL
// here only.
export const SITE_URL = "https://aurainteriors.live";
export const SITE_NAME = "Aura Interiors";
export const SITE_DESCRIPTION =
  "Aura Interiors – furniture and home décor made for Nepali homes. Shop sofas, beds, dining sets, wardrobes, lighting and décor online with delivery across Nepal.";

export const CONTACT = {
  email: "support@aurainteriors.live",
  phoneDisplay: "+977 9866291003",
  phoneInternational: "+9779866291003",
  street: "Hattiban",
  city: "Lalitpur",
  region: "Bagmati",
  country: "Nepal",
  countryCode: "NP",
};

export const DEFAULT_OG_IMAGE = `${SITE_URL}/promo-ad-banner.webp`;
export const LOGO_URL = `${SITE_URL}/logo-aura-interiors.webp`;

export const absoluteUrl = (path = "/") => {
  const raw = String(path || "/");
  if (raw.includes("://")) return raw;
  return SITE_URL + (raw.startsWith("/") ? raw : "/" + raw);
};

export const formatNPR = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return "";
  return `Rs. ${Math.round(n).toLocaleString("en-IN")}`;
};
