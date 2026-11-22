import { create } from "zustand";
import publicSettingsApi from "../api/publicSettingsApi";
import { setSeoDefaultsFromSettings } from "../seo/settingsBridge";
import { setFormatConfigFromSettings } from "../utils/formatConfig";

// Site settings store (Batch 3b) — storefront consumer of the public
// settings API (GET /api/v1/settings/public, Batch 1/3a).
//
// HARD RULE (owner): with default settings the site must look and read
// exactly as it does today. So this store STARTS at built-in defaults
// that mirror the server defaults value-for-value (which themselves
// were extracted from the current site — see
// aurainteriors-server/services/settings/defaults.js), and load() only
// replaces them when the server answers. A failed or slow fetch
// changes nothing: first paint and prerendered output are untouched.
export const DEFAULT_SITE_SETTINGS = {
  identity: {
    storeName: "Aura Interiors",
    tagline: "Redefine Your Space",
    supportEmail: "support@aurainteriors.live",
    logoUrl: "/logo-aura-interiors.webp",
    logoDarkUrl: "",
    faviconUrl: "/favicon.png",
  },
  theme: {
    primaryColor: "#F27318",
    primaryHoverColor: "#D9620E",
    navyColor: "#1E2C4A",
    fontFamily: "DM Sans",
    buttonRadius: "rounded",
    // Batch 3d: mirror the server defaults — current page
    // background (index.html), white header, no dark mode, no
    // custom CSS.
    backgroundColor: "#f3f4f6",
    headerStyle: "light",
    darkMode: false,
    roundedCards: true,
    showShadows: true,
    customCss: "",
  },
  contact: {
    email: "support@aurainteriors.live",
    phone: "+977 9866291003",
    address: "Hattiban, Lalitpur, Nepal",
    hours: "",
    // Batch 3d: no published hours today — all days closed.
    businessHours: [
      { day: "Monday", open: false, hours: "" },
      { day: "Tuesday", open: false, hours: "" },
      { day: "Wednesday", open: false, hours: "" },
      { day: "Thursday", open: false, hours: "" },
      { day: "Friday", open: false, hours: "" },
      { day: "Saturday", open: false, hours: "" },
      { day: "Sunday", open: false, hours: "" },
    ],
    mapUrl: "",
    socials: {
      facebook: "",
      instagram: "",
      youtube: "",
      pinterest: "",
      tiktok: "",
      whatsapp: "",
      twitter: "",
      linkedin: "",
    },
  },
  seo: {
    siteUrl: "https://www.aurainteriors.live",
    defaultTitle: "Aura Interiors – Redefine Your Space",
    metaDescription:
      "Aura Interiors – Discover handcrafted furniture and home décor that transforms your living space. Shop sofas, beds, dining sets, wardrobes and more.",
    ogImage: "https://www.aurainteriors.live/promo-ad-banner.webp",
    twitterCard: "summary_large_image",
    googleAnalyticsId: "",
    metaPixelId: "",
    tiktokPixelId: "",
    googleMapsKey: "",
    // Batch 3d: mirror the server defaults — all gates on (current
    // behaviour), per-page canonicals, indexable, no forced noindex.
    features: {
      productSchema: true,
      breadcrumbs: true,
      openGraph: true,
      twitterCards: true,
      autoGenerateMeta: true,
    },
    canonicalUrl: "",
    defaultLanguage: "en-NP",
    indexingEnabled: true,
    noindexPages: [],
  },
  homepage: {
    sections: {
      hero: true,
      trustBanner: true,
      shopByCategory: true,
      featuredPieces: true,
      testimonials: true,
    },
    sectionsOrder: [
      "hero",
      "trustBanner",
      "shopByCategory",
      "featuredPieces",
      "testimonials",
    ],
    heroSlides: [
      {
        imageUrl:
          "src/assets/images/hero/hero-furniture-living-room-1200w.webp",
        headline: "Furniture That Fits You",
        subtext:
          "Discover our handpicked collection of timeless sofas and accent chairs — thoughtfully designed to bring warmth, character, and lasting comfort into every corner of your home.",
        buttonText: "Explore Now",
        buttonLink: "/shop?categories=living-room",
        enabled: true,
      },
      {
        imageUrl: "src/assets/images/hero/hero-bedroom-comfort-1200w.webp",
        headline: "Sleep in Pure Comfort",
        subtext:
          "Our premium king-size beds and orthopedic mattresses are engineered with adaptive support layers — so every night feels like your best one yet.",
        buttonText: "Shop Beds",
        buttonLink: "/shop?categories=bedroom",
        enabled: true,
      },
      {
        imageUrl: "src/assets/images/hero/hero-workspace-office-1200w.webp",
        headline: "Work From Anywhere",
        subtext:
          "From height-adjustable desks to cable-managed bookshelves, our workspace collection is built for deep focus, long hours, and a setup that actually inspires you.",
        buttonText: "View Office",
        buttonLink: "",
        enabled: true,
      },
    ],
    promoBanner: {
      imageUrl: "src/assets/images/hero/hero-decor-dining-room-1200w.webp",
      headline: "Calmora Bed Frame",
      subtext:
        "Handcrafted solid sheesham wood frame with a plush upholstered headboard",
      buttonText: "Shop Sale",
      buttonLink: "/shop?categories=bedroom",
      enabled: true,
    },
    announcementsEnabled: true,
    newsletterEnabled: true,
  },
  pages: {
    about: "",
    privacyPolicy: "",
    terms: "",
    shippingReturns: "",
    faq: [
      {
        question: "How do I place an order?",
        answer:
          "To place an order, browse our shop, select your desired items, and add them to your cart. Once you're ready, click on the cart icon and proceed to checkout. Follow the prompts to enter your shipping and payment information.",
      },
      {
        question: "Can I modify my order after it's placed?",
        answer:
          "We process orders quickly to ensure timely delivery. If you need to change or cancel your order, please contact our support team within 1 hour of placement. After this window, we may not be able to make changes.",
      },
      {
        question: "Do you offer financing options?",
        answer:
          "Yes, we partner with several financing providers to offer flexible payment plans. You can view available options during the checkout process.",
      },
      {
        question: "What are your shipping rates?",
        answer:
          "Shipping rates vary based on the item size and your location. Small items typically ship for a flat rate, while white-glove delivery for large furniture is calculated at checkout.",
      },
      {
        question: "How long will it take to receive my order?",
        answer:
          "Standard shipping takes 5-7 business days for in-stock items. Custom or larger furniture pieces may take 4-8 weeks. You can track your order status in the 'Track Order' section of our website.",
      },
      {
        question: "Do you deliver outside Nepal?",
        answer:
          "We currently deliver within Nepal, including the Kathmandu Valley and major cities across the country. We are not yet able to deliver internationally.",
      },
      {
        question: "What is your return policy?",
        answer:
          "We offer a 30-day return policy for most items in their original condition. Custom-made pieces aren't eligible for return unless they arrive damaged or defective.",
      },
      {
        question: "How do I start a return?",
        answer:
          "To initiate a return, log into your account, go to your 'Order History', and select the item you wish to return. You will receive a return label and instructions via email.",
      },
      {
        question: "How does the AR 'View in Room' feature work?",
        answer:
          "Simply browse a product on your mobile device and tap the 'View in AR' button. Our application uses your phone's camera to place a digital 3D model of the furniture in your space at actual scale.",
      },
      {
        question: "Which devices support AR features?",
        answer:
          "Most modern iOS (iPhone 6s and later) and Android devices with ARCore support are compatible. Ensure your browser is up to date for the best experience.",
      },
    ],
  },
  commerce: {
    currency: "NPR",
    // Batch 4: mirror the server defaults — Intl-derived NPR
    // display, free shipping (all zone rates 0), VAT off, no
    // minimum order. The storefront behaves exactly as before until
    // an admin changes these in Store Operations.
    currencySymbol: "NPR",
    symbolPosition: "before",
    numberFormat: "en-NP",
    dateFormat: "M/D/YYYY",
    timezone: "Asia/Kathmandu",
    locale: "en-NP",
    freeShippingThreshold: 5000,
    shipping: {
      enabled: true,
      deliveryEstimateText: "",
      zones: [
        { name: "Kathmandu Valley", rate: 0, enabled: true },
        { name: "Other Nepal", rate: 0, enabled: true },
        { name: "International", rate: 0, enabled: false },
      ],
      defaultZone: "Other Nepal",
    },
    tax: {
      vatEnabled: false,
      vatRate: 13,
    },
    orders: {
      minimumOrderAmount: 0,
    },
  },
  chat: {
    enabled: true,
    aiAssistantEnabled: true,
    welcomeMessage: "",
    // Batch 4: no offline state exists today — both start empty.
    offlineMessage: "",
    businessHours: "",
  },
  maintenance: {
    enabled: false,
    message: "",
  },
};

const isPlainObject = (v) =>
  v !== null && typeof v === "object" && !Array.isArray(v);

// Section-wise merge of a server payload over the built-in defaults:
// known sections merge field-by-field (nested plain objects one more
// level, so e.g. contact.socials keeps default keys the server omitted);
// arrays and scalars replace wholesale; unknown sections are ignored.
export const mergeSiteSettings = (defaults, incoming) => {
  if (!isPlainObject(incoming)) return defaults;
  const out = { ...defaults };
  for (const [section, defaultValue] of Object.entries(defaults)) {
    const inc = incoming[section];
    if (inc === undefined) continue;
    if (isPlainObject(defaultValue) && isPlainObject(inc)) {
      const merged = { ...defaultValue };
      for (const [key, value] of Object.entries(inc)) {
        if (isPlainObject(value) && isPlainObject(defaultValue[key])) {
          merged[key] = { ...defaultValue[key], ...value };
        } else if (value !== undefined) {
          merged[key] = value;
        }
      }
      out[section] = merged;
    } else if (inc !== undefined) {
      out[section] = inc;
    }
  }
  return out;
};

let loadPromise = null;

const useSiteSettingsStore = create((set, get) => ({
  settings: DEFAULT_SITE_SETTINGS,
  loaded: false,
  loadError: false,

  // Idempotent: concurrent/repeat calls share one in-flight request.
  // Never rejects — on failure the built-in defaults stay in place.
  load: () => {
    if (loadPromise) return loadPromise;
    loadPromise = (async () => {
      try {
        const incoming = await publicSettingsApi.getPublicSettings();
        if (incoming) {
          const merged = mergeSiteSettings(DEFAULT_SITE_SETTINGS, incoming);
          set({ settings: merged, loaded: true, loadError: false });
          setSeoDefaultsFromSettings(merged.seo, merged.identity?.storeName);
          setFormatConfigFromSettings(merged.commerce);
          return merged;
        }
        set({ loadError: true });
        return get().settings;
      } catch {
        set({ loadError: true });
        return get().settings;
      } finally {
        loadPromise = null;
      }
    })();
    return loadPromise;
  },

  // Direct state replacement (admin previews, tests).
  setSettings: (settings, loaded = true) => {
    set({ settings, loaded });
    setSeoDefaultsFromSettings(settings?.seo, settings?.identity?.storeName);
    setFormatConfigFromSettings(settings?.commerce);
  },
  resetSettings: () => {
    set({ settings: DEFAULT_SITE_SETTINGS, loaded: false, loadError: false });
    setSeoDefaultsFromSettings(null);
    setFormatConfigFromSettings(null);
  },
}));

export default useSiteSettingsStore;

// Non-hook access for code outside React components.
export const getSiteSettings = () => useSiteSettingsStore.getState().settings;

// Selector-friendly hook for components: useSiteSettings(s => s.settings.identity)
export const useSiteSettings = (selector) => useSiteSettingsStore(selector);
