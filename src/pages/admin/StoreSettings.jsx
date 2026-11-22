import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import settingsApi from "../../api/settingsApi";
import useAuthStore from "../../store/authStore";
import { toast } from "../../lib/toast";
import formatError from "../../utils/errorHandler";
import { composeBusinessHours } from "../../lib/businessHours";
import {
  SettingsPage,
  SettingsShell,
  SaveBar,
  SETTINGS_TABS,
} from "../../components/admin/settings/ui";
import IdentityTab from "../../components/admin/settings/tabs/IdentityTab";
import ThemeTab from "../../components/admin/settings/tabs/ThemeTab";
import ContactTab from "../../components/admin/settings/tabs/ContactTab";
import HomepageTab from "../../components/admin/settings/tabs/HomepageTab";
import SeoTab from "../../components/admin/settings/tabs/SeoTab";
import PagesTab from "../../components/admin/settings/tabs/PagesTab";
import OperationsTab from "../../components/admin/settings/tabs/OperationsTab";
import AdvancedTab from "../../components/admin/settings/tabs/AdvancedTab";

// Store Settings (Batch 3d redesign — reference Settings screens).
// One unified Settings experience with the Integrations route: this
// page hosts the Store Identity / Theme & Branding / Contact &
// Social / Homepage / SEO / Content Pages / Advanced tabs; the
// Integrations tab links to /dashboard/integrations, which renders
// the same header + tab bar.
//
// Saving is explicit per tab (sticky Cancel / Save Changes bar).
// Cancel restores the tab's fields to the last loaded snapshot.
// The Store Identity tab also saves the contact section when it is
// dirty, because its bottom strip edits contact fields (single
// source of truth). The Contact tab composes contact.hours from the
// structured business-hours rows when at least one day is open.

const TAB_SECTIONS = {
  identity: ["identity"],
  theme: ["theme"],
  contact: ["contact"],
  homepage: ["homepage"],
  seo: ["seo"],
  operations: ["commerce", "chat", "notifications"],
  pages: ["pages"],
  advanced: ["theme"],
};

const blankSettings = () => ({
  identity: {
    storeName: "",
    tagline: "",
    supportEmail: "",
    logoUrl: "",
    logoDarkUrl: "",
    faviconUrl: "",
  },
  theme: {
    primaryColor: "#F27318",
    primaryHoverColor: "#D9620E",
    navyColor: "#1E2C4A",
    fontFamily: "DM Sans",
    buttonRadius: "rounded",
    backgroundColor: "#f3f4f6",
    headerStyle: "light",
    darkMode: false,
    roundedCards: true,
    showShadows: true,
    customCss: "",
  },
  contact: {
    phone: "",
    email: "",
    address: "",
    hours: "",
    mapUrl: "",
    socials: {
      facebook: "",
      instagram: "",
      tiktok: "",
      youtube: "",
      pinterest: "",
      whatsapp: "",
      twitter: "",
      linkedin: "",
    },
    businessHours: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ].map((day) => ({ day, open: false, hours: "" })),
  },
  homepage: {
    heroSlides: [],
    promoBanner: {
      imageUrl: "",
      headline: "",
      subtext: "",
      buttonText: "",
      buttonLink: "",
      enabled: true,
    },
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
    announcementsEnabled: true,
    newsletterEnabled: true,
  },
  pages: {
    about: "",
    privacyPolicy: "",
    termsOfService: "",
    shippingInfo: "",
    returnsRefunds: "",
    faq: [],
  },
  seo: {
    siteUrl: "",
    defaultTitle: "",
    metaDescription: "",
    ogImage: "",
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
  // Batch 4 — Store Operations sections. Values mirror the server
  // defaults (which reproduce the store's current behaviour).
  commerce: {
    currency: "NPR",
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
    tax: { vatEnabled: false, vatRate: 13 },
    orders: { orderPrefix: "", lowStockThreshold: 10, minimumOrderAmount: 0 },
    paymentMethods: { cod: true, esewa: false, khalti: false, card: false },
  },
  chat: {
    enabled: true,
    aiAssistantEnabled: true,
    welcomeMessage: "",
    offlineMessage: "",
    businessHours: "",
  },
  notifications: {
    templates: {
      orderConfirmation: {
        subject: "Order Confirmation - {order_id} | {store_name}",
        heading: "Your {store_name} Order Has Been Confirmed! 🎉",
        body: "Thank you for shopping with {store_name}! We've received your order and it's now being processed.",
      },
      shippingNotification: {
        subject: "Your order {order_id} has shipped | {store_name}",
        heading: "Great news — your order is on its way!",
        body: "Hi {customer_name}, your order {order_id} has been shipped. {tracking_info}",
      },
      accountWelcome: {
        subject: "Welcome to {store_name}",
        heading: "Welcome, {customer_name}!",
        body: "We're thrilled to have you join the {store_name} community. Discover our curated collection of premium furniture and home decor designed to transform your living spaces.",
      },
      magicLink: {
        subject: "Your sign-in link for {store_name}",
        heading: "Sign in to {store_name}",
        body: "Hi {customer_name}, click the button below to sign in to your account. This link will expire in 15 minutes.",
      },
      lowStockAlert: {
        subject: "Low stock alert | {store_name}",
        heading: "A product is running low",
        body: "This is an automated alert from {store_name}: a product in your catalogue has fallen below the low-stock threshold you set. Please review your inventory and restock soon.",
      },
    },
  },
});

const mergeSettings = (loaded) => {
  const base = blankSettings();
  if (!loaded || typeof loaded !== "object") return base;
  const out = { ...base };
  for (const section of Object.keys(base)) {
    const value = loaded[section];
    if (!value || typeof value !== "object") continue;
    out[section] = { ...base[section], ...value };
    if (section === "contact") {
      out.contact.socials = {
        ...base.contact.socials,
        ...(value.socials || {}),
      };
      if (
        !Array.isArray(value.businessHours) ||
        value.businessHours.length !== 7
      ) {
        out.contact.businessHours = base.contact.businessHours;
      }
    }
    if (section === "homepage") {
      out.homepage.sections = {
        ...base.homepage.sections,
        ...(value.sections || {}),
      };
      out.homepage.promoBanner = {
        ...base.homepage.promoBanner,
        ...(value.promoBanner || {}),
      };
      if (!Array.isArray(value.heroSlides)) out.homepage.heroSlides = [];
      if (!Array.isArray(value.sectionsOrder) || !value.sectionsOrder.length) {
        out.homepage.sectionsOrder = base.homepage.sectionsOrder;
      }
    }
    if (section === "seo") {
      out.seo.features = { ...base.seo.features, ...(value.features || {}) };
      if (!Array.isArray(value.noindexPages)) out.seo.noindexPages = [];
    }
    if (section === "pages" && !Array.isArray(value.faq)) {
      out.pages.faq = [];
    }
    if (section === "commerce") {
      out.commerce.shipping = {
        ...base.commerce.shipping,
        ...(value.shipping || {}),
      };
      if (!Array.isArray(value.shipping?.zones)) {
        out.commerce.shipping.zones = base.commerce.shipping.zones;
      }
      out.commerce.tax = { ...base.commerce.tax, ...(value.tax || {}) };
      out.commerce.orders = {
        ...base.commerce.orders,
        ...(value.orders || {}),
      };
      out.commerce.paymentMethods = {
        ...base.commerce.paymentMethods,
        ...(value.paymentMethods || {}),
      };
    }
    if (section === "notifications") {
      out.notifications.templates = {
        ...base.notifications.templates,
        ...(value.templates || {}),
      };
    }
  }
  return out;
};

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export default function StoreSettings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const authRole = useAuthStore((s) => s.user?.role) || "admin";
  const isAdmin = authRole === "admin";
  const visibleTabs = SETTINGS_TABS.filter(
    (t) => t.key !== "advanced" || isAdmin,
  );
  const requestedTab = searchParams.get("tab");
  const activeTab = visibleTabs.some(
    (t) => t.key === requestedTab && t.key !== "integrations",
  )
    ? requestedTab
    : "identity";

  const [settings, setSettings] = useState(blankSettings);
  const [snapshot, setSnapshot] = useState(blankSettings);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await settingsApi.getSettings();
      const merged = mergeSettings(res?.data?.settings);
      setSettings(merged);
      setSnapshot(structuredClone(merged));
      setLoadError(null);
    } catch (err) {
      setLoadError(formatError(err, "Could not load store settings"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const patch = useCallback(
    (section) => (value) =>
      setSettings((prev) => ({
        ...prev,
        [section]: { ...prev[section], ...value },
      })),
    [],
  );

  const dirtySections = useMemo(() => {
    const sections = TAB_SECTIONS[activeTab] || [];
    const dirty = sections.filter(
      (section) => !same(settings[section], snapshot[section]),
    );
    // The identity tab's bottom strip edits contact fields.
    if (
      activeTab === "identity" &&
      !same(settings.contact, snapshot.contact) &&
      !dirty.includes("contact")
    ) {
      dirty.push("contact");
    }
    return dirty;
  }, [activeTab, settings, snapshot]);

  const isDirty = dirtySections.length > 0;

  const handleCancel = () => {
    setSettings((prev) => {
      const next = { ...prev };
      for (const section of dirtySections) {
        next[section] = structuredClone(snapshot[section]);
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!isDirty) return;
    setSaving(true);
    try {
      for (const section of dirtySections) {
        let payload = settings[section];
        if (section === "contact") {
          // Compose the footer/contact opening-hours line from the
          // structured rows when at least one day is open.
          const composed = composeBusinessHours(
            settings.contact.businessHours,
          );
          if (composed) payload = { ...payload, hours: composed };
        }
        // eslint-disable-next-line no-await-in-loop
        await settingsApi.updateSettingsSection(section, payload);
      }
      toast.success("Settings saved");
      await load();
    } catch (err) {
      toast.error(formatError(err, "Could not save settings"));
    } finally {
      setSaving(false);
    }
  };

  const selectTab = (id) => setSearchParams({ tab: id });

  const heroPreviewImage = useMemo(() => {
    const first = settings.homepage.heroSlides.find(
      (s) => s && s.enabled !== false && s.imageUrl,
    );
    const url = first?.imageUrl || "";
    return url.startsWith("http") || url.startsWith("/") ? url : "";
  }, [settings.homepage.heroSlides]);

  return (
    <SettingsPage>
      <SettingsShell activeTab={activeTab} onTabChange={selectTab} tabs={visibleTabs}>
        {loading ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-10 text-sm text-gray-500">
            Loading settings…
          </div>
        ) : loadError ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <p className="text-red-600 text-sm">{loadError}</p>
            <button
              type="button"
              onClick={load}
              className="mt-4 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            {activeTab === "identity" && (
              <IdentityTab
                identity={settings.identity}
                contact={settings.contact}
                theme={settings.theme}
                heroImage={heroPreviewImage}
                onIdentity={patch("identity")}
                onContact={patch("contact")}
              />
            )}
            {activeTab === "theme" && (
              <ThemeTab
                theme={settings.theme}
                identity={settings.identity}
                heroImage={heroPreviewImage}
                onTheme={patch("theme")}
              />
            )}
            {activeTab === "contact" && (
              <ContactTab
                contact={settings.contact}
                onContact={patch("contact")}
              />
            )}
            {activeTab === "homepage" && (
              <HomepageTab
                homepage={settings.homepage}
                onHomepage={patch("homepage")}
              />
            )}
            {activeTab === "seo" && (
              <SeoTab
                seo={settings.seo}
                identity={settings.identity}
                onSeo={patch("seo")}
              />
            )}
            {activeTab === "operations" && (
              <OperationsTab
                commerce={settings.commerce}
                chat={settings.chat}
                notifications={settings.notifications}
                onCommerce={patch("commerce")}
                onChat={patch("chat")}
                onNotifications={patch("notifications")}
              />
            )}
            {activeTab === "pages" && (
              <PagesTab pages={settings.pages} onPages={patch("pages")} />
            )}
            {activeTab === "advanced" && (
              <AdvancedTab
                theme={settings.theme}
                onTheme={patch("theme")}
                onReset={load}
              />
            )}
            <SaveBar
              dirty={isDirty}
              saving={saving}
              onCancel={handleCancel}
              onSave={handleSave}
            />
          </>
        )}
      </SettingsShell>
    </SettingsPage>
  );
}
