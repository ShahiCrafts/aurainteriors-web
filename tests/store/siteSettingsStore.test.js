// Site settings store (Batch 3b): starts at built-in defaults that
// mirror the current site, keeps them on fetch failure, and replaces
// them (merged over defaults) on a successful public-settings load.
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/api/index.js", () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
}));

import api from "../../src/api/index.js";
import useSiteSettingsStore, {
  DEFAULT_SITE_SETTINGS,
  mergeSiteSettings,
} from "../../src/store/siteSettingsStore.js";
import { getSeoDefaults, __resetSeoDefaults } from "../../src/seo/settingsBridge.js";

const serverSettings = {
  identity: {
    storeName: "Himalaya Living",
    tagline: "Redefine Your Space",
    supportEmail: "hello@himalaya.example",
    logoUrl: "https://cdn.example/logo.webp",
    logoDarkUrl: "",
    faviconUrl: "/favicon.png",
  },
  contact: { phone: "+977 9800000000", socials: { facebook: "https://fb.example/x" } },
  seo: { defaultTitle: "Himalaya Living – Home", metaDescription: "New desc", googleAnalyticsId: "G-TEST123" },
  commerce: { freeShippingThreshold: 9000 },
};

beforeEach(() => {
  useSiteSettingsStore.getState().resetSettings();
  __resetSeoDefaults();
});

describe("siteSettingsStore", () => {
  it("initial state equals the built-in defaults (current site values)", () => {
    const { settings, loaded } = useSiteSettingsStore.getState();
    expect(loaded).toBe(false);
    expect(settings).toEqual(DEFAULT_SITE_SETTINGS);
    expect(settings.identity.storeName).toBe("Aura Interiors");
    expect(settings.identity.logoUrl).toBe("/logo-aura-interiors.webp");
    expect(settings.theme.primaryColor).toBe("#F27318");
    expect(settings.theme.primaryHoverColor).toBe("#D9620E");
    expect(settings.theme.navyColor).toBe("#1E2C4A");
    expect(settings.contact.phone).toBe("+977 9866291003");
    expect(settings.homepage.heroSlides).toHaveLength(3);
    expect(settings.pages.faq).toHaveLength(10);
  });

  it("keeps the defaults when the fetch fails", async () => {
    api.get.mockRejectedValueOnce(new Error("network down"));
    const result = await useSiteSettingsStore.getState().load();
    const { settings, loaded, loadError } = useSiteSettingsStore.getState();
    expect(loaded).toBe(false);
    expect(loadError).toBe(true);
    expect(settings).toEqual(DEFAULT_SITE_SETTINGS);
    expect(result).toEqual(DEFAULT_SITE_SETTINGS);
    expect(getSeoDefaults()).toBeNull();
  });

  it("keeps the defaults when the response carries no settings", async () => {
    api.get.mockResolvedValueOnce({ data: { data: {} } });
    await useSiteSettingsStore.getState().load();
    expect(useSiteSettingsStore.getState().loaded).toBe(false);
    expect(useSiteSettingsStore.getState().settings).toEqual(DEFAULT_SITE_SETTINGS);
  });

  it("replaces values with the server settings on a successful load", async () => {
    api.get.mockResolvedValueOnce({ data: { data: { settings: serverSettings } } });
    await useSiteSettingsStore.getState().load();
    const { settings, loaded } = useSiteSettingsStore.getState();
    expect(loaded).toBe(true);
    expect(api.get).toHaveBeenCalledWith("/settings/public");
    expect(settings.identity.storeName).toBe("Himalaya Living");
    expect(settings.identity.logoUrl).toBe("https://cdn.example/logo.webp");
    expect(settings.contact.phone).toBe("+977 9800000000");
    // Untouched fields fall back to defaults through the merge.
    expect(settings.contact.address).toBe("Hattiban, Lalitpur, Nepal");
    expect(settings.contact.socials.facebook).toBe("https://fb.example/x");
    expect(settings.contact.socials.instagram).toBe("");
    expect(settings.theme.primaryColor).toBe("#F27318");
    expect(settings.commerce.freeShippingThreshold).toBe(9000);
    expect(settings.commerce.currency).toBe("NPR");
  });

  it("feeds the SEO defaults into the seo bridge on load", async () => {
    api.get.mockResolvedValueOnce({ data: { data: { settings: serverSettings } } });
    await useSiteSettingsStore.getState().load();
    expect(getSeoDefaults()).toMatchObject({
      defaultTitle: "Himalaya Living – Home",
      metaDescription: "New desc",
    });
  });

  it("mergeSiteSettings ignores unknown sections and non-objects", () => {
    expect(mergeSiteSettings(DEFAULT_SITE_SETTINGS, null)).toEqual(DEFAULT_SITE_SETTINGS);
    const merged = mergeSiteSettings(DEFAULT_SITE_SETTINGS, {
      bogus: { x: 1 },
      theme: { primaryColor: "#000000" },
    });
    expect(merged.bogus).toBeUndefined();
    expect(merged.theme.primaryColor).toBe("#000000");
    expect(merged.theme.navyColor).toBe("#1E2C4A");
  });
});
